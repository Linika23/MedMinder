// ============================================================
// Interactions Service — Orchestrator
// Combines OpenFDA + RxNorm data, AI summaries, and caching
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenFdaService } from './openfda.service';
import { RxNormInteractionService } from './rxnorm-interaction.service';
import { AiSummaryService } from './ai-summary.service';
import { InteractionCacheService } from './interaction-cache.service';

interface InteractionResult {
    id?: string;
    medAId: string;
    medBId: string;
    medAName: string;
    medBName: string;
    medADosage?: string;
    medBDosage?: string;
    severity: string;
    description: string;
    aiSummary: string | null;
    mechanism: string | null;
    symptoms: string[];
    recommendations: string[];
    source: string;
    cached: boolean;
}

@Injectable()
export class InteractionsService {
    private readonly logger = new Logger(InteractionsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly openFda: OpenFdaService,
        private readonly rxNorm: RxNormInteractionService,
        private readonly aiSummary: AiSummaryService,
        private readonly cache: InteractionCacheService,
    ) { }

    /**
     * Run a full interaction check for the user's medications.
     * 1. Loads medication details from DB
     * 2. Checks cache for each pair
     * 3. Queries OpenFDA + RxNorm for uncached pairs
     * 4. Generates AI summaries
     * 5. Stores results in cache
     */
    async checkInteractions(userId: string, medicationIds: string[]): Promise<InteractionResult[]> {
        // 1. Load medications
        const medications = await this.prisma.medication.findMany({
            where: { id: { in: medicationIds }, userId },
            select: { id: true, name: true, dosage: true, unit: true },
        });

        if (medications.length < 2) return [];

        // Load user's health profile for personalised AI summaries
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { dateOfBirth: true, conditions: true },
        });
        const patientAge = user?.dateOfBirth
            ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / 31557600000)
            : undefined;

        // 2. Generate all unique pairs
        const results: InteractionResult[] = [];
        const uncachedPairs: { medA: typeof medications[0]; medB: typeof medications[0] }[] = [];

        for (let i = 0; i < medications.length; i++) {
            for (let j = i + 1; j < medications.length; j++) {
                const medA = medications[i];
                const medB = medications[j];

                // Check cache
                const cached = await this.cache.get(medA.name, medB.name, userId);
                if (cached) {
                    results.push({
                        medAId: medA.id,
                        medBId: medB.id,
                        medAName: medA.name,
                        medBName: medB.name,
                        medADosage: medA.dosage ? `${medA.dosage} ${medA.unit || ''}`.trim() : undefined,
                        medBDosage: medB.dosage ? `${medB.dosage} ${medB.unit || ''}`.trim() : undefined,
                        severity: cached.severity,
                        description: cached.description,
                        aiSummary: cached.aiSummary,
                        mechanism: cached.mechanism,
                        symptoms: cached.symptoms,
                        recommendations: cached.recommendations,
                        source: cached.source,
                        cached: true,
                    });
                } else {
                    uncachedPairs.push({ medA, medB });
                }
            }
        }

        // 3. Query external APIs for uncached pairs
        if (uncachedPairs.length > 0) {
            const drugNames = [...new Set(uncachedPairs.flatMap((p) => [p.medA.name, p.medB.name]))];

            // Query both APIs concurrently
            const [rxNormResults, openFdaResults] = await Promise.all([
                this.rxNorm.checkInteractionsByNames(drugNames).catch(() => []),
                this.openFda.checkAllPairs(drugNames).catch(() => []),
            ]);

            // Process each uncached pair
            for (const { medA, medB } of uncachedPairs) {
                // Find matching results from either API
                const rxMatch = rxNormResults.find(
                    (r) =>
                        (r.drugA.toLowerCase().includes(medA.name.toLowerCase()) && r.drugB.toLowerCase().includes(medB.name.toLowerCase())) ||
                        (r.drugA.toLowerCase().includes(medB.name.toLowerCase()) && r.drugB.toLowerCase().includes(medA.name.toLowerCase())),
                );

                const fdaMatch = openFdaResults.find(
                    (r) =>
                        (r.drugA.toLowerCase() === medA.name.toLowerCase() && r.drugB.toLowerCase() === medB.name.toLowerCase()) ||
                        (r.drugA.toLowerCase() === medB.name.toLowerCase() && r.drugB.toLowerCase() === medA.name.toLowerCase()),
                );

                // Merge results — prefer RxNorm (more structured) but use OpenFDA as supplement
                const rawData = rxMatch || fdaMatch;

                const severity = rawData?.severity || 'none';
                const description = rawData?.description || 'No known interaction reported.';
                const mechanism = (fdaMatch as any)?.mechanism || undefined;
                const symptoms = (fdaMatch as any)?.symptoms || [];
                const source = [rxMatch ? 'RxNorm/DrugBank' : '', fdaMatch ? 'OpenFDA' : ''].filter(Boolean).join(' + ') || 'No data';

                // 4. Generate AI summary
                const aiResult = severity !== 'none'
                    ? await this.aiSummary.generateSummary({
                        drugA: medA.name,
                        drugADosage: medA.dosage ? `${medA.dosage} ${medA.unit || ''}`.trim() : undefined,
                        drugB: medB.name,
                        drugBDosage: medB.dosage ? `${medB.dosage} ${medB.unit || ''}`.trim() : undefined,
                        severity,
                        rawDescription: description,
                        mechanism,
                        symptoms,
                        patientConditions: user?.conditions,
                        patientAge,
                    })
                    : { summary: 'No known interaction between these medications.', recommendations: ['Continue current regimen as prescribed.'], riskFactors: [] };

                const result: InteractionResult = {
                    medAId: medA.id,
                    medBId: medB.id,
                    medAName: medA.name,
                    medBName: medB.name,
                    medADosage: medA.dosage ? `${medA.dosage} ${medA.unit || ''}`.trim() : undefined,
                    medBDosage: medB.dosage ? `${medB.dosage} ${medB.unit || ''}`.trim() : undefined,
                    severity,
                    description,
                    aiSummary: aiResult.summary,
                    mechanism: aiResult.simplifiedMechanism || mechanism || null,
                    symptoms,
                    recommendations: aiResult.recommendations,
                    source,
                    cached: false,
                };

                results.push(result);

                // 5. Cache the result
                await this.cache.set(userId, medA.id, medB.id, {
                    drugA: medA.name,
                    drugB: medB.name,
                    severity: result.severity,
                    description: result.description,
                    aiSummary: result.aiSummary,
                    mechanism: result.mechanism,
                    symptoms: result.symptoms,
                    recommendations: result.recommendations,
                    source: result.source,
                });
            }
        }

        // Sort by severity (critical first)
        const severityOrder = ['critical', 'major', 'moderate', 'mild', 'none'];
        results.sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity));

        // Log audit event
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'interaction_check',
                resource: 'interactions',
                details: {
                    medicationCount: medicationIds.length,
                    interactionsFound: results.filter((r) => r.severity !== 'none').length,
                    cachedResults: results.filter((r) => r.cached).length,
                },
            },
        });

        return results;
    }

    async getForUser(userId: string) {
        return this.prisma.interaction.findMany({
            where: { userId },
            include: {
                medA: { select: { name: true, dosage: true, unit: true } },
                medB: { select: { name: true, dosage: true, unit: true } },
            },
            orderBy: { severity: 'asc' },
        });
    }

    async getById(id: string, userId: string) {
        return this.prisma.interaction.findFirst({
            where: { id, userId },
            include: {
                medA: { select: { name: true, dosage: true, unit: true } },
                medB: { select: { name: true, dosage: true, unit: true } },
            },
        });
    }

    /**
     * Invalidate all cached interactions when a user's medications change.
     */
    async invalidateCache(userId: string) {
        await this.cache.invalidateForUser(userId);
    }
}
