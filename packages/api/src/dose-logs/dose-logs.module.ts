import { Module } from '@nestjs/common';
import { DoseLogsService } from './dose-logs.service';
import { DoseLogsController } from './dose-logs.controller';

@Module({
    providers: [DoseLogsService],
    controllers: [DoseLogsController],
    exports: [DoseLogsService],
})
export class DoseLogsModule { }
