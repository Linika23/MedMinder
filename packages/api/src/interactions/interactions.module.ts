// ============================================================
// Interactions Module — Full AI Layer
// ============================================================

import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { OpenFdaService } from './openfda.service';
import { RxNormInteractionService } from './rxnorm-interaction.service';
import { AiSummaryService } from './ai-summary.service';
import { InteractionCacheService } from './interaction-cache.service';

@Module({
    providers: [
        InteractionsService,
        OpenFdaService,
        RxNormInteractionService,
        AiSummaryService,
        InteractionCacheService,
    ],
    controllers: [InteractionsController],
    exports: [InteractionsService, InteractionCacheService],
})
export class InteractionsModule { }
