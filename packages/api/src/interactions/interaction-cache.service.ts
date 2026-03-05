// ============================================================
// Interaction Cache Service
// Caches interaction results to avoid redundant API calls
// Uses both in-memory cache and database persistence
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

interface CachedInteraction {
    drugA: string;
    drugB: string;
    severity: string;
    description: string;
    aiSummary: string | null;
    mechanism: string | null;
    symptoms: string[];
    recommendations: string[];
    source: string;
    cachedAt: Date;
}

@Injectable()
export class InteractionCacheService {
    private readonly logger = new Logger(InteractionCacheService.name);
    private readonly memoryCache = new Map<string, { data: CachedInteraction; expiresAt: number }>();
    private readonly MEMORY_TTL_MS = 30 * 60 * 1000; // 30 minutes
    private readonly DB_TTL_HOURS = 24 * 7; // 7 days

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate a deterministic cache key for a drug pair.
     * Normalises order so (A,B) and (B,A) share the same key.
     */
    getCacheKey(drugA: string, drugB: string): string {
        const sorted = [drugA.toLowerCase().trim(), drugB.toLowerCase().trim()].sort();
        return createHash('sha256').update(sorted.join('||')).digest('hex').slice(0, 16);
    }

    /**
     * Check memory cache first, then database.
     */
    async get(drugA: string, drugB: string, userId: string): Promise<CachedInteraction | null> {
        const key = this.getCacheKey(drugA, drugB);

        // 1. Memory cache check
        const memoryCached = this.memoryCache.get(key);
        if (memoryCached && memoryCached.expiresAt > Date.now()) {
            this.logger.debug(`Memory cache hit for ${drugA} + ${drugB}`);
            return memoryCached.data;
        }

        // 2. Database cache check
        try {
            const dbCached = await this.prisma.interaction.findFirst({
                where: {
                    userId,
                    medA: { name: { contains: drugA, mode: 'insensitive' } },
                    medB: { name: { contains: drugB, mode: 'insensitive' } },
                    cachedAt: { gte: new Date(Date.now() - this.DB_TTL_HOURS * 3600000) },
                },
                include: {
                    medA: { select: { name: true } },
                    medB: { select: { name: true } },
                },
            });

            if (dbCached) {
                this.logger.debug(`DB cache hit for ${drugA} + ${drugB}`);
                const cached: CachedInteraction = {
                    drugA: dbCached.medA.name,
                    drugB: dbCached.medB.name,
                    severity: dbCached.severity,
                    description: dbCached.description || '',
                    aiSummary: dbCached.aiSummary,
                    mechanism: dbCached.mechanism,
                    symptoms: dbCached.symptoms || [],
                    recommendations: dbCached.recommendations || [],
                    source: dbCached.source,
                    cachedAt: dbCached.cachedAt || new Date(),
                };

                // Warm memory cache
                this.memoryCache.set(key, { data: cached, expiresAt: Date.now() + this.MEMORY_TTL_MS });
                return cached;
            }
        } catch (error) {
            this.logger.warn(`DB cache lookup failed: ${error}`);
        }

        return null;
    }

    /**
     * Store an interaction result in both memory and database.
     */
    async set(
        userId: string,
        medAId: string,
        medBId: string,
        data: Omit<CachedInteraction, 'cachedAt'>,
    ): Promise<void> {
        const key = this.getCacheKey(data.drugA, data.drugB);
        const now = new Date();

        // Memory cache
        this.memoryCache.set(key, {
            data: { ...data, cachedAt: now },
            expiresAt: Date.now() + this.MEMORY_TTL_MS,
        });

        // Database upsert
        try {
            await this.prisma.interaction.upsert({
                where: {
                    userId_medAId_medBId: { userId, medAId, medBId },
                },
                create: {
                    userId,
                    medAId,
                    medBId,
                    severity: data.severity as any,
                    description: data.description,
                    aiSummary: data.aiSummary,
                    mechanism: data.mechanism,
                    symptoms: data.symptoms,
                    recommendations: data.recommendations,
                    source: data.source,
                    cachedAt: now,
                },
                update: {
                    severity: data.severity as any,
                    description: data.description,
                    aiSummary: data.aiSummary,
                    mechanism: data.mechanism,
                    symptoms: data.symptoms,
                    recommendations: data.recommendations,
                    source: data.source,
                    cachedAt: now,
                },
            });
        } catch (error) {
            this.logger.warn(`DB cache write failed: ${error}`);
        }
    }

    /**
     * Invalidate cache for a specific drug pair.
     */
    invalidate(drugA: string, drugB: string): void {
        const key = this.getCacheKey(drugA, drugB);
        this.memoryCache.delete(key);
    }

    /**
     * Invalidate all cached interactions for a user (e.g. when medications change).
     */
    async invalidateForUser(userId: string): Promise<void> {
        // Clear all memory cache entries (brute force for simplicity)
        this.memoryCache.clear();

        // Mark DB entries as stale
        await this.prisma.interaction.updateMany({
            where: { userId },
            data: { cachedAt: new Date(0) }, // set to epoch = expired
        });
    }

    /**
     * Get cache statistics for debugging.
     */
    getStats() {
        return {
            memoryCacheSize: this.memoryCache.size,
            memoryTtlMinutes: this.MEMORY_TTL_MS / 60000,
            dbTtlHours: this.DB_TTL_HOURS,
        };
    }
}
