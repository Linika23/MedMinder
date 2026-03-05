// ============================================================
// Medications Controller
// ============================================================

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { createMedicationSchema, updateMedicationSchema } from '@medminder/shared';

@Controller('api/medications')
@UseGuards(JwtAuthGuard)
export class MedicationsController {
    constructor(private readonly medicationsService: MedicationsService) { }

    @Post()
    async create(@CurrentUser('id') userId: string, @Body() body: unknown) {
        const validated = createMedicationSchema.parse(body);
        const medication = await this.medicationsService.create(userId, validated);
        return { success: true, data: medication };
    }

    @Get()
    async findAll(@CurrentUser('id') userId: string) {
        const medications = await this.medicationsService.findAllForUser(userId);
        return { success: true, data: medications };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
        const medication = await this.medicationsService.findOne(id, userId);
        return { success: true, data: medication };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Body() body: unknown,
    ) {
        const validated = updateMedicationSchema.parse(body);
        const medication = await this.medicationsService.update(id, userId, validated);
        return { success: true, data: medication };
    }

    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @CurrentUser('id') userId: string,
        @Query('permanent') permanent?: string,
    ) {
        const medication = await this.medicationsService.remove(
            id,
            userId,
            permanent === 'true',
        );
        return { success: true, data: medication };
    }
}
