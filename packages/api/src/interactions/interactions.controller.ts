// ============================================================
// Interactions Controller — Full AI-powered
// ============================================================

import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { checkInteractionsSchema } from '@medminder/shared';

@Controller('api/interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
    constructor(private readonly interactionsService: InteractionsService) { }

    /**
     * POST /api/interactions/check
     * Run a full interaction check for selected medications.
     * This queries OpenFDA + RxNorm, generates AI summaries, and caches results.
     */
    @Post('check')
    async checkInteractions(@CurrentUser('id') userId: string, @Body() body: unknown) {
        const validated = checkInteractionsSchema.parse(body);
        const interactions = await this.interactionsService.checkInteractions(
            userId,
            validated.medicationIds,
        );
        return {
            success: true,
            data: interactions,
            meta: {
                totalChecked: interactions.length,
                criticalCount: interactions.filter((i) => i.severity === 'critical').length,
                majorCount: interactions.filter((i) => i.severity === 'major').length,
                cachedCount: interactions.filter((i) => i.cached).length,
            },
        };
    }

    /**
     * POST /api/interactions/check-all
     * Check all active medications for the user at once.
     */
    @Post('check-all')
    async checkAllInteractions(@CurrentUser('id') userId: string) {
        // Get all active medication IDs for this user
        const meds = await this.interactionsService['prisma'].medication.findMany({
            where: { userId, status: 'active' },
            select: { id: true },
        });

        const medicationIds = meds.map((m) => m.id);
        if (medicationIds.length < 2) {
            return {
                success: true,
                data: [],
                meta: { totalChecked: 0, message: 'Need at least 2 active medications to check interactions.' },
            };
        }

        const interactions = await this.interactionsService.checkInteractions(userId, medicationIds);
        return {
            success: true,
            data: interactions,
            meta: {
                totalChecked: interactions.length,
                criticalCount: interactions.filter((i) => i.severity === 'critical').length,
                majorCount: interactions.filter((i) => i.severity === 'major').length,
                cachedCount: interactions.filter((i) => i.cached).length,
            },
        };
    }

    /**
     * GET /api/interactions
     * List all stored interactions for the user.
     */
    @Get()
    async findAll(@CurrentUser('id') userId: string) {
        const interactions = await this.interactionsService.getForUser(userId);
        return { success: true, data: interactions };
    }

    /**
     * GET /api/interactions/:id
     * Get a single interaction detail.
     */
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
        const interaction = await this.interactionsService.getById(id, userId);
        return { success: true, data: interaction };
    }

    /**
     * POST /api/interactions/invalidate-cache
     * Force-refresh all cached interactions for the user.
     */
    @Post('invalidate-cache')
    async invalidateCache(@CurrentUser('id') userId: string) {
        await this.interactionsService.invalidateCache(userId);
        return { success: true, message: 'Interaction cache invalidated' };
    }
}
