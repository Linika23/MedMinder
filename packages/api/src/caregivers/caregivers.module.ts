// ============================================================
// Caregivers Module — Full Phase 3
// ============================================================

import { Module } from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { CaregiversController } from './caregivers.controller';
import { CaregiverNotificationService } from './caregiver-notification.service';
import { MissedDoseCronService } from './missed-dose-cron.service';

@Module({
    providers: [CaregiversService, CaregiverNotificationService, MissedDoseCronService],
    controllers: [CaregiversController],
    exports: [CaregiversService],
})
export class CaregiversModule { }
