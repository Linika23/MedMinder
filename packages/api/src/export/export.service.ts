// ============================================================
// Export Service — PDF, CSV, and Doctor Visit Mode
// ============================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Generate CSV export of dose logs.
     */
    async generateCsvExport(userId: string, from?: string, to?: string): Promise<string> {
        const where: any = { userId };
        if (from || to) {
            where.scheduledTime = {};
            if (from) where.scheduledTime.gte = new Date(from);
            if (to) where.scheduledTime.lte = new Date(to);
        }

        const logs = await this.prisma.doseLog.findMany({
            where,
            include: { medication: { select: { name: true, dosage: true, unit: true } } },
            orderBy: { scheduledTime: 'desc' },
        });

        const headers = ['Date', 'Time', 'Medication', 'Dosage', 'Status', 'Actual Time', 'Notes'];
        const rows = logs.map((log) => [
            new Date(log.scheduledTime).toLocaleDateString(),
            new Date(log.scheduledTime).toLocaleTimeString(),
            log.medication.name,
            `${log.medication.dosage || ''} ${log.medication.unit || ''}`.trim(),
            log.status.replace(/_/g, ' '),
            log.actualTime ? new Date(log.actualTime).toLocaleTimeString() : '',
            log.notes || '',
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

        await this.prisma.auditLog.create({
            data: { userId, action: 'export_csv', resource: 'dose_logs', details: { rowCount: rows.length, from, to } },
        });

        return csv;
    }

    /**
     * Generate PDF-style HTML report (rendered server-side, client downloads as PDF via print).
     */
    async generatePdfReport(userId: string, from?: string, to?: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, conditions: true, allergies: true, physicianName: true },
        });

        const medications = await this.prisma.medication.findMany({
            where: { userId, status: 'active' },
            orderBy: { name: 'asc' },
        });

        const where: any = { userId, status: { not: 'pending' } };
        if (from || to) {
            where.scheduledTime = {};
            if (from) where.scheduledTime.gte = new Date(from);
            if (to) where.scheduledTime.lte = new Date(to);
        }

        const logs = await this.prisma.doseLog.findMany({
            where,
            include: { medication: { select: { name: true, dosage: true, unit: true } } },
            orderBy: { scheduledTime: 'desc' },
            take: 200,
        });

        const totalDoses = logs.length;
        const takenDoses = logs.filter((l) => l.status === 'taken_on_time' || l.status === 'taken_late').length;
        const adherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

        const dateRange = from && to ? `${new Date(from).toLocaleDateString()} – ${new Date(to).toLocaleDateString()}` : 'All time';

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>MedMinder Report — ${user?.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; color: #0C6E8A; }
  h2 { font-size: 18px; margin: 32px 0 12px; color: #0C6E8A; border-bottom: 2px solid #E8F4F8; padding-bottom: 6px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
  .stats { display: flex; gap: 16px; margin: 16px 0 24px; }
  .stat { flex: 1; background: #F0F9FF; border-radius: 12px; padding: 16px; text-align: center; }
  .stat-value { font-size: 28px; font-weight: 700; color: #0C6E8A; }
  .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
  .info-grid dt { color: #666; } .info-grid dd { font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
  th { background: #F0F9FF; text-align: left; padding: 8px 12px; font-weight: 600; color: #0C6E8A; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .badge-taken { background: #D1FAE5; color: #065F46; }
  .badge-late { background: #FEF3C7; color: #92400E; }
  .badge-skipped { background: #FEE2E2; color: #991B1B; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>
<h1>MedMinder Health Report</h1>
<p class="subtitle">${user?.name} · ${dateRange} · Generated ${new Date().toLocaleDateString()}</p>

<div class="stats">
  <div class="stat"><div class="stat-value">${adherence}%</div><div class="stat-label">Adherence Rate</div></div>
  <div class="stat"><div class="stat-value">${medications.length}</div><div class="stat-label">Active Medications</div></div>
  <div class="stat"><div class="stat-value">${takenDoses}/${totalDoses}</div><div class="stat-label">Doses Taken</div></div>
</div>

<h2>Patient Information</h2>
<dl class="info-grid">
  <dt>Conditions</dt><dd>${user?.conditions?.join(', ') || 'None listed'}</dd>
  <dt>Allergies</dt><dd>${user?.allergies?.join(', ') || 'None listed'}</dd>
  <dt>Physician</dt><dd>${user?.physicianName || '—'}</dd>
</dl>

<h2>Current Medications</h2>
<table>
  <thead><tr><th>Medication</th><th>Dosage</th><th>Type</th><th>Status</th></tr></thead>
  <tbody>
    ${medications.map((m) => `<tr><td>${m.name}</td><td>${m.dosage || ''} ${m.unit || ''}</td><td>${m.medicationType}</td><td>${m.status}</td></tr>`).join('')}
  </tbody>
</table>

<h2>Recent Dose Log</h2>
<table>
  <thead><tr><th>Date</th><th>Time</th><th>Medication</th><th>Status</th></tr></thead>
  <tbody>
    ${logs.slice(0, 50).map((l) => {
            const badgeClass = l.status.includes('on_time') ? 'badge-taken' : l.status === 'taken_late' ? 'badge-late' : 'badge-skipped';
            return `<tr><td>${new Date(l.scheduledTime).toLocaleDateString()}</td><td>${new Date(l.scheduledTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</td><td>${l.medication.name} ${l.medication.dosage || ''} ${l.medication.unit || ''}</td><td><span class="badge ${badgeClass}">${l.status.replace(/_/g, ' ')}</span></td></tr>`;
        }).join('')}
  </tbody>
</table>

<div class="footer">
  <p>Generated by MedMinder · This report is for informational purposes only · Not a substitute for medical advice</p>
</div>
</body></html>`;

        await this.prisma.auditLog.create({
            data: { userId, action: 'export_pdf', resource: 'report', details: { from, to } },
        });

        return html;
    }

    /**
     * Doctor Visit Mode — concise 1-page summary for physician visits.
     */
    async generateDoctorSummary(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, dateOfBirth: true, biologicalSex: true, weightKg: true, conditions: true, allergies: true, physicianName: true, pharmacyName: true },
        });

        const medications = await this.prisma.medication.findMany({
            where: { userId, status: 'active' },
            orderBy: { name: 'asc' },
        });

        // Last 30 days adherence
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const [totalLogs, takenLogs] = await Promise.all([
            this.prisma.doseLog.count({ where: { userId, scheduledTime: { gte: thirtyDaysAgo }, status: { not: 'pending' } } }),
            this.prisma.doseLog.count({ where: { userId, scheduledTime: { gte: thirtyDaysAgo }, status: { in: ['taken_on_time', 'taken_late'] } } }),
        ]);
        const adherence30d = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

        // Per-med adherence for last 30 days
        const perMed = await Promise.all(medications.map(async (med) => {
            const total = await this.prisma.doseLog.count({ where: { medicationId: med.id, scheduledTime: { gte: thirtyDaysAgo }, status: { not: 'pending' } } });
            const taken = await this.prisma.doseLog.count({ where: { medicationId: med.id, scheduledTime: { gte: thirtyDaysAgo }, status: { in: ['taken_on_time', 'taken_late'] } } });
            return { name: med.name, dosage: `${med.dosage} ${med.unit || ''}`.trim(), frequency: JSON.stringify(med.frequency), rate: total > 0 ? Math.round((taken / total) * 100) : 100 };
        }));

        // Interactions
        const interactions = await this.prisma.interaction.findMany({
            where: { userId, severity: { in: ['critical', 'major', 'moderate'] } },
            include: { medA: { select: { name: true } }, medB: { select: { name: true } } },
        });

        const age = user?.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / 31557600000) : null;

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Doctor Visit Summary — ${user?.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; color: #1a1a1a; padding: 32px; max-width: 700px; margin: 0 auto; font-size: 13px; }
  h1 { font-size: 20px; color: #0C6E8A; margin-bottom: 2px; }
  h2 { font-size: 14px; color: #0C6E8A; margin: 20px 0 8px; border-bottom: 2px solid #E8F4F8; padding-bottom: 4px; }
  .header-meta { color: #666; font-size: 12px; margin-bottom: 16px; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 16px; }
  .patient-grid dt { color: #666; font-size: 11px; } .patient-grid dd { font-weight: 600; margin-bottom: 8px; }
  .adherence-big { font-size: 36px; font-weight: 700; color: ${adherence30d >= 80 ? '#059669' : adherence30d >= 60 ? '#D97706' : '#DC2626'}; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { text-align: left; padding: 4px 8px; background: #F0F9FF; font-size: 11px; color: #0C6E8A; }
  td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; }
  .alert { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 8px 12px; margin: 4px 0; }
  .alert-title { font-weight: 600; color: #991B1B; font-size: 12px; }
  .footer { margin-top: 24px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #e5e5e5; padding-top: 8px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<h1>🩺 Doctor Visit Summary</h1>
<p class="header-meta">Prepared ${new Date().toLocaleDateString()} · MedMinder Report</p>

<h2>Patient</h2>
<dl class="patient-grid">
  <dt>Name</dt><dd>${user?.name || '—'}</dd>
  <dt>Age</dt><dd>${age ? `${age} years` : '—'}</dd>
  <dt>Sex</dt><dd>${user?.biologicalSex || '—'}</dd>
  <dt>Weight</dt><dd>${user?.weightKg ? `${user.weightKg} kg` : '—'}</dd>
  <dt>Conditions</dt><dd>${user?.conditions?.join(', ') || 'None'}</dd>
  <dt>Allergies</dt><dd>${user?.allergies?.join(', ') || 'None'}</dd>
</dl>

<h2>30-Day Adherence: <span class="adherence-big">${adherence30d}%</span></h2>
<table>
  <thead><tr><th>Medication</th><th>Dosage</th><th>30-Day Adherence</th></tr></thead>
  <tbody>${perMed.map((m) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td style="color: ${m.rate >= 80 ? '#059669' : m.rate >= 60 ? '#D97706' : '#DC2626'}; font-weight: 600;">${m.rate}%</td></tr>`).join('')}</tbody>
</table>

${interactions.length > 0 ? `
<h2>⚠️ Active Interactions (${interactions.length})</h2>
${interactions.map((i) => `<div class="alert"><span class="alert-title">${i.severity.toUpperCase()}: ${i.medA.name} + ${i.medB.name}</span><br/>${i.description || ''}</div>`).join('')}
` : ''}

<h2>Current Medications (${medications.length})</h2>
<table>
  <thead><tr><th>Medication</th><th>Dosage</th><th>Type</th><th>Instructions</th></tr></thead>
  <tbody>${medications.map((m) => `<tr><td>${m.name}</td><td>${m.dosage || ''} ${m.unit || ''}</td><td>${m.medicationType}</td><td>${m.instructions || '—'}</td></tr>`).join('')}</tbody>
</table>

<div class="footer">Generated by MedMinder · ${user?.physicianName ? `Physician: ${user.physicianName}` : ''} · ${user?.pharmacyName ? `Pharmacy: ${user.pharmacyName}` : ''}</div>
</body></html>`;

        await this.prisma.auditLog.create({
            data: { userId, action: 'doctor_visit_summary', resource: 'report' },
        });

        return html;
    }
}
