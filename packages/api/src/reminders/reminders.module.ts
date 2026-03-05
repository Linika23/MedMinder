// ============================================================
// Reminders Module — BullMQ Job Scheduling (Phase 1)
// ============================================================

import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Module({
    providers: [RemindersService],
    exports: [RemindersService],
})
export class RemindersModule { }
