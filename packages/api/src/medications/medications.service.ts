// ============================================================
// Medications Service — CRUD + Search + Cache Invalidation
// ============================================================

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionCacheService } from '../interactions/interaction-cache.service';
import { CreateMedicationInput, UpdateMedicationInput } from '@medminder/shared';

@Injectable()
export class MedicationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly interactionCache: InteractionCacheService,
    ) { }

    async create(userId: string, data: CreateMedicationInput) {
        const medication = await this.prisma.medication.create({
            data: {
                userId,
                name: data.name,
                dosage: data.dosage,
                unit: data.unit,
                frequency: data.frequency as any,
                medicationType: data.medicationType,
                instructions: data.instructions,
                withFood: data.withFood,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                quantityOnHand: data.quantityOnHand,
                refillThreshold: data.refillThreshold,
                ndcCode: data.ndcCode,
                pillColor: data.pillColor,
                pillShape: data.pillShape,
                prescribingDoctor: data.prescribingDoctor,
                pharmacy: data.pharmacy,
                reason: data.reason,
            },
        });

        // Invalidate interaction cache — new medication may have interactions
        await this.interactionCache.invalidateForUser(userId);

        return medication;
    }

    async findAllForUser(userId: string) {
        return this.prisma.medication.findMany({
            where: { userId },
            orderBy: [{ status: 'asc' }, { name: 'asc' }],
        });
    }

    async findOne(id: string, userId: string) {
        const medication = await this.prisma.medication.findUnique({ where: { id } });
        if (!medication) throw new NotFoundException('Medication not found');
        if (medication.userId !== userId) throw new ForbiddenException();
        return medication;
    }

    async update(id: string, userId: string, data: UpdateMedicationInput) {
        await this.findOne(id, userId); // ownership check
        const medication = await this.prisma.medication.update({
            where: { id },
            data: {
                ...data,
                frequency: data.frequency as any,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });

        // Invalidate interaction cache — medication name/dosage may have changed
        await this.interactionCache.invalidateForUser(userId);

        return medication;
    }

    async remove(id: string, userId: string, permanent = false) {
        await this.findOne(id, userId); // ownership check

        let result;
        if (permanent) {
            result = await this.prisma.medication.delete({ where: { id } });
        } else {
            result = await this.prisma.medication.update({
                where: { id },
                data: { status: 'discontinued' },
            });
        }

        // Invalidate interaction cache — removed medication changes interaction landscape
        await this.interactionCache.invalidateForUser(userId);

        return result;
    }
}
