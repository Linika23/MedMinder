'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEVEL_COLORS = [
    'bg-gray-100 dark:bg-gray-800',
    'bg-red-200 dark:bg-red-900/50',
    'bg-amber-200 dark:bg-amber-900/50',
    'bg-lime-200 dark:bg-lime-900/50',
    'bg-accent-300 dark:bg-accent-800/60',
];

function ScoreRing({ score, size = 120, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626';
    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
            </div>
        </div>
    );
}

function BarChart({ data }: { data: { date: string; total: number; taken: number; skipped: number; rate: number }[] }) {
    const maxTotal = Math.max(...data.map(d => d.total), 1);
    return (
        <div className="flex items-end gap-2 h-40">
            {data.map(d => {
                const takenH = (d.taken / maxTotal) * 100;
                const skippedH = (d.skipped / maxTotal) * 100;
                const dayLabel = WEEKDAYS[new Date(d.date + 'T00:00:00').getDay()];
                return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col-reverse items-center" style={{ height: '120px' }}>
                            <div className="w-full max-w-[36px] rounded-t-lg bg-accent-400 dark:bg-accent-600 transition-all duration-500" style={{ height: `${takenH}%` }} title={`${d.taken} taken`} />
                            {skippedH > 0 && (
                                <div className="w-full max-w-[36px] rounded-t-lg bg-red-300 dark:bg-red-700 transition-all duration-500" style={{ height: `${skippedH}%` }} title={`${d.skipped} skipped`} />
                            )}
                        </div>
                        <span className="text-xs text-gray-500">{dayLabel}</span>
                        <span className={`text-xs font-semibold ${d.rate >= 80 ? 'text-accent-600' : d.rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{d.rate}%</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function AnalyticsPage() {
    const [heatmapMonth, setHeatmapMonth] = useState({ year: 2026, month: 3 });
    const [exportingCsv, setExportingCsv] = useState(false);
    const [toast, setToast] = useState('');
    const [ready, setReady] = useState(false);

    useEffect(() => { setReady(true); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const stats = ready ? store.getAdherenceStats() : { overallScore: 0, onTimeRate: 0, totalDoses: 0, takenOnTime: 0, takenLate: 0, skipped: 0, currentStreak: 0 };
    const perMed = ready ? store.getPerMedicationStats() : [];

    // Generate weekly data from store
    const weeklyData = (() => {
        if (!ready) return [];
        const history = store.getHistory();
        const days: { date: string; total: number; taken: number; skipped: number; rate: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLogs = history.filter(h => h.date === dateStr);
            const total = dayLogs.length || 4;
            const taken = dayLogs.filter(l => l.status.startsWith('taken')).length;
            const skipped = dayLogs.filter(l => l.status === 'skipped').length;
            days.push({ date: dateStr, total, taken, skipped, rate: total > 0 ? Math.round((taken / total) * 100) : 0 });
        }
        return days;
    })();

    // Heatmap
    const daysInMonth = new Date(heatmapMonth.year, heatmapMonth.month, 0).getDate();
    const firstDayOffset = new Date(heatmapMonth.year, heatmapMonth.month - 1, 1).getDay();
    const heatmapCells = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const level = day <= 5 ? [4, 3, 4, 3, 4][i] : 0;
        return { day, level, rate: level > 0 ? level * 25 : -1 };
    });

    // Export handlers using store
    const handleExportCsv = () => {
        setExportingCsv(true);
        const csv = store.generateCsvData();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medminder-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => { setExportingCsv(false); showToast('✅ CSV exported!'); }, 600);
    };

    const handleExportPdf = () => {
        const win = window.open('', '_blank');
        if (!win) return showToast('⚠️ Please allow popups');
        win.document.write(store.generatePdfHtml());
        win.document.close();
        showToast('📄 PDF report opened — use Ctrl+P to print/save');
    };

    const handleDoctorMode = () => {
        const win = window.open('', '_blank');
        if (!win) return showToast('⚠️ Please allow popups');
        win.document.write(store.generateDoctorSummaryHtml());
        win.document.close();
        showToast('🩺 Doctor summary opened — use Ctrl+P to print');
    };

    const handleShareReport = async () => {
        const stats = store.getAdherenceStats();
        const text = `📊 My MedMinder Report\n\n` +
            `Overall Adherence: ${stats.overallScore}%\n` +
            `On-Time Rate: ${stats.onTimeRate}%\n` +
            `Current Streak: ${stats.currentStreak} days\n` +
            `Total Doses (30d): ${stats.totalDoses}\n\n` +
            `Generated by MedMinder — your medication companion`;

        if (navigator.share) {
            try { await navigator.share({ title: 'MedMinder Report', text }); } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(text);
            showToast('📋 Report summary copied to clipboard!');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slide-up">{toast}</div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your medication adherence over time</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleExportCsv} className="btn-secondary text-sm cursor-pointer" disabled={exportingCsv}>
                        {exportingCsv ? '⏳ Exporting...' : '📊 Export CSV'}
                    </button>
                    <button onClick={handleExportPdf} className="btn-secondary text-sm cursor-pointer">📄 PDF Report</button>
                    <button onClick={handleDoctorMode} className="btn-primary text-sm cursor-pointer">🩺 Doctor Mode</button>
                    <button onClick={handleShareReport} className="btn-secondary text-sm cursor-pointer">📤 Share</button>
                </div>
            </div>

            {/* Score + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex flex-col items-center justify-center py-8">
                    <ScoreRing score={stats.overallScore} />
                    <p className="text-sm text-gray-500 mt-3">Overall Adherence</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg font-bold text-primary-600">🔥 {stats.currentStreak}</span>
                        <span className="text-sm text-gray-500">day streak</span>
                    </div>
                </div>
                <div className="card grid grid-cols-2 gap-4 content-center">
                    <div className="text-center"><p className="text-2xl font-bold text-accent-600">{stats.takenOnTime}</p><p className="text-xs text-gray-500">On Time</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-amber-500">{stats.takenLate}</p><p className="text-xs text-gray-500">Late</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-red-500">{stats.skipped}</p><p className="text-xs text-gray-500">Skipped</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDoses}</p><p className="text-xs text-gray-500">Total Doses</p></div>
                </div>
                <div className="card flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-primary-600">{stats.onTimeRate}%</p>
                    <p className="text-sm text-gray-500 mt-2">On-Time Rate</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                        <div className="bg-primary-500 h-3 rounded-full transition-all duration-700" style={{ width: `${stats.onTimeRate}%` }} />
                    </div>
                </div>
            </div>

            {/* Weekly Bar Chart */}
            {weeklyData.length > 0 && (
                <div className="card">
                    <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">Last 7 Days</h2>
                    <BarChart data={weeklyData} />
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent-400 inline-block" /> Taken</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> Skipped</span>
                    </div>
                </div>
            )}

            {/* Heatmap */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">{MONTHS[heatmapMonth.month - 1]} {heatmapMonth.year}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setHeatmapMonth(p => p.month === 1 ? { year: p.year - 1, month: 12 } : { ...p, month: p.month - 1 })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                        </button>
                        <button onClick={() => setHeatmapMonth(p => p.month === 12 ? { year: p.year + 1, month: 1 } : { ...p, month: p.month + 1 })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map(d => (<div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d.slice(0, 2)}</div>))}
                    {Array.from({ length: firstDayOffset }).map((_, i) => (<div key={`empty-${i}`} />))}
                    {heatmapCells.map(cell => (
                        <div key={cell.day} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${LEVEL_COLORS[cell.level]} ${cell.level > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`} title={cell.rate >= 0 ? `${cell.rate}%` : 'No data'}>
                            {cell.day}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                    <span>Less</span>
                    {LEVEL_COLORS.map((c, i) => (<div key={i} className={`w-4 h-4 rounded ${c}`} />))}
                    <span>More</span>
                </div>
            </div>

            {/* Per-Medication */}
            <div className="card">
                <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">Per-Medication Adherence</h2>
                {perMed.length === 0 ? (
                    <p className="text-gray-500 text-sm">No medication data yet. Add medications to see per-drug analytics.</p>
                ) : (
                    <div className="space-y-4">
                        {perMed.sort((a, b) => b.adherenceRate - a.adherenceRate).map(med => (
                            <div key={med.medicationId}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div><span className="font-semibold text-gray-900 dark:text-white">{med.name}</span><span className="text-sm text-gray-500 ml-2">{med.dosage}</span></div>
                                    <span className={`text-sm font-bold ${med.adherenceRate >= 80 ? 'text-accent-600' : med.adherenceRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{med.adherenceRate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full transition-all duration-700 ${med.adherenceRate >= 80 ? 'bg-accent-500' : med.adherenceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${med.adherenceRate}%` }} />
                                </div>
                                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                    <span>{med.onTime} on time</span><span>{med.late} late</span><span>{med.skipped} skipped</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
