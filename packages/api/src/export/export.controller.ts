import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    @Get('pdf')
    async exportPdf(
        @CurrentUser('id') userId: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @Res() res: Response,
    ) {
        const html = await this.exportService.generatePdfReport(userId, from, to);
        res.set({ 'Content-Type': 'text/html', 'Content-Disposition': 'inline; filename=medminder-report.html' });
        res.send(html);
    }

    @Get('csv')
    async exportCsv(
        @CurrentUser('id') userId: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @Res() res: Response,
    ) {
        const csv = await this.exportService.generateCsvExport(userId, from, to);
        res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=medminder-data.csv' });
        res.send(csv);
    }

    @Get('doctor-summary')
    async doctorSummary(
        @CurrentUser('id') userId: string,
        @Res() res: Response,
    ) {
        const html = await this.exportService.generateDoctorSummary(userId);
        res.set({ 'Content-Type': 'text/html', 'Content-Disposition': 'inline; filename=doctor-visit-summary.html' });
        res.send(html);
    }
}
