import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DoseLogsService } from './dose-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { createDoseLogSchema, updateDoseLogSchema, doseLogQuerySchema } from '@medminder/shared';

@Controller('api/dose-logs')
@UseGuards(JwtAuthGuard)
export class DoseLogsController {
    constructor(private readonly doseLogsService: DoseLogsService) { }

    @Post()
    async create(@CurrentUser('id') userId: string, @Body() body: unknown) {
        const validated = createDoseLogSchema.parse(body);
        const doseLog = await this.doseLogsService.create(userId, validated);
        return { success: true, data: doseLog };
    }

    @Get()
    async findAll(@CurrentUser('id') userId: string, @Query() query: unknown) {
        const validated = doseLogQuerySchema.parse(query);
        const result = await this.doseLogsService.findForUser(userId, validated);
        return { success: true, ...result };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Body() body: unknown,
    ) {
        const validated = updateDoseLogSchema.parse(body);
        const doseLog = await this.doseLogsService.update(id, userId, validated);
        return { success: true, data: doseLog };
    }
}
