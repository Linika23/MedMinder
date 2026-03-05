import { Module } from '@nestjs/common';
import { AdherenceService } from './adherence.service';
import { AdherenceController } from './adherence.controller';

@Module({
    providers: [AdherenceService],
    controllers: [AdherenceController],
    exports: [AdherenceService],
})
export class AdherenceModule { }
