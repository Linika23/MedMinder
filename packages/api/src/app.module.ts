// ============================================================
// MedMinder API — Root Application Module
// ============================================================

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MedicationsModule } from './medications/medications.module';
import { DoseLogsModule } from './dose-logs/dose-logs.module';
import { InteractionsModule } from './interactions/interactions.module';
import { CaregiversModule } from './caregivers/caregivers.module';
import { RemindersModule } from './reminders/reminders.module';
import { AdherenceModule } from './adherence/adherence.module';
import { ExportModule } from './export/export.module';
import { ProfileModule } from './profile/profile.module';
import { DrugsModule } from './drugs/drugs.module';
import { HealthController } from './health.controller';
import {
    SecurityHeadersMiddleware,
    RequestSanitizerMiddleware,
    HipaaAuditMiddleware,
} from './common/middleware/security.middleware';

@Module({
    imports: [
        // Global config from .env
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate limiting: 100 requests per 60 seconds per IP
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),

        // Cron job scheduling (for reminder jobs, weekly sync)
        ScheduleModule.forRoot(),

        // Core modules
        PrismaModule,
        AuthModule,
        MedicationsModule,
        DoseLogsModule,
        InteractionsModule,
        CaregiversModule,
        RemindersModule,
        AdherenceModule,
        ExportModule,
        ProfileModule,
        DrugsModule,
    ],
    controllers: [HealthController],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(SecurityHeadersMiddleware, RequestSanitizerMiddleware, HipaaAuditMiddleware)
            .forRoutes('*');
    }
}
