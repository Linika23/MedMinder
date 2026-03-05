import { Controller, Get, Query } from '@nestjs/common';
import { DrugsService } from './drugs.service';

@Controller('api/drugs')
export class DrugsController {
    constructor(private readonly drugsService: DrugsService) { }

    @Get('search')
    async search(@Query('q') query: string, @Query('limit') limit?: string) {
        if (!query || query.length < 2) {
            return { success: true, data: [] };
        }
        const results = await this.drugsService.searchByName(query, limit ? parseInt(limit) : 10);
        return { success: true, data: results };
    }

    @Get('ndc')
    async lookupNdc(@Query('code') code: string) {
        if (!code) return { success: false, error: { code: 'MISSING_NDC', message: 'NDC code required' } };
        const result = await this.drugsService.lookupByNdc(code);
        return { success: !!result, data: result };
    }

    @Get('details')
    async getDetails(@Query('rxcui') rxcui: string) {
        if (!rxcui) return { success: false, error: { code: 'MISSING_RXCUI', message: 'RxCUI required' } };
        const result = await this.drugsService.getDrugDetails(rxcui);
        return { success: !!result, data: result };
    }
}
