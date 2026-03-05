'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { store, type DoseLog } from '@/lib/store';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    taken_on_time: { label: 'Taken ✓', color: 'text-green-700', bg: 'bg-green-100' },
    taken_late: { label: 'Late ⏰', color: 'text-amber-700', bg: 'bg-amber-100' },
    pending: { label: 'Pending', color: 'text-blue-700', bg: 'bg-blue-100' },
    skipped: { label: 'Skipped ✗', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function DashboardPage() {
    const [doses, setDoses] = useState<DoseLog[]>([]);
    const [toast, setToast] = useState('');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setDoses(store.getTodayDoses());
        setReady(true);
        const unsub = store.subscribe(() => setDoses(store.getTodayDoses()));
        return () => { unsub(); };
    }, []);

    const meds = ready ? store.getMedications() : [];
    const interactions = ready ? store.getInteractions().filter(i => i.severity === 'major' || i.severity === 'critical') : [];
    const takenCount = doses.filter(d => d.status.startsWith('taken')).length;
    const totalCount = doses.length;
    const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
    const activeMeds = meds.filter(m => m.status !== 'discontinued').length;
    const streak = ready ? store.getAdherenceStats().currentStreak : 0;

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleTakeDose = (doseId: string) => {
        store.takeDose(doseId);
        setDoses(store.getTodayDoses());
        const dose = doses.find(d => d.id === doseId);
        showToast(`✅ ${dose?.medicationName} marked as taken!`);
    };

    const handleSkipDose = (doseId: string) => {
        store.skipDose(doseId);
        setDoses(store.getTodayDoses());
        const dose = doses.find(d => d.id === doseId);
        showToast(`⏭️ ${dose?.medicationName} skipped`);
    };

    const timeLabel = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slide-up">{toast}</div>
            )}

            <div>
                <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Good afternoon</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Here&apos;s your medication overview for today</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Adherence Score', value: `${adherence}%`, color: 'text-accent-600' },
                    { label: 'Doses Today', value: `${takenCount}/${totalCount}`, color: 'text-primary-600' },
                    { label: 'Active Medications', value: String(activeMeds), color: 'text-purple-600' },
                    { label: 'Day Streak', value: String(streak), color: 'text-amber-600' },
                ].map((stat, i) => (
                    <div key={i} className="card">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Interaction Alerts */}
            {interactions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-2xl mt-0.5">⚠️</span>
                    <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-200">{interactions.length} {interactions[0].severity === 'critical' ? 'Critical' : 'Major'} Interaction{interactions.length > 1 ? 's' : ''} Detected</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">{interactions[0].medA.name} + {interactions[0].medB.name} — {interactions[0].description.slice(0, 80)}...</p>
                        <Link href="/dashboard/interactions" className="text-sm text-amber-800 dark:text-amber-200 font-medium underline mt-1 inline-block">View details →</Link>
                    </div>
                </div>
            )}

            {/* Today's Schedule */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today&apos;s Schedule</h2>
                    <Link href="/dashboard/medications" className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer">View all medications</Link>
                </div>
                {doses.length === 0 ? (
                    <div className="card text-center py-16">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No medications yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first medication to get started</p>
                        <Link href="/dashboard/medications/add" className="btn-primary">Add Medication</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {doses.map(dose => {
                            const s = STATUS_MAP[dose.status] || STATUS_MAP.pending;
                            return (
                                <div key={dose.id} className="card flex items-center justify-between py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg">💊</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{dose.medicationName}</p>
                                            <p className="text-sm text-gray-500">{dose.dosage} · {timeLabel(dose.scheduledTime)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                                        {dose.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleTakeDose(dose.id)} className="px-3 py-1.5 bg-accent-500 text-white text-xs font-semibold rounded-lg hover:bg-accent-600 transition-colors cursor-pointer">Take</button>
                                                <button onClick={() => handleSkipDose(dose.id)} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">Skip</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link href="/dashboard/medications/add" className="card group hover:border-primary-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                            <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </div>
                        <div><p className="font-medium text-gray-900 dark:text-white">Add Medication</p><p className="text-sm text-gray-500">Manual, barcode, or OCR scan</p></div>
                    </Link>
                    <Link href="/dashboard/interactions" className="card group hover:border-primary-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                        </div>
                        <div><p className="font-medium text-gray-900 dark:text-white">Check Interactions</p><p className="text-sm text-gray-500">AI-powered safety check</p></div>
                    </Link>
                    <Link href="/dashboard/analytics" className="card group hover:border-primary-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                            <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                        </div>
                        <div><p className="font-medium text-gray-900 dark:text-white">View Analytics</p><p className="text-sm text-gray-500">Adherence charts & reports</p></div>
                    </Link>
                </div>
            </section>
        </div>
    );
}
