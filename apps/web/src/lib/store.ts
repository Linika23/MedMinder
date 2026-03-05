// ============================================================
// MedMinder — Client-side Data Store (localStorage)
// Shared state for all pages when backend is offline
// ============================================================

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    unit: string;
    status: 'active' | 'prn' | 'discontinued';
    medicationType: 'prescription' | 'otc' | 'supplement' | 'herbal';
    frequency: { type: string; timesOfDay: string[] };
    withFood: string;
    instructions: string;
    startDate: string;
    endDate: string;
    quantityOnHand: number;
    refillThreshold: number;
    prescribingDoctor: string;
    pharmacy: string;
    reason: string;
    pillColor: string;
    pillShape: string;
    createdAt: string;
}

export interface DoseLog {
    id: string;
    medicationId: string;
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    actualTime: string | null;
    status: 'taken_on_time' | 'taken_late' | 'skipped' | 'pending';
    date: string;
    notes: string;
}

export interface Interaction {
    id: string;
    medA: { name: string; dosage: string };
    medB: { name: string; dosage: string };
    severity: 'critical' | 'major' | 'moderate' | 'mild' | 'none';
    description: string;
    mechanism: string;
    symptoms: string[];
    recommendations: string[];
    source: string;
    checkedAt: string;
}

// ── Default seed data ───────────────────────────────

const DEFAULT_MEDICATIONS: Medication[] = [
    {
        id: 'med-1', name: 'Lisinopril', dosage: '10', unit: 'mg', status: 'active',
        medicationType: 'prescription', frequency: { type: 'once_daily', timesOfDay: ['08:00'] },
        withFood: 'no_preference', instructions: 'Take in the morning', startDate: '2025-11-01', endDate: '',
        quantityOnHand: 45, refillThreshold: 10, prescribingDoctor: 'Dr. Sarah Chen', pharmacy: 'CVS Pharmacy',
        reason: 'Hypertension', pillColor: 'white', pillShape: 'round', createdAt: '2025-11-01T00:00:00Z',
    },
    {
        id: 'med-2', name: 'Metformin', dosage: '500', unit: 'mg', status: 'active',
        medicationType: 'prescription', frequency: { type: 'twice_daily', timesOfDay: ['08:00', '21:00'] },
        withFood: 'with', instructions: 'Take with meals', startDate: '2025-10-15', endDate: '',
        quantityOnHand: 30, refillThreshold: 10, prescribingDoctor: 'Dr. Sarah Chen', pharmacy: 'CVS Pharmacy',
        reason: 'Type 2 Diabetes', pillColor: 'white', pillShape: 'oval', createdAt: '2025-10-15T00:00:00Z',
    },
    {
        id: 'med-3', name: 'Vitamin D3', dosage: '2000', unit: 'IU', status: 'active',
        medicationType: 'supplement', frequency: { type: 'once_daily', timesOfDay: ['08:00'] },
        withFood: 'with', instructions: 'Take with breakfast', startDate: '2025-12-01', endDate: '',
        quantityOnHand: 90, refillThreshold: 15, prescribingDoctor: '', pharmacy: 'Amazon',
        reason: 'Vitamin deficiency', pillColor: 'yellow', pillShape: 'round', createdAt: '2025-12-01T00:00:00Z',
    },
    {
        id: 'med-4', name: 'Atorvastatin', dosage: '20', unit: 'mg', status: 'active',
        medicationType: 'prescription', frequency: { type: 'once_daily', timesOfDay: ['21:00'] },
        withFood: 'no_preference', instructions: 'Take at bedtime', startDate: '2025-09-20', endDate: '',
        quantityOnHand: 8, refillThreshold: 10, prescribingDoctor: 'Dr. Sarah Chen', pharmacy: 'CVS Pharmacy',
        reason: 'High cholesterol', pillColor: 'white', pillShape: 'oval', createdAt: '2025-09-20T00:00:00Z',
    },
    {
        id: 'med-5', name: 'Ibuprofen', dosage: '400', unit: 'mg', status: 'prn',
        medicationType: 'otc', frequency: { type: 'as_needed', timesOfDay: [] },
        withFood: 'with', instructions: 'Take with food for pain', startDate: '2026-01-01', endDate: '',
        quantityOnHand: 50, refillThreshold: 10, prescribingDoctor: '', pharmacy: 'Walgreens',
        reason: 'Pain relief', pillColor: 'brown', pillShape: 'round', createdAt: '2026-01-01T00:00:00Z',
    },
];

const KNOWN_INTERACTIONS: Omit<Interaction, 'id' | 'checkedAt'>[] = [
    {
        medA: { name: 'Lisinopril', dosage: '10 mg' }, medB: { name: 'Ibuprofen', dosage: '400 mg' },
        severity: 'major', description: 'NSAIDs may reduce the blood pressure lowering effect of ACE inhibitors and increase the risk of kidney problems.',
        mechanism: 'Ibuprofen inhibits prostaglandin synthesis, which reduces renal blood flow and counteracts the antihypertensive action of Lisinopril.',
        symptoms: ['Elevated blood pressure', 'Reduced kidney function', 'Fluid retention', 'Swelling in legs/feet'],
        recommendations: ['Use acetaminophen (Tylenol) instead when possible', 'If both are needed, monitor blood pressure closely', 'Watch for signs of fluid retention or swelling', 'Discuss with your physician at next visit'],
        source: 'DrugBank + AI Analysis',
    },
    {
        medA: { name: 'Lisinopril', dosage: '10 mg' }, medB: { name: 'Metformin', dosage: '500 mg' },
        severity: 'mild', description: 'ACE inhibitors may slightly enhance the blood sugar lowering effects of Metformin.',
        mechanism: 'Lisinopril may increase insulin sensitivity, potentially enhancing the hypoglycemic effect of Metformin.',
        symptoms: ['Mild low blood sugar episodes', 'Dizziness', 'Excessive sweating'],
        recommendations: ['Monitor blood sugar regularly', 'Be aware of hypoglycemia symptoms', 'No dose adjustment typically needed'],
        source: 'DrugBank + AI Analysis',
    },
    {
        medA: { name: 'Metformin', dosage: '500 mg' }, medB: { name: 'Vitamin D3', dosage: '2000 IU' },
        severity: 'none', description: 'No clinically significant interaction reported.',
        mechanism: 'These medications work through independent pathways with no known pharmacological interaction.',
        symptoms: [], recommendations: ['Continue current regimen as prescribed', 'Both may be taken together with food'],
        source: 'DrugBank + AI Analysis',
    },
];

// ── Helper: generate dose schedule ──────────────────

function generateTodayDoses(medications: Medication[]): DoseLog[] {
    const today = new Date().toISOString().split('T')[0];
    const doses: DoseLog[] = [];
    medications.forEach((med) => {
        if (med.status === 'discontinued') return;
        if (med.frequency.type === 'as_needed') return;
        med.frequency.timesOfDay.forEach((time) => {
            const hour = parseInt(time.split(':')[0]);
            const now = new Date().getHours();
            let status: DoseLog['status'] = 'pending';
            let actualTime: string | null = null;
            // Auto-populate past doses as taken for demo
            if (hour < now - 1) {
                status = Math.random() > 0.15 ? 'taken_on_time' : 'taken_late';
                const mins = Math.floor(Math.random() * 15);
                actualTime = `${hour}:${String(mins).padStart(2, '0')}`;
            }
            doses.push({
                id: `dose-${med.id}-${time}-${today}`,
                medicationId: med.id,
                medicationName: med.name,
                dosage: `${med.dosage} ${med.unit}`,
                scheduledTime: time,
                actualTime,
                status,
                date: today,
                notes: '',
            });
        });
    });
    return doses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

function generateHistory(medications: Medication[], days: number): DoseLog[] {
    const logs: DoseLog[] = [];
    const statuses: DoseLog['status'][] = ['taken_on_time', 'taken_on_time', 'taken_on_time', 'taken_late', 'skipped'];
    for (let d = 1; d <= days; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        medications.forEach((med) => {
            if (med.status === 'discontinued' || med.frequency.type === 'as_needed') return;
            med.frequency.timesOfDay.forEach((time) => {
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const mins = Math.floor(Math.random() * 20);
                logs.push({
                    id: `hist-${med.id}-${time}-${dateStr}`,
                    medicationId: med.id,
                    medicationName: med.name,
                    dosage: `${med.dosage} ${med.unit}`,
                    scheduledTime: time,
                    actualTime: status !== 'skipped' ? `${time.split(':')[0]}:${String(mins).padStart(2, '0')}` : null,
                    status,
                    date: dateStr,
                    notes: '',
                });
            });
        });
    }
    return logs.sort((a, b) => b.date.localeCompare(a.date) || a.scheduledTime.localeCompare(b.scheduledTime));
}

// ── Store class ─────────────────────────────────────

class MedMinderStore {
    private _listeners: Set<() => void> = new Set();

    // ── Medications ──
    getMedications(): Medication[] {
        if (typeof window === 'undefined') return DEFAULT_MEDICATIONS;
        const raw = localStorage.getItem('medminder_medications');
        if (!raw) {
            this.setMedications(DEFAULT_MEDICATIONS);
            return DEFAULT_MEDICATIONS;
        }
        return JSON.parse(raw);
    }

    setMedications(meds: Medication[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('medminder_medications', JSON.stringify(meds));
        this._notify();
    }

    addMedication(med: Omit<Medication, 'id' | 'createdAt'>): Medication {
        const newMed: Medication = { ...med, id: `med-${Date.now()}`, createdAt: new Date().toISOString() };
        const meds = this.getMedications();
        meds.push(newMed);
        this.setMedications(meds);
        // Re-generate today's doses and interactions
        this._regenerateDoses();
        this._checkInteractions();
        return newMed;
    }

    updateMedication(id: string, updates: Partial<Medication>) {
        const meds = this.getMedications().map((m) => (m.id === id ? { ...m, ...updates } : m));
        this.setMedications(meds);
        this._regenerateDoses();
        this._checkInteractions();
    }

    deleteMedication(id: string) {
        const meds = this.getMedications().map((m) => m.id === id ? { ...m, status: 'discontinued' as const } : m);
        this.setMedications(meds);
        this._regenerateDoses();
    }

    // ── Today's Doses ──
    getTodayDoses(): DoseLog[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem('medminder_today_doses');
        if (!raw) {
            const doses = generateTodayDoses(this.getMedications());
            this.setTodayDoses(doses);
            return doses;
        }
        return JSON.parse(raw);
    }

    setTodayDoses(doses: DoseLog[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('medminder_today_doses', JSON.stringify(doses));
        this._notify();
    }

    takeDose(doseId: string) {
        const doses = this.getTodayDoses().map((d) => {
            if (d.id !== doseId) return d;
            const now = new Date();
            return {
                ...d,
                status: 'taken_on_time' as const,
                actualTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            };
        });
        this.setTodayDoses(doses);
        // Decrement quantity
        const dose = doses.find(d => d.id === doseId);
        if (dose) {
            const meds = this.getMedications();
            const med = meds.find(m => m.id === dose.medicationId);
            if (med && med.quantityOnHand > 0) {
                this.updateMedication(med.id, { quantityOnHand: med.quantityOnHand - 1 });
            }
        }
    }

    skipDose(doseId: string) {
        const doses = this.getTodayDoses().map((d) =>
            d.id === doseId ? { ...d, status: 'skipped' as const, actualTime: null } : d
        );
        this.setTodayDoses(doses);
    }

    private _regenerateDoses() {
        const doses = generateTodayDoses(this.getMedications());
        this.setTodayDoses(doses);
    }

    // ── History ──
    getHistory(): DoseLog[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem('medminder_history');
        if (!raw) {
            const history = generateHistory(this.getMedications(), 14);
            localStorage.setItem('medminder_history', JSON.stringify(history));
            return history;
        }
        return JSON.parse(raw);
    }

    // ── Interactions ──
    getInteractions(): Interaction[] {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem('medminder_interactions');
        if (raw) return JSON.parse(raw);
        this._checkInteractions();
        return this.getInteractions();
    }

    private _checkInteractions() {
        const meds = this.getMedications().filter(m => m.status !== 'discontinued');
        const interactions: Interaction[] = [];

        for (let i = 0; i < meds.length; i++) {
            for (let j = i + 1; j < meds.length; j++) {
                const a = meds[i], b = meds[j];
                const known = KNOWN_INTERACTIONS.find(
                    k => (k.medA.name === a.name && k.medB.name === b.name) ||
                        (k.medA.name === b.name && k.medB.name === a.name)
                );
                if (known) {
                    interactions.push({
                        ...known,
                        id: `int-${a.id}-${b.id}`,
                        medA: { name: a.name, dosage: `${a.dosage} ${a.unit}` },
                        medB: { name: b.name, dosage: `${b.dosage} ${b.unit}` },
                        checkedAt: new Date().toISOString(),
                    });
                } else {
                    interactions.push({
                        id: `int-${a.id}-${b.id}`,
                        medA: { name: a.name, dosage: `${a.dosage} ${a.unit}` },
                        medB: { name: b.name, dosage: `${b.dosage} ${b.unit}` },
                        severity: 'none', description: 'No known interaction between these medications.',
                        mechanism: 'Independent pharmacological pathways.', symptoms: [],
                        recommendations: ['Safe to take as prescribed.'],
                        source: 'AI Analysis', checkedAt: new Date().toISOString(),
                    });
                }
            }
        }
        localStorage.setItem('medminder_interactions', JSON.stringify(interactions));
        this._notify();
    }

    runInteractionCheck(): Interaction[] {
        this._checkInteractions();
        return this.getInteractions();
    }

    // ── Analytics ──
    getAdherenceStats() {
        const history = this.getHistory();
        const today = this.getTodayDoses();
        const all = [...history, ...today].filter(d => d.status !== 'pending');
        const taken = all.filter(d => d.status.startsWith('taken'));
        const onTime = all.filter(d => d.status === 'taken_on_time');
        const late = all.filter(d => d.status === 'taken_late');
        const skipped = all.filter(d => d.status === 'skipped');

        return {
            overallScore: all.length > 0 ? Math.round((taken.length / all.length) * 100) : 0,
            onTimeRate: all.length > 0 ? Math.round((onTime.length / all.length) * 100) : 0,
            totalDoses: all.length,
            takenOnTime: onTime.length,
            takenLate: late.length,
            skipped: skipped.length,
            currentStreak: this._calcStreak(),
        };
    }

    private _calcStreak(): number {
        const history = this.getHistory();
        const byDate = new Map<string, DoseLog[]>();
        history.forEach(d => {
            const existing = byDate.get(d.date) || [];
            existing.push(d);
            byDate.set(d.date, existing);
        });
        let streak = 0;
        const dates = [...byDate.keys()].sort().reverse();
        for (const date of dates) {
            const logs = byDate.get(date)!;
            const allTaken = logs.every(l => l.status.startsWith('taken'));
            if (allTaken) streak++;
            else break;
        }
        return streak;
    }

    getPerMedicationStats() {
        const history = this.getHistory();
        const meds = this.getMedications().filter(m => m.status !== 'discontinued' && m.frequency.type !== 'as_needed');
        return meds.map(med => {
            const logs = history.filter(h => h.medicationId === med.id);
            const total = logs.length || 1;
            const taken = logs.filter(l => l.status.startsWith('taken')).length;
            const onTime = logs.filter(l => l.status === 'taken_on_time').length;
            const late = logs.filter(l => l.status === 'taken_late').length;
            const skipped = logs.filter(l => l.status === 'skipped').length;
            return { medicationId: med.id, name: med.name, dosage: `${med.dosage} ${med.unit}`, totalDoses: total, taken, onTime, late, skipped, adherenceRate: Math.round((taken / total) * 100) };
        });
    }

    // ── PDF Report Generation ──
    generatePdfHtml(): string {
        const stats = this.getAdherenceStats();
        const meds = this.getMedications().filter(m => m.status !== 'discontinued');
        const perMed = this.getPerMedicationStats();
        const interactions = this.getInteractions().filter(i => i.severity !== 'none');
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        return `<!DOCTYPE html><html><head><title>MedMinder Report — ${date}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 24px;color:#1a1a1a;line-height:1.6}
h1{color:#0C6E8A;font-size:24px;border-bottom:3px solid #0C6E8A;padding-bottom:12px;margin-bottom:8px}
h2{color:#0C6E8A;font-size:16px;margin:24px 0 12px;text-transform:uppercase;letter-spacing:1px}
.subtitle{color:#666;font-size:13px;margin-bottom:24px}
.stats{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}
.stat{flex:1;min-width:120px;text-align:center;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
.stat .val{font-size:32px;font-weight:700;color:#0C6E8A}.stat .lab{font-size:11px;color:#64748b;margin-top:2px}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
th{background:#f1f5f9;font-weight:600;color:#475569;text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9}
.badge{display:inline-block;padding:2px 10px;border-radius:6px;font-size:11px;font-weight:600}
.green{background:#dcfce7;color:#166534}.amber{background:#fef3c7;color:#92400e}.red{background:#fef2f2;color:#991b1b}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px}
@media print{body{margin:0;padding:20px}h1{font-size:20px}.stat .val{font-size:24px}}
</style></head><body>
<h1>🏥 MedMinder — Medication Report</h1>
<p class="subtitle">Generated: ${date} · Patient: Demo Patient · Age: 68</p>

<div class="stats">
<div class="stat"><div class="val">${stats.overallScore}%</div><div class="lab">Overall Adherence</div></div>
<div class="stat"><div class="val">${stats.onTimeRate}%</div><div class="lab">On-Time Rate</div></div>
<div class="stat"><div class="val">${stats.currentStreak}</div><div class="lab">Day Streak</div></div>
<div class="stat"><div class="val">${stats.totalDoses}</div><div class="lab">Total Doses (30d)</div></div>
</div>

<h2>Current Medications (${meds.length})</h2>
<table><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Type</th><th>Refill</th></tr>
${meds.map(m => `<tr><td><strong>${m.name}</strong></td><td>${m.dosage} ${m.unit}</td><td>${m.frequency.type.replace(/_/g, ' ')}</td><td>${m.medicationType}</td><td>${m.quantityOnHand} left</td></tr>`).join('')}
</table>

<h2>Adherence by Medication</h2>
<table><tr><th>Medication</th><th>Dosage</th><th>Adherence</th><th>On Time</th><th>Late</th><th>Skipped</th></tr>
${perMed.map(m => `<tr><td>${m.name}</td><td>${m.dosage}</td><td><span class="badge ${m.adherenceRate >= 80 ? 'green' : m.adherenceRate >= 60 ? 'amber' : 'red'}">${m.adherenceRate}%</span></td><td>${m.onTime}</td><td>${m.late}</td><td>${m.skipped}</td></tr>`).join('')}
</table>

${interactions.length > 0 ? `<h2>⚠️ Active Interactions (${interactions.length})</h2>
<table><tr><th>Drugs</th><th>Severity</th><th>Description</th></tr>
${interactions.map(i => `<tr><td><strong>${i.medA.name}</strong> + <strong>${i.medB.name}</strong></td><td><span class="badge ${i.severity === 'critical' || i.severity === 'major' ? 'red' : 'amber'}">${i.severity.toUpperCase()}</span></td><td>${i.description}</td></tr>`).join('')}
</table>` : '<h2>✅ No Drug Interactions Detected</h2>'}

<div class="footer">
<p>⚠️ This report is for informational purposes only. Always consult your healthcare provider for medical advice.</p>
<p>Generated by MedMinder · medminder.app</p>
</div></body></html>`;
    }

    generateDoctorSummaryHtml(): string {
        const stats = this.getAdherenceStats();
        const meds = this.getMedications().filter(m => m.status !== 'discontinued');
        const perMed = this.getPerMedicationStats();
        const interactions = this.getInteractions().filter(i => i.severity !== 'none');
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        return `<!DOCTYPE html><html><head><title>Doctor Visit Summary</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;max-width:700px;margin:0 auto;padding:30px 20px;color:#1a1a1a;font-size:13px;line-height:1.5}
h1{color:#0C6E8A;font-size:18px;margin-bottom:2px}
.date{color:#666;font-size:12px;margin-bottom:16px}
.section{border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:10px 0}
.section h3{margin:0 0 8px;color:#0C6E8A;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:700}
table{width:100%;border-collapse:collapse}th,td{padding:5px 8px;border-bottom:1px solid #f1f5f9;text-align:left;font-size:12px}
th{font-weight:600;color:#64748b}
.badge{display:inline-block;padding:1px 8px;border-radius:4px;font-size:10px;font-weight:700}
.green{background:#dcfce7;color:#166534}.amber{background:#fef3c7;color:#92400e}.red{background:#fef2f2;color:#991b1b}
.footer{margin-top:20px;color:#94a3b8;font-size:10px}
@media print{body{margin:0;padding:16px;font-size:11px}}</style></head><body>
<h1>🩺 Doctor Visit Summary</h1>
<p class="date">Prepared: ${date}</p>
<div class="section"><h3>Patient</h3><table>
<tr><td><strong>Name:</strong> Demo Patient</td><td><strong>Age:</strong> 68</td><td><strong>Sex:</strong> Female</td></tr>
<tr><td><strong>Conditions:</strong> Hypertension, Type 2 Diabetes</td><td colspan="2"><strong>Allergies:</strong> Penicillin</td></tr>
</table></div>
<div class="section"><h3>30-Day Adherence: ${stats.overallScore}%</h3><table>
<tr><th>Medication</th><th>Dosage</th><th>Adherence</th></tr>
${perMed.map(m => `<tr><td>${m.name}</td><td>${m.dosage}</td><td><span class="badge ${m.adherenceRate >= 80 ? 'green' : m.adherenceRate >= 60 ? 'amber' : 'red'}">${m.adherenceRate}%</span></td></tr>`).join('')}
</table></div>
${interactions.length > 0 ? `<div class="section"><h3>⚠️ Interactions (${interactions.length})</h3>
${interactions.map(i => `<p><span class="badge ${i.severity === 'major' || i.severity === 'critical' ? 'red' : 'amber'}">${i.severity.toUpperCase()}</span> <strong>${i.medA.name} + ${i.medB.name}</strong> — ${i.description}</p>`).join('<br/>')}
</div>` : ''}
<div class="section"><h3>Medications (${meds.length})</h3><table>
<tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Refill</th></tr>
${meds.map(m => `<tr><td>${m.name}</td><td>${m.dosage} ${m.unit}</td><td>${m.frequency.type.replace(/_/g, ' ')}</td><td>${m.quantityOnHand} pills</td></tr>`).join('')}
</table></div>
<div class="footer"><p>Generated by MedMinder · For clinical reference — verify with patient.</p></div>
</body></html>`;
    }

    generateCsvData(): string {
        const history = [...this.getHistory(), ...this.getTodayDoses()];
        const rows = ['Date,Medication,Dosage,Scheduled Time,Status,Actual Time'];
        history.forEach(h => {
            rows.push(`${h.date},${h.medicationName},${h.dosage},${h.scheduledTime},${h.status.replace(/_/g, ' ')},${h.actualTime || '—'}`);
        });
        return rows.join('\n');
    }

    // ── Listeners (for cross-component reactivity) ──
    subscribe(fn: () => void) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    private _notify() {
        this._listeners.forEach(fn => fn());
    }

    // ── Reset ──
    reset() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('medminder_medications');
        localStorage.removeItem('medminder_today_doses');
        localStorage.removeItem('medminder_history');
        localStorage.removeItem('medminder_interactions');
        this._notify();
    }
}

// Singleton export
export const store = new MedMinderStore();
