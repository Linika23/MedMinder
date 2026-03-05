// ============================================================
// Caregiver Notification Service
// Sends invite emails/SMS and missed dose alerts
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface InviteNotification {
    to: string;
    type: 'email' | 'sms';
    patientName: string;
    inviteToken: string;
    permissions: string;
}

interface MissedDoseAlert {
    caregiverEmail?: string;
    caregiverPhone?: string;
    caregiverName: string;
    patientName: string;
    medicationName: string;
    scheduledTime: string;
}

@Injectable()
export class CaregiverNotificationService {
    private readonly logger = new Logger(CaregiverNotificationService.name);
    private readonly appUrl: string;

    constructor(private readonly config: ConfigService) {
        this.appUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
    }

    /**
     * Send an invite notification via email or SMS.
     */
    async sendInvite(notification: InviteNotification): Promise<boolean> {
        const acceptUrl = `${this.appUrl}/caregivers/accept?token=${notification.inviteToken}`;

        if (notification.type === 'email') {
            return this.sendInviteEmail(notification.to, notification.patientName, acceptUrl, notification.permissions);
        } else {
            return this.sendInviteSms(notification.to, notification.patientName, acceptUrl);
        }
    }

    /**
     * Send a missed dose alert to caregiver.
     */
    async sendMissedDoseAlert(alert: MissedDoseAlert): Promise<void> {
        const message = `${alert.patientName} missed their ${alert.medicationName} dose scheduled for ${alert.scheduledTime}.`;

        if (alert.caregiverEmail) {
            await this.sendAlertEmail(alert.caregiverEmail, alert.caregiverName, alert.patientName, message);
        }

        if (alert.caregiverPhone) {
            await this.sendAlertSms(alert.caregiverPhone, message);
        }
    }

    // --- Email via SendGrid ---

    private async sendInviteEmail(to: string, patientName: string, acceptUrl: string, permissions: string): Promise<boolean> {
        const sgApiKey = this.config.get<string>('SENDGRID_API_KEY');
        const fromEmail = this.config.get<string>('FROM_EMAIL') || 'noreply@medminder.app';

        if (!sgApiKey) {
            this.logger.warn(`[DEV] Invite email to ${to}: ${patientName} invited you. Accept: ${acceptUrl}`);
            return true; // Dev mode — log instead of sending
        }

        try {
            const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sgApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: fromEmail, name: 'MedMinder' },
                    subject: `${patientName} has invited you as a caregiver on MedMinder`,
                    content: [
                        {
                            type: 'text/html',
                            value: `
                <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                  <h2 style="color: #0C6E8A;">You've been invited!</h2>
                  <p><strong>${patientName}</strong> has invited you to be their caregiver on MedMinder.</p>
                  <p>You'll have <strong>${permissions === 'write' ? 'full access' : 'view-only access'}</strong> to their medications and dose history.</p>
                  <a href="${acceptUrl}" style="display: inline-block; background: #0C6E8A; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">Accept Invitation</a>
                  <p style="font-size: 14px; color: #666;">This link expires in 7 days. If you didn't expect this, you can ignore it.</p>
                </div>
              `,
                        },
                    ],
                }),
            });

            if (!res.ok) throw new Error(`SendGrid error: ${res.status}`);
            this.logger.log(`Invite email sent to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send invite email to ${to}: ${error}`);
            return false;
        }
    }

    private async sendAlertEmail(to: string, caregiverName: string, patientName: string, message: string): Promise<void> {
        const sgApiKey = this.config.get<string>('SENDGRID_API_KEY');
        const fromEmail = this.config.get<string>('FROM_EMAIL') || 'noreply@medminder.app';

        if (!sgApiKey) {
            this.logger.warn(`[DEV] Alert email to ${to}: ${message}`);
            return;
        }

        try {
            await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${sgApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: fromEmail, name: 'MedMinder' },
                    subject: `⚠️ ${patientName} missed a medication dose`,
                    content: [{
                        type: 'text/html',
                        value: `
              <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #DC2626;">Missed Dose Alert</h2>
                <p>Hi ${caregiverName},</p>
                <p>${message}</p>
                <a href="${this.appUrl}/dashboard/caregivers" style="display: inline-block; background: #0C6E8A; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">View Dashboard</a>
              </div>
            `,
                    }],
                }),
            });
        } catch (error) {
            this.logger.error(`Failed to send alert email: ${error}`);
        }
    }

    // --- SMS via Twilio ---

    private async sendInviteSms(to: string, patientName: string, acceptUrl: string): Promise<boolean> {
        const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
        const fromPhone = this.config.get<string>('TWILIO_PHONE_NUMBER');

        if (!accountSid || !authToken || !fromPhone) {
            this.logger.warn(`[DEV] Invite SMS to ${to}: ${patientName} invited you. Accept: ${acceptUrl}`);
            return true;
        }

        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            const body = new URLSearchParams({
                To: to,
                From: fromPhone,
                Body: `${patientName} has invited you as a caregiver on MedMinder. Accept here: ${acceptUrl}`,
            });

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body,
            });

            if (!res.ok) throw new Error(`Twilio error: ${res.status}`);
            this.logger.log(`Invite SMS sent to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send invite SMS to ${to}: ${error}`);
            return false;
        }
    }

    private async sendAlertSms(to: string, message: string): Promise<void> {
        const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
        const fromPhone = this.config.get<string>('TWILIO_PHONE_NUMBER');

        if (!accountSid || !authToken || !fromPhone) {
            this.logger.warn(`[DEV] Alert SMS to ${to}: ${message}`);
            return;
        }

        try {
            const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
            await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ To: to, From: fromPhone, Body: message }),
            });
        } catch (error) {
            this.logger.error(`Failed to send alert SMS: ${error}`);
        }
    }
}
