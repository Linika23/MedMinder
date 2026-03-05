// ============================================================
// Caregivers Controller — Full Invite + Dashboard + Alerts
// ============================================================

import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { inviteCaregiverSchema } from '@medminder/shared';

@Controller('api/caregivers')
@UseGuards(JwtAuthGuard)
export class CaregiversController {
    constructor(private readonly caregiversService: CaregiversService) { }

    /**
     * POST /api/caregivers/invite
     * Invite a caregiver via email or phone.
     */
    @Post('invite')
    async invite(@CurrentUser('id') patientId: string, @Body() body: unknown) {
        const validated = inviteCaregiverSchema.parse(body);
        const result = await this.caregiversService.invite(
            patientId,
            validated.emailOrPhone,
            validated.permissions,
        );
        return { success: true, data: result };
    }

    /**
     * POST /api/caregivers/accept
     * Accept a caregiver invite using the invite token.
     */
    @Post('accept')
    async accept(@CurrentUser('id') caregiverId: string, @Body() body: { token: string }) {
        const result = await this.caregiversService.acceptInvite(body.token, caregiverId);
        return { success: true, data: result };
    }

    /**
     * POST /api/caregivers/:id/resend
     * Resend a pending invite.
     */
    @Post(':id/resend')
    async resend(@Param('id') linkId: string, @CurrentUser('id') patientId: string) {
        const result = await this.caregiversService.resendInvite(linkId, patientId);
        return { success: true, data: result };
    }

    /**
     * DELETE /api/caregivers/:id
     * Revoke a caregiver link (patient or caregiver can revoke).
     */
    @Delete(':id')
    async revoke(@Param('id') linkId: string, @CurrentUser('id') userId: string) {
        const result = await this.caregiversService.revoke(linkId, userId);
        return { success: true, data: result };
    }

    /**
     * GET /api/caregivers
     * List caregivers for the current user (as patient).
     */
    @Get()
    async findAll(@CurrentUser('id') userId: string) {
        const caregivers = await this.caregiversService.getForPatient(userId);
        return { success: true, data: caregivers };
    }

    /**
     * GET /api/caregivers/patients
     * List patients for the current user (as caregiver).
     */
    @Get('patients')
    async getPatients(@CurrentUser('id') caregiverId: string) {
        const patients = await this.caregiversService.getPatients(caregiverId);
        return { success: true, data: patients };
    }

    /**
     * GET /api/caregivers/patients/:patientId/dashboard
     * Get full dashboard data for a patient (caregiver view).
     */
    @Get('patients/:patientId/dashboard')
    async getPatientDashboard(
        @CurrentUser('id') caregiverId: string,
        @Param('patientId') patientId: string,
    ) {
        const dashboard = await this.caregiversService.getPatientDashboard(caregiverId, patientId);
        return { success: true, data: dashboard };
    }
}
