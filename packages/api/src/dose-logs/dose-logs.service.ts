import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoseLogInput, UpdateDoseLogInput, DoseLogQueryInput } from '@medminder/shared';

@Injectable()
export class DoseLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, data: CreateDoseLogInput) {
        return this.prisma.doseLog.create({
            data: {
                userId,
                medicationId: data.medicationId,
                scheduledTime: new Date(data.scheduledTime),
                actualTime: data.actualTime ? new Date(data.actualTime) : undefined,
                status: data.status,
                notes: data.notes,
            },
        });
    }

    async findForUser(userId: string, query: DoseLogQueryInput) {
        const where: any = { userId };
        if (query.medicationId) where.medicationId = query.medicationId;
        if (query.status) where.status = query.status;
        if (query.from || query.to) {
            where.scheduledTime = {};
            if (query.from) where.scheduledTime.gte = new Date(query.from);
            if (query.to) where.scheduledTime.lte = new Date(query.to);
        }

        const [data, total] = await Promise.all([
            this.prisma.doseLog.findMany({
                where,
                orderBy: { scheduledTime: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                include: { medication: { select: { name: true, dosage: true, unit: true } } },
            }),
            this.prisma.doseLog.count({ where }),
        ]);

        return {
            data,
            meta: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    async update(id: string, userId: string, data: UpdateDoseLogInput) {
        const log = await this.prisma.doseLog.findUnique({ where: { id } });
        if (!log) throw new NotFoundException('Dose log not found');
        if (log.userId !== userId) throw new ForbiddenException();

        return this.prisma.doseLog.update({
            where: { id },
            data: {
                actualTime: data.actualTime ? new Date(data.actualTime) : undefined,
                status: data.status,
                notes: data.notes,
            },
        });
    }
}
