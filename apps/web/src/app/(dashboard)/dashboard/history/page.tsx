'use client';

import { useState, useEffect } from 'react';
import { store, type DoseLog } from '@/lib/store';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    taken_on_time: { label: 'On Time', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: '✅' },
    taken_late: { label: 'Late', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: '⏰' },
    skipped: { label: 'Skipped', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: '✗' },
    pending: { label: 'Pending', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: '○' },
};

export default function HistoryPage() {
    const [history, setHistory] = useState<DoseLog[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterMed, setFilterMed] = useState<string>('all');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const allHistory = [...store.getHistory(), ...store.getTodayDoses()];
        setHistory(allHistory.sort((a, b) => b.date.localeCompare(a.date) || a.scheduledTime.localeCompare(b.scheduledTime)));
        setReady(true);
        const unsub = store.subscribe(() => {
            const updated = [...store.getHistory(), ...store.getTodayDoses()];
            setHistory(updated.sort((a, b) => b.date.localeCompare(a.date) || a.scheduledTime.localeCompare(b.scheduledTime)));
        });
        return () => { unsub(); };
    }, []);

    const medNames = [...new Set(history.map(h => h.medicationName))].sort();

    const filtered = history
        .filter(h => filterStatus === 'all' || h.status === filterStatus)
        .filter(h => filterMed === 'all' || h.medicationName === filterMed);

    // Group by date
    const grouped = new Map<string, DoseLog[]>();
    filtered.forEach(h => {
        const existing = grouped.get(h.date) || [];
        existing.push(h);
        grouped.set(h.date, existing);
    });

    const timeLabel = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const dateLabel = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dateStr === today) return 'Today';
        if (dateStr === yesterday) return 'Yesterday';
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    if (!ready) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Dose History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} entries · Last 14 days</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <select value={filterMed} onChange={e => setFilterMed(e.target.value)} className="input-field cursor-pointer">
                    <option value="all">All Medications</option>
                    {medNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex gap-1.5 flex-wrap">
                    {[{ key: 'all', label: 'All' }, { key: 'taken_on_time', label: 'On Time' }, { key: 'taken_late', label: 'Late' }, { key: 'skipped', label: 'Skipped' }].map(f => (
                        <button key={f.key} onClick={() => setFilterStatus(f.key)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${filterStatus === f.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grouped By Date */}
            {[...grouped.entries()].map(([date, logs]) => (
                <div key={date}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{dateLabel(date)}</h3>
                    <div className="space-y-2">
                        {logs.map(log => {
                            const s = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={log.id} className="card py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{s.icon}</span>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{log.medicationName}</p>
                                            <p className="text-xs text-gray-500">{log.dosage} · Scheduled {timeLabel(log.scheduledTime)}{log.actualTime ? ` · Taken ${log.actualTime}` : ''}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {filtered.length === 0 && (
                <div className="card text-center py-16">
                    <p className="text-gray-500 text-lg">No history entries match your filters</p>
                </div>
            )}
        </div>
    );
}
