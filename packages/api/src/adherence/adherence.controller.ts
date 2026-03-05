import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdherenceService } from './adherence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/adherence')
@UseGuards(JwtAuthGuard)
export class AdherenceController {
    constructor(private readonly adherenceService: AdherenceService) { }

    @Get('stats')
    async getStats(@CurrentUser('id') userId: string) {
        const score = await this.adherenceService.getOverallScore(userId);
        return { success: true, data: score };
    }

    @Get('weekly')
    async getWeekly(@CurrentUser('id') userId: string) {
        const data = await this.adherenceService.getWeeklyStats(userId);
        return { success: true, data };
    }

    @Get('monthly')
    async getMonthly(
        @CurrentUser('id') userId: string,
        @Query('year') year: string,
        @Query('month') month: string,
    ) {
        const data = await this.adherenceService.getMonthlyHeatmap(userId, parseInt(year), parseInt(month));
        return { success: true, data };
    }

    @Get('per-medication')
    async getPerMedication(@CurrentUser('id') userId: string) {
        const data = await this.adherenceService.getPerMedication(userId);
        return { success: true, data };
    }
}
