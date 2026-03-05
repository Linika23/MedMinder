// ============================================================
// Missed Dose Cron Job
// Runs every 10 minutes to check for overdue doses
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CaregiversService } from './caregivers.service';

@Injectable()
export class MissedDoseCronService {
    private readonly logger = new Logger(MissedDoseCronService.name);

    constructor(private readonly caregiversService: CaregiversService) { }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async handleMissedDoseCheck() {
        this.logger.log('Running missed dose check...');
        try {
            const alertsSent = await this.caregiversService.checkAndAlertMissedDoses();
            if (alertsSent > 0) {
                this.logger.log(`Missed dose check complete: ${alertsSent} alerts sent`);
            }
        } catch (error) {
            this.logger.error(`Missed dose check failed: ${error}`);
        }
    }
}
