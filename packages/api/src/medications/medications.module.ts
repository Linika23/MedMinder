// ============================================================
// Medications Module
// ============================================================

import { Module } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { MedicationsController } from './medications.controller';
import { InteractionsModule } from '../interactions/interactions.module';

@Module({
    imports: [InteractionsModule],
    providers: [MedicationsService],
    controllers: [MedicationsController],
    exports: [MedicationsService],
})
export class MedicationsModule { }
