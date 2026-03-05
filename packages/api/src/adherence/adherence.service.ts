// ============================================================
// Adherence Service — Full Analytics Engine
// ============================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdherenceService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Overall adherence stats for the user.
     */
    async getOverallScore(userId: string) {
        const [total, taken, streak] = await Promise.all([
            this.prisma.doseLog.count({ where: { userId, status: { not: 'pending' } } }),
            this.prisma.doseLog.count({ where: { userId, status: { in: ['taken_on_time', 'taken_late'] } } }),
            this.calculateCurrentStreak(userId),
        ]);

        const onTime = await this.prisma.doseLog.count({ where: { userId, status: 'taken_on_time' } });
        const skipped = await this.prisma.doseLog.count({ where: { userId, status: 'skipped' } });
        const late = await this.prisma.doseLog.count({ where: { userId, status: 'taken_late' } });

        return {
            overallScore: total > 0 ? Math.round((taken / total) * 100) : 100,
            onTimeRate: total > 0 ? Math.round((onTime / total) * 100) : 100,
            totalDoses: total,
            takenOnTime: onTime,
            takenLate: late,
            skipped,
            currentStreak: streak,
        };
    }

    /**
     * Weekly adherence data (last 7 days, one entry per day).
     */
    async getWeeklyStats(userId: string) {
        const days: { date: string; total: number; taken: number; skipped: number; rate: number }[] = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const [total, taken, skipped] = await Promise.all([
                this.prisma.doseLog.count({
                    where: { userId, scheduledTime: { gte: dayStart, lte: dayEnd }, status: { not: 'pending' } },
                }),
                this.prisma.doseLog.count({
                    where: { userId, scheduledTime: { gte: dayStart, lte: dayEnd }, status: { in: ['taken_on_time', 'taken_late'] } },
                }),
                this.prisma.doseLog.count({
                    where: { userId, scheduledTime: { gte: dayStart, lte: dayEnd }, status: 'skipped' },
                }),
            ]);

            days.push({
                date: dayStart.toISOString().split('T')[0],
                total,
                taken,
                skipped,
                rate: total > 0 ? Math.round((taken / total) * 100) : 100,
            });
        }

        return days;
    }

    /**
     * Monthly heatmap data (one entry per day of the month).
     */
    async getMonthlyHeatmap(userId: string, year: number, month: number) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
        const daysInMonth = lastDay.getDate();

        const allLogs = await this.prisma.doseLog.findMany({
            where: {
                userId,
                scheduledTime: { gte: firstDay, lte: lastDay },
                status: { not: 'pending' },
            },
            select: { scheduledTime: true, status: true },
        });

        const heatmap: { day: number; date: string; total: number; taken: number; rate: number; level: number }[] = [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(year, month - 1, d);
            const dateStr = dayDate.toISOString().split('T')[0];

            const dayLogs = allLogs.filter((l) => {
                const logDate = new Date(l.scheduledTime);
                return logDate.getDate() === d;
            });

            const total = dayLogs.length;
            const taken = dayLogs.filter((l) => l.status === 'taken_on_time' || l.status === 'taken_late').length;
            const rate = total > 0 ? Math.round((taken / total) * 100) : -1; // -1 = no data

            // Level: 0=no data, 1=0-25%, 2=26-50%, 3=51-75%, 4=76-100%
            let level = 0;
            if (rate >= 0) {
                if (rate <= 25) level = 1;
                else if (rate <= 50) level = 2;
                else if (rate <= 75) level = 3;
                else level = 4;
            }

            heatmap.push({ day: d, date: dateStr, total, taken, rate, level });
        }

        return { year, month, daysInMonth, heatmap };
    }

    /**
     * Per-medication adherence breakdown.
     */
    async getPerMedication(userId: string) {
        const medications = await this.prisma.medication.findMany({
            where: { userId, status: 'active' },
            select: { id: true, name: true, dosage: true, unit: true },
        });

        const results = await Promise.all(
            medications.map(async (med) => {
                const [total, taken, onTime, late, skipped] = await Promise.all([
                    this.prisma.doseLog.count({ where: { medicationId: med.id, status: { not: 'pending' } } }),
                    this.prisma.doseLog.count({ where: { medicationId: med.id, status: { in: ['taken_on_time', 'taken_late'] } } }),
                    this.prisma.doseLog.count({ where: { medicationId: med.id, status: 'taken_on_time' } }),
                    this.prisma.doseLog.count({ where: { medicationId: med.id, status: 'taken_late' } }),
                    this.prisma.doseLog.count({ where: { medicationId: med.id, status: 'skipped' } }),
                ]);

                return {
                    medicationId: med.id,
                    name: med.name,
                    dosage: `${med.dosage} ${med.unit || ''}`.trim(),
                    totalDoses: total,
                    taken,
                    onTime,
                    late,
                    skipped,
                    adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100,
                };
            }),
        );

        return results.sort((a, b) => a.adherenceRate - b.adherenceRate); // worst first
    }

    // --- Helpers ---

    private async calculateCurrentStreak(userId: string): Promise<number> {
        let streak = 0;
        const now = new Date();

        for (let i = 0; i < 365; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const total = await this.prisma.doseLog.count({
                where: { userId, scheduledTime: { gte: dayStart, lte: dayEnd }, status: { not: 'pending' } },
            });

            if (total === 0) continue; // Skip days with no scheduled doses

            const taken = await this.prisma.doseLog.count({
                where: { userId, scheduledTime: { gte: dayStart, lte: dayEnd }, status: { in: ['taken_on_time', 'taken_late'] } },
            });

            if (taken === total) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }
}
