'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock caregiver patient data for UI development
const MOCK_PATIENTS = [
    {
        id: 'p1',
        patient: { id: 'u1', name: 'Margaret Johnson', email: 'margaret@example.com' },
        permissions: 'read',
        acceptedAt: '2025-12-01',
    },
];

const MOCK_DASHBOARD = {
    patient: {
        name: 'Margaret Johnson',
        conditions: ['Hypertension', 'Type 2 Diabetes'],
        allergies: ['Penicillin'],
        physicianName: 'Dr. Sarah Chen',
        physicianPhone: '+1 (555) 987-6543',
    },
    permissions: 'read',
    medications: [
        { id: 'm1', name: 'Lisinopril', dosage: '10', unit: 'mg', status: 'active', frequency: { type: 'once_daily', timesOfDay: ['08:00'] } },
        { id: 'm2', name: 'Metformin', dosage: '500', unit: 'mg', status: 'active', frequency: { type: 'twice_daily', timesOfDay: ['08:00', '20:00'] } },
        { id: 'm3', name: 'Vitamin D3', dosage: '2000', unit: 'IU', status: 'active', frequency: { type: 'once_daily', timesOfDay: ['08:00'] } },
    ],
    todayDoses: [
        { id: 'd1', medication: { name: 'Lisinopril', dosage: '10', unit: 'mg' }, scheduledTime: '2026-03-05T08:00:00Z', actualTime: '2026-03-05T08:12:00Z', status: 'taken_on_time' },
        { id: 'd2', medication: { name: 'Metformin', dosage: '500', unit: 'mg' }, scheduledTime: '2026-03-05T08:00:00Z', actualTime: '2026-03-05T08:05:00Z', status: 'taken_on_time' },
        { id: 'd3', medication: { name: 'Vitamin D3', dosage: '2000', unit: 'IU' }, scheduledTime: '2026-03-05T08:00:00Z', actualTime: '2026-03-05T08:10:00Z', status: 'taken_on_time' },
        { id: 'd4', medication: { name: 'Metformin', dosage: '500', unit: 'mg' }, scheduledTime: '2026-03-05T20:00:00Z', actualTime: null, status: 'pending' },
    ],
    stats: { activeMedications: 3, takenToday: 3, totalToday: 4, missedToday: 0, adherenceToday: 75 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    taken_on_time: { label: 'Taken', color: 'text-accent-700 dark:text-accent-400', bg: 'bg-accent-100 dark:bg-accent-900/30', icon: '✓' },
    taken_late: { label: 'Late', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: '⏱' },
    skipped: { label: 'Missed', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: '✗' },
    pending: { label: 'Upcoming', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: '○' },
};

export default function CaregiverDashboardPage() {
    const [selectedPatient, setSelectedPatient] = useState<string | null>(MOCK_PATIENTS[0]?.patient.id ?? null);
    const [dashboard, setDashboard] = useState(MOCK_DASHBOARD);
    const [view, setView] = useState<'overview' | 'medications' | 'history'>('overview');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Caregiver Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your patients&apos; medication adherence</p>
                </div>

                {/* Patient Selector */}
                {MOCK_PATIENTS.length > 1 && (
                    <select
                        value={selectedPatient || ''}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        className="input-field w-auto cursor-pointer"
                    >
                        {MOCK_PATIENTS.map((p) => (
                            <option key={p.patient.id} value={p.patient.id}>{p.patient.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Patient Header Card */}
            <div className="card-glass border-primary-200 dark:border-primary-800">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-600">{dashboard.patient.name[0]}</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{dashboard.patient.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {dashboard.patient.conditions.map((c) => (
                                <span key={c} className="text-xs font-medium px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">{c}</span>
                            ))}
                            {dashboard.patient.allergies.map((a) => (
                                <span key={a} className="text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">⚠ {a}</span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 hidden sm:block">
                        <p>Physician: {dashboard.patient.physicianName}</p>
                        <p>{dashboard.patient.physicianPhone}</p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Active Medications</p>
                    <p className="text-3xl font-bold text-primary-600 mt-1">{dashboard.stats.activeMedications}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Taken Today</p>
                    <p className="text-3xl font-bold text-accent-600 mt-1">{dashboard.stats.takenToday}/{dashboard.stats.totalToday}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Missed Today</p>
                    <p className={`text-3xl font-bold mt-1 ${dashboard.stats.missedToday > 0 ? 'text-red-600' : 'text-gray-400'}`}>{dashboard.stats.missedToday}</p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500">Today&apos;s Adherence</p>
                    <p className={`text-3xl font-bold mt-1 ${dashboard.stats.adherenceToday >= 80 ? 'text-accent-600' : dashboard.stats.adherenceToday >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {dashboard.stats.adherenceToday}%
                    </p>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {(['overview', 'medications', 'history'] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${view === v ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {v === 'overview' ? "Today's Schedule" : v === 'medications' ? 'Medications' : 'Recent History'}
                    </button>
                ))}
            </div>

            {/* Today's Schedule */}
            {view === 'overview' && (
                <div className="space-y-3">
                    {dashboard.todayDoses.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500">No doses scheduled for today</p>
                        </div>
                    ) : (
                        dashboard.todayDoses.map((dose) => {
                            const cfg = STATUS_CONFIG[dose.status] || STATUS_CONFIG.pending;
                            const schedTime = new Date(dose.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                            const actTime = dose.actualTime ? new Date(dose.actualTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;

                            return (
                                <div key={dose.id} className={`card py-3 flex items-center gap-4 ${dose.status === 'skipped' ? 'border-red-200 dark:border-red-800' : ''}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${cfg.bg}`}>
                                        {cfg.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900 dark:text-white">{dose.medication.name}</span>
                                            <span className="text-sm text-gray-500">{dose.medication.dosage} {dose.medication.unit}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">Scheduled: {schedTime}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        {actTime && <p className="text-xs text-gray-400 mt-1">at {actTime}</p>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Medications List */}
            {view === 'medications' && (
                <div className="space-y-3">
                    {dashboard.medications.map((med) => (
                        <div key={med.id} className="card flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{med.name}</h3>
                                    <span className="text-sm text-gray-500">{med.dosage} {med.unit}</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {med.frequency.type === 'once_daily' ? 'Once daily' :
                                        med.frequency.type === 'twice_daily' ? 'Twice daily' :
                                            med.frequency.type}
                                    {(med.frequency as any).timesOfDay && ` at ${(med.frequency as any).timesOfDay.map((t: string) => {
                                        const [h] = t.split(':').map(Number);
                                        return h >= 12 ? `${h === 12 ? 12 : h - 12}:${t.split(':')[1]} PM` : `${h}:${t.split(':')[1]} AM`;
                                    }).join(', ')}`}
                                </p>
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${med.status === 'active' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {med.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent History */}
            {view === 'history' && (
                <div className="space-y-3">
                    {dashboard.todayDoses.filter(d => d.status !== 'pending').map((dose) => {
                        const cfg = STATUS_CONFIG[dose.status] || STATUS_CONFIG.pending;
                        return (
                            <div key={dose.id} className="card py-3 flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${cfg.bg}`}>
                                    {cfg.icon}
                                </div>
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900 dark:text-white">{dose.medication.name}</span>
                                    <span className="text-sm text-gray-500 ml-2">{dose.medication.dosage} {dose.medication.unit}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                    {dose.actualTime && <p className="text-xs text-gray-400 mt-0.5">{new Date(dose.actualTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Permission notice */}
            <div className="text-center py-4">
                <p className="text-xs text-gray-400">
                    {dashboard.permissions === 'read' ? '🔒 You have view-only access' : '✏️ You have full access'}
                    {' · '}
                    <Link href="/dashboard/caregivers" className="text-primary-600 hover:underline cursor-pointer">Manage Access</Link>
                </p>
            </div>
        </div>
    );
}
