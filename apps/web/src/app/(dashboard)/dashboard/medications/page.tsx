'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { store, type Medication } from '@/lib/store';

const FREQ_LABELS: Record<string, string> = {
    once_daily: 'Once daily', twice_daily: 'Twice daily', three_times_daily: '3× daily',
    as_needed: 'As needed', custom: 'Custom',
};

const TYPE_ICONS: Record<string, string> = {
    prescription: '💊', otc: '🏥', supplement: '🌿', herbal: '🍃',
};

export default function MedicationsPage() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'prn' | 'discontinued'>('all');
    const [toast, setToast] = useState('');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setMedications(store.getMedications());
        setReady(true);
        const unsub = store.subscribe(() => setMedications(store.getMedications()));
        return () => { unsub(); };
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleDiscontinue = (id: string) => {
        store.deleteMedication(id);
        setMedications(store.getMedications());
        showToast('🗑️ Medication discontinued');
    };

    const handleReactivate = (id: string) => {
        store.updateMedication(id, { status: 'active' });
        setMedications(store.getMedications());
        showToast('✅ Medication reactivated');
    };

    const filtered = medications
        .filter(m => filter === 'all' || m.status === filter)
        .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

    const counts = {
        all: medications.length,
        active: medications.filter(m => m.status === 'active').length,
        prn: medications.filter(m => m.status === 'prn').length,
        discontinued: medications.filter(m => m.status === 'discontinued').length,
    };

    if (!ready) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slide-up">{toast}</div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Medications</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{counts.active} active · {counts.prn} as-needed · {counts.discontinued} discontinued</p>
                </div>
                <Link href="/dashboard/medications/add" className="btn-primary inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Medication
                </Link>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medications..." className="input-field pl-10" />
                </div>
                <div className="flex gap-1.5">
                    {(['all', 'active', 'prn', 'discontinued'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'}`}>
                            {f === 'all' ? 'All' : f === 'prn' ? 'PRN' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
                        </button>
                    ))}
                </div>
            </div>

            {/* Medication Cards */}
            {filtered.length === 0 ? (
                <div className="card text-center py-16">
                    <p className="text-gray-500 text-lg mb-4">{search ? 'No medications match your search' : 'No medications in this category'}</p>
                    <Link href="/dashboard/medications/add" className="btn-primary">Add Your First Medication</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(med => (
                        <div key={med.id} className="card flex items-center justify-between py-4 group">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl flex-shrink-0">
                                    {TYPE_ICONS[med.medicationType] || '💊'}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{med.name}</p>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${med.status === 'active' ? 'bg-green-100 text-green-700' : med.status === 'prn' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {med.status === 'prn' ? 'PRN' : med.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {med.dosage} {med.unit} · {FREQ_LABELS[med.frequency.type] || med.frequency.type}
                                        {med.withFood === 'with' && ' · With food'}
                                        {med.reason && ` · ${med.reason}`}
                                    </p>
                                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                        {med.quantityOnHand <= (med.refillThreshold || 10) && med.status !== 'discontinued' && (
                                            <span className={`font-semibold ${med.quantityOnHand <= 7 ? 'text-red-500' : 'text-amber-500'}`}>
                                                ⚠️ {med.quantityOnHand} pills left
                                            </span>
                                        )}
                                        {med.prescribingDoctor && <span>👨‍⚕️ {med.prescribingDoctor}</span>}
                                        {med.pharmacy && <span>🏪 {med.pharmacy}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {med.status === 'discontinued' ? (
                                    <button onClick={() => handleReactivate(med.id)} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition-colors cursor-pointer">Reactivate</button>
                                ) : (
                                    <button onClick={() => handleDiscontinue(med.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer">Discontinue</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
