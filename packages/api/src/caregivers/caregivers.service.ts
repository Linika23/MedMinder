// ============================================================
// Caregivers Service — Full Invite + Dashboard + Alerts
// ============================================================

import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CaregiverNotificationService } from './caregiver-notification.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CaregiversService {
    private readonly logger = new Logger(CaregiversService.name);
    private readonly INVITE_EXPIRY_DAYS = 7;

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: CaregiverNotificationService,
    ) { }

    // ─── Invite Flow ───────────────────────────────────

    async invite(patientId: string, emailOrPhone: string, permissions: 'read' | 'write') {
        // Check for duplicate invite
        const isEmail = emailOrPhone.includes('@');
        const existing = await this.prisma.caregiverLink.findFirst({
            where: {
                patientId,
                ...(isEmail ? { inviteEmail: emailOrPhone } : { invitePhone: emailOrPhone }),
                status: { in: ['pending', 'active'] },
            },
        });

        if (existing) {
            throw new ConflictException('This person has already been invited or is already a caregiver');
        }

        // Check if invitee already has an account
        const existingUser = isEmail
            ? await this.prisma.user.findUnique({ where: { email: emailOrPhone } })
            : null;

        // Generate secure invite token
        const inviteToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.INVITE_EXPIRY_DAYS * 86400000);

        // Get patient name for notifications
        const patient = await this.prisma.user.findUnique({
            where: { id: patientId },
            select: { name: true },
        });

        // Create caregiver link
        const link = await this.prisma.caregiverLink.create({
            data: {
                patientId,
                caregiverId: existingUser?.id || null,
                status: existingUser ? 'active' : 'pending',
                permissions,
                inviteEmail: isEmail ? emailOrPhone : null,
                invitePhone: !isEmail ? emailOrPhone : null,
                inviteToken,
                inviteExpiresAt: expiresAt,
                acceptedAt: existingUser ? new Date() : null,
            },
        });

        // Send notification
        await this.notifications.sendInvite({
            to: emailOrPhone,
            type: isEmail ? 'email' : 'sms',
            patientName: patient?.name || 'A MedMinder user',
            inviteToken,
            permissions,
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                userId: patientId,
                action: 'caregiver_invite',
                resource: 'caregiver_links',
                resourceId: link.id,
                details: { invitee: emailOrPhone, permissions, autoAccepted: !!existingUser },
            },
        });

        return {
            id: link.id,
            status: link.status,
            inviteSent: true,
            autoAccepted: !!existingUser,
        };
    }

    async acceptInvite(inviteToken: string, caregiverId: string) {
        const link = await this.prisma.caregiverLink.findUnique({
            where: { inviteToken },
            include: { patient: { select: { name: true } } },
        });

        if (!link) throw new NotFoundException('Invite not found');
        if (link.status !== 'pending') throw new ConflictException('Invite has already been processed');
        if (link.inviteExpiresAt && link.inviteExpiresAt < new Date()) {
            throw new ConflictException('Invite has expired');
        }

        // Check if caregiver is trying to accept their own invite
        if (link.patientId === caregiverId) {
            throw new ForbiddenException('Cannot accept your own invite');
        }

        const updated = await this.prisma.caregiverLink.update({
            where: { inviteToken },
            data: {
                caregiverId,
                status: 'active',
                acceptedAt: new Date(),
                inviteToken: null, // Consumed
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: caregiverId,
                action: 'caregiver_accept',
                resource: 'caregiver_links',
                resourceId: updated.id,
            },
        });

        return { id: updated.id, status: 'active', patientName: link.patient.name };
    }

    async revoke(linkId: string, userId: string) {
        const link = await this.prisma.caregiverLink.findUnique({ where: { id: linkId } });
        if (!link) throw new NotFoundException('Caregiver link not found');

        // Either the patient or caregiver can revoke
        if (link.patientId !== userId && link.caregiverId !== userId) {
            throw new ForbiddenException();
        }

        await this.prisma.caregiverLink.update({
            where: { id: linkId },
            data: { status: 'revoked' },
        });

        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'caregiver_revoke',
                resource: 'caregiver_links',
                resourceId: linkId,
            },
        });

        return { revoked: true };
    }

    async resendInvite(linkId: string, patientId: string) {
        const link = await this.prisma.caregiverLink.findFirst({
            where: { id: linkId, patientId, status: 'pending' },
        });

        if (!link) throw new NotFoundException('Pending invite not found');

        const newToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + this.INVITE_EXPIRY_DAYS * 86400000);

        await this.prisma.caregiverLink.update({
            where: { id: linkId },
            data: { inviteToken: newToken, inviteExpiresAt: expiresAt },
        });

        const patient = await this.prisma.user.findUnique({
            where: { id: patientId },
            select: { name: true },
        });

        const to = link.inviteEmail || link.invitePhone || '';
        await this.notifications.sendInvite({
            to,
            type: link.inviteEmail ? 'email' : 'sms',
            patientName: patient?.name || 'A MedMinder user',
            inviteToken: newToken,
            permissions: link.permissions,
        });

        return { resent: true };
    }

    // ─── Listing ───────────────────────────────────────

    async getForPatient(patientId: string) {
        return this.prisma.caregiverLink.findMany({
            where: { patientId, status: { not: 'revoked' } },
            include: { caregiver: { select: { id: true, name: true, email: true } } },
            orderBy: { invitedAt: 'desc' },
        });
    }

    async getPatients(caregiverId: string) {
        return this.prisma.caregiverLink.findMany({
            where: { caregiverId, status: 'active' },
            include: { patient: { select: { id: true, name: true, email: true } } },
            orderBy: { acceptedAt: 'desc' },
        });
    }

    // ─── Caregiver Dashboard Data ──────────────────────

    async getPatientDashboard(caregiverId: string, patientId: string) {
        // Verify caregiver has access to this patient
        const link = await this.prisma.caregiverLink.findFirst({
            where: { caregiverId, patientId, status: 'active' },
        });

        if (!link) throw new ForbiddenException('No active caregiver link for this patient');

        // Load patient summary
        const [patient, medications, recentDoses, todayDoses] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: patientId },
                select: { name: true, conditions: true, allergies: true, physicianName: true, physicianPhone: true },
            }),

            this.prisma.medication.findMany({
                where: { userId: patientId, status: 'active' },
                orderBy: { name: 'asc' },
            }),

            this.prisma.doseLog.findMany({
                where: { userId: patientId },
                include: { medication: { select: { name: true, dosage: true, unit: true } } },
                orderBy: { scheduledTime: 'desc' },
                take: 20,
            }),

            // Today's doses
            this.prisma.doseLog.findMany({
                where: {
                    userId: patientId,
                    scheduledTime: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
                include: { medication: { select: { name: true, dosage: true, unit: true } } },
                orderBy: { scheduledTime: 'asc' },
            }),
        ]);

        // Calculate adherence
        const takenToday = todayDoses.filter((d) => d.status === 'taken_on_time' || d.status === 'taken_late').length;
        const totalToday = todayDoses.length;
        const missedToday = todayDoses.filter((d) => d.status === 'skipped').length;

        return {
            patient,
            permissions: link.permissions,
            medications,
            todayDoses,
            recentDoses,
            stats: {
                activeMedications: medications.length,
                takenToday,
                totalToday,
                missedToday,
                adherenceToday: totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 100,
            },
        };
    }

    // ─── Missed Dose Alerts ────────────────────────────

    async checkAndAlertMissedDoses(): Promise<number> {
        const gracePeriodMinutes = 30;
        const cutoff = new Date(Date.now() - gracePeriodMinutes * 60 * 1000);

        // Find overdue pending doses
        const overdueDoses = await this.prisma.doseLog.findMany({
            where: {
                status: 'pending',
                scheduledTime: { lt: cutoff },
            },
            include: {
                user: { select: { id: true, name: true } },
                medication: { select: { name: true } },
            },
        });

        let alertsSent = 0;

        for (const dose of overdueDoses) {
            // Mark as skipped
            await this.prisma.doseLog.update({
                where: { id: dose.id },
                data: { status: 'skipped' },
            });

            // Find active caregivers for this patient
            const caregiverLinks = await this.prisma.caregiverLink.findMany({
                where: { patientId: dose.userId, status: 'active' },
                include: { caregiver: { select: { name: true, email: true, phone: true } } },
            });

            // Send alerts to all caregivers
            for (const link of caregiverLinks) {
                if (!link.caregiver) continue;

                await this.notifications.sendMissedDoseAlert({
                    caregiverEmail: link.caregiver.email,
                    caregiverPhone: link.caregiver.phone || undefined,
                    caregiverName: link.caregiver.name,
                    patientName: dose.user.name,
                    medicationName: dose.medication.name,
                    scheduledTime: dose.scheduledTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                });

                alertsSent++;
            }
        }

        this.logger.log(`Missed dose check: ${overdueDoses.length} overdue, ${alertsSent} alerts sent`);
        return alertsSent;
    }
}
