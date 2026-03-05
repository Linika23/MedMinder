// ============================================================
// RxNorm Interaction Service
// Uses the free NIH RxNorm Interaction API for clinical data
// ============================================================

import { Injectable, Logger } from '@nestjs/common';

interface RxNormInteraction {
    drugA: string;
    drugB: string;
    severity: 'critical' | 'major' | 'moderate' | 'mild' | 'none';
    description: string;
    source: string;
}

@Injectable()
export class RxNormInteractionService {
    private readonly logger = new Logger(RxNormInteractionService.name);
    private readonly BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

    /**
     * Resolve a drug name to its RxCUI (RxNorm Concept Unique Identifier).
     */
    async resolveRxcui(drugName: string): Promise<string | null> {
        try {
            const url = `${this.BASE_URL}/rxcui.json?name=${encodeURIComponent(drugName)}&search=1`;
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            return data?.idGroup?.rxnormId?.[0] || null;
        } catch (error) {
            this.logger.warn(`RxCUI resolution failed for ${drugName}: ${error}`);
            return null;
        }
    }

    /**
     * Get all known interactions for a drug via its RxCUI.
     * Uses the NIH Interaction API (free, no key required).
     */
    async getInteractionsByRxcui(rxcui: string): Promise<RxNormInteraction[]> {
        try {
            const url = `${this.BASE_URL}/interaction/interaction.json?rxcui=${rxcui}&sources=DrugBank,ONCHigh`;
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            const groups = data?.interactionTypeGroup || [];
            const results: RxNormInteraction[] = [];

            for (const group of groups) {
                const source = group.sourceName || 'RxNorm';
                for (const type of group.interactionType || []) {
                    for (const pair of type.interactionPair || []) {
                        const concepts = pair.interactionConcept || [];
                        if (concepts.length < 2) continue;

                        const severity = this.mapSeverity(pair.severity || type.comment || '');

                        results.push({
                            drugA: concepts[0].minConceptItem?.name || '',
                            drugB: concepts[1].minConceptItem?.name || '',
                            severity,
                            description: pair.description || '',
                            source,
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            this.logger.warn(`RxNorm interaction lookup failed for rxcui=${rxcui}: ${error}`);
            return [];
        }
    }

    /**
     * Check interactions between multiple drugs by resolving names to RxCUIs
     * and querying the pairwise interaction API.
     */
    async checkInteractionsByNames(drugNames: string[]): Promise<RxNormInteraction[]> {
        // Resolve all drug names to RxCUIs concurrently
        const rxcuiMap = new Map<string, string>();
        const resolvePromises = drugNames.map(async (name) => {
            const rxcui = await this.resolveRxcui(name);
            if (rxcui) rxcuiMap.set(name, rxcui);
        });
        await Promise.all(resolvePromises);

        if (rxcuiMap.size < 2) return [];

        // Use the multi-interaction API if available
        const rxcuis = Array.from(rxcuiMap.values());
        return this.checkMultipleInteractions(rxcuis);
    }

    /**
     * Check interactions between a list of RxCUIs.
     */
    async checkMultipleInteractions(rxcuis: string[]): Promise<RxNormInteraction[]> {
        try {
            const rxcuiList = rxcuis.join('+');
            const url = `${this.BASE_URL}/interaction/list.json?rxcuis=${rxcuiList}&sources=DrugBank,ONCHigh`;
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json();
            const groups = data?.fullInteractionTypeGroup || [];
            const results: RxNormInteraction[] = [];

            for (const group of groups) {
                const source = group.sourceName || 'RxNorm';
                for (const type of group.fullInteractionType || []) {
                    for (const pair of type.interactionPair || []) {
                        const concepts = pair.interactionConcept || [];
                        if (concepts.length < 2) continue;

                        results.push({
                            drugA: concepts[0].minConceptItem?.name || '',
                            drugB: concepts[1].minConceptItem?.name || '',
                            severity: this.mapSeverity(pair.severity || ''),
                            description: pair.description || '',
                            source,
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            this.logger.warn(`RxNorm multi-interaction lookup failed: ${error}`);
            return [];
        }
    }

    private mapSeverity(raw: string): RxNormInteraction['severity'] {
        const lower = raw.toLowerCase();
        if (lower.includes('high') || lower.includes('critical') || lower.includes('contraindicated')) return 'critical';
        if (lower.includes('serious') || lower.includes('major')) return 'major';
        if (lower.includes('moderate')) return 'moderate';
        if (lower.includes('minor') || lower.includes('mild') || lower.includes('low')) return 'mild';
        return 'moderate';
    }
}
