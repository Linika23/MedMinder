'use client';

import Link from 'next/link';
import { useState } from 'react';

// Mock single medication data
const MOCK_MED = {
    id: '1', name: 'Lisinopril', dosage: '10', unit: 'mg', status: 'active',
    medicationType: 'prescription',
    frequency: { type: 'once_daily', timesOfDay: ['08:00'] },
    withFood: 'no_preference',
    instructions: 'Take in the morning',
    quantityOnHand: 25, refillThreshold: 7,
    prescribingDoctor: 'Dr. Sarah Chen',
    pharmacy: 'CVS Pharmacy',
    reason: 'Hypertension',
    startDate: '2025-01-15',
    createdAt: '2025-01-15T10:00:00Z',
};

const MOCK_DOSE_HISTORY = [
    { id: 'd1', scheduledTime: '2026-03-05T08:00:00Z', actualTime: '2026-03-05T08:12:00Z', status: 'taken_on_time' },
    { id: 'd2', scheduledTime: '2026-03-04T08:00:00Z', actualTime: '2026-03-04T07:55:00Z', status: 'taken_on_time' },
    { id: 'd3', scheduledTime: '2026-03-03T08:00:00Z', actualTime: null, status: 'skipped' },
    { id: 'd4', scheduledTime: '2026-03-02T08:00:00Z', actualTime: '2026-03-02T09:30:00Z', status: 'taken_late' },
    { id: 'd5', scheduledTime: '2026-03-01T08:00:00Z', actualTime: '2026-03-01T08:05:00Z', status: 'taken_on_time' },
    { id: 'd6', scheduledTime: '2026-02-28T08:00:00Z', actualTime: '2026-02-28T08:00:00Z', status: 'taken_on_time' },
    { id: 'd7', scheduledTime: '2026-02-27T08:00:00Z', actualTime: '2026-02-27T08:20:00Z', status: 'taken_on_time' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    taken_on_time: { label: 'Taken on time', color: 'text-accent-700', bg: 'bg-accent-100 dark:bg-accent-900/30' },
    taken_late: { label: 'Taken late', color: 'text-amber-700', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    skipped: { label: 'Skipped', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
    snoozed: { label: 'Snoozed', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    pending: { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
};

export default function MedicationDetailPage({ params }: { params: { id: string } }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [doseAction, setDoseAction] = useState<string | null>(null);
    const med = MOCK_MED;

    const adherenceRate = Math.round(
        (MOCK_DOSE_HISTORY.filter((d) => d.status === 'taken_on_time' || d.status === 'taken_late').length / MOCK_DOSE_HISTORY.length) * 100
    );

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <Link href="/dashboard/medications" className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-4 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back to medications
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{med.name}</h1>
                            <span className="text-lg text-gray-500">{med.dosage} {med.unit}</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {med.medicationType === 'prescription' ? 'Prescription' : med.medicationType} • {med.reason}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/dashboard/medications/${med.id}/edit`} className="btn-secondary text-sm py-2 px-4">
                            Edit
                        </Link>
                        <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger text-sm py-2 px-4 cursor-pointer">
                            Discontinue
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Dose Action — "Did you take your dose?" */}
            <div className="card-glass border-primary-200 dark:border-primary-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Next dose due</h3>
                        <p className="text-2xl font-bold text-primary-600 mt-1">
                            {med.frequency.timesOfDay?.[0] ? new Date(`2000-01-01T${med.frequency.timesOfDay[0]}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'As needed'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDoseAction('taken')}
                            className={`px-5 py-3 rounded-xl font-semibold transition-all cursor-pointer ${doseAction === 'taken'
                                    ? 'bg-accent-600 text-white scale-105'
                                    : 'bg-accent-100 text-accent-700 hover:bg-accent-200 dark:bg-accent-900/30 dark:text-accent-400'
                                }`}
                        >
                            ✓ Taken
                        </button>
                        <button
                            onClick={() => setDoseAction('skipped')}
                            className={`px-5 py-3 rounded-xl font-semibold transition-all cursor-pointer ${doseAction === 'skipped'
                                    ? 'bg-red-600 text-white scale-105'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                        >
                            ✗ Skip
                        </button>
                        <button
                            onClick={() => setDoseAction('snoozed')}
                            className={`px-5 py-3 rounded-xl font-semibold transition-all cursor-pointer ${doseAction === 'snoozed'
                                    ? 'bg-blue-600 text-white scale-105'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                        >
                            ⏰ Snooze
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">7-Day Adherence</p>
                    <p className={`text-3xl font-bold mt-1 ${adherenceRate >= 80 ? 'text-accent-600' : adherenceRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {adherenceRate}%
                    </p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Supply Left</p>
                    <p className={`text-3xl font-bold mt-1 ${med.quantityOnHand <= med.refillThreshold ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {med.quantityOnHand}
                    </p>
                </div>
                <div className="card text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Days Until Refill</p>
                    <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{med.quantityOnHand}</p>
                </div>
            </div>

            {/* Details */}
            <div className="card">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">Frequency</dt>
                        <dd className="font-medium text-gray-900 dark:text-white mt-0.5">Once daily at 8:00 AM</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">With Food</dt>
                        <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{med.withFood === 'with' ? 'Yes' : med.withFood === 'without' ? 'No' : 'No preference'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">Instructions</dt>
                        <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{med.instructions || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">Started</dt>
                        <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{med.startDate ? new Date(med.startDate).toLocaleDateString() : '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">Prescribing Doctor</dt>
                        <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{med.prescribingDoctor || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500 dark:text-gray-400">Pharmacy</dt>
                        <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{med.pharmacy || '—'}</dd>
                    </div>
                </dl>
            </div>

            {/* Dose History */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Dose History</h2>
                    <Link href="/dashboard/history" className="text-sm text-primary-600 hover:underline cursor-pointer">View all</Link>
                </div>
                <div className="space-y-2">
                    {MOCK_DOSE_HISTORY.map((dose) => {
                        const cfg = STATUS_CONFIG[dose.status] || STATUS_CONFIG.pending;
                        return (
                            <div key={dose.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                        {cfg.label}
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-white">{formatDate(dose.scheduledTime)}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {dose.actualTime ? `Taken at ${formatTime(dose.actualTime)}` : 'Not taken'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="card max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Discontinue {med.name}?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            This will mark the medication as discontinued. It will still appear in your history but reminders will stop.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 cursor-pointer">Cancel</button>
                            <button className="btn-danger flex-1 cursor-pointer">Discontinue</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
