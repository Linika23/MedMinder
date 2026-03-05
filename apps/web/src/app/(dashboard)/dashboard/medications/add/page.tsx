'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { store } from '@/lib/store';

const COMMON_DRUGS = [
    'Acetaminophen', 'Albuterol', 'Amlodipine', 'Amoxicillin', 'Aspirin', 'Atenolol', 'Atorvastatin', 'Azithromycin',
    'Cetirizine', 'Clopidogrel', 'Cyclobenzaprine', 'Diclofenac',
    'Escitalopram', 'Famotidine', 'Fluoxetine', 'Furosemide', 'Gabapentin',
    'Hydrochlorothiazide', 'Ibuprofen', 'Insulin Glargine',
    'Levothyroxine', 'Lisinopril', 'Loratadine', 'Losartan', 'Meloxicam', 'Metformin', 'Metoprolol',
    'Montelukast', 'Naproxen', 'Omeprazole', 'Pantoprazole', 'Prednisone', 'Rosuvastatin',
    'Sertraline', 'Simvastatin', 'Tramadol', 'Trazodone',
    'Vitamin B12', 'Vitamin D3', 'Warfarin', 'Zolpidem',
];

const FREQUENCY_OPTIONS = [
    { value: 'once_daily', label: 'Once daily' },
    { value: 'twice_daily', label: 'Twice daily' },
    { value: 'three_times_daily', label: '3 times daily' },
    { value: 'every_x_hours', label: 'Every X hours' },
    { value: 'specific_days', label: 'Specific days' },
    { value: 'as_needed', label: 'As needed (PRN)' },
    { value: 'custom', label: 'Custom schedule' },
];

const UNIT_OPTIONS = ['mg', 'mcg', 'mL', 'IU', 'units', 'g', 'drops', 'puffs', 'patches'];
const FOOD_OPTIONS = [
    { value: 'no_preference', label: 'No preference' },
    { value: 'with', label: 'Take with food' },
    { value: 'without', label: 'Take without food' },
];
const TYPE_OPTIONS = [
    { value: 'prescription', label: 'Prescription' },
    { value: 'otc', label: 'Over-the-Counter' },
    { value: 'supplement', label: 'Vitamin / Supplement' },
    { value: 'herbal', label: 'Herbal' },
];
const TIME_PRESETS = [
    { value: '07:00', label: 'Morning (7:00 AM)' },
    { value: '12:00', label: 'Afternoon (12:00 PM)' },
    { value: '18:00', label: 'Evening (6:00 PM)' },
    { value: '22:00', label: 'Bedtime (10:00 PM)' },
];

export default function AddMedicationPage() {
    const [method, setMethod] = useState<'manual' | 'barcode' | 'ocr' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ rxcui: string; name: string; score: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        dosage: '',
        unit: 'mg',
        frequencyType: 'once_daily',
        timesOfDay: ['08:00'],
        medicationType: 'prescription',
        withFood: 'no_preference',
        instructions: '',
        startDate: '',
        endDate: '',
        quantityOnHand: '',
        refillThreshold: '',
        prescribingDoctor: '',
        pharmacy: '',
        reason: '',
        pillColor: '',
        pillShape: '',
    });

    const router = useRouter();
    const [toast, setToast] = useState('');
    const [saving, setSaving] = useState(false);

    // Client-side drug name search (no backend needed)
    useEffect(() => {
        if (searchQuery.length < 2) { setSearchResults([]); return; }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setIsSearching(true);
            const q = searchQuery.toLowerCase();
            const matches = COMMON_DRUGS
                .filter(d => d.toLowerCase().includes(q))
                .map((name, i) => ({ rxcui: String(i), name, score: '100' }));
            setSearchResults(matches.slice(0, 8));
            setIsSearching(false);
        }, 150);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [searchQuery]);

    const selectDrug = (name: string) => {
        setForm({ ...form, name });
        setSearchQuery(name);
        setSearchResults([]);
    };

    const updateForm = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const addTime = () => {
        setForm((prev) => ({ ...prev, timesOfDay: [...prev.timesOfDay, '12:00'] }));
    };

    const removeTime = (index: number) => {
        setForm((prev) => ({ ...prev, timesOfDay: prev.timesOfDay.filter((_, i) => i !== index) }));
    };

    const updateTime = (index: number, value: string) => {
        setForm((prev) => ({
            ...prev,
            timesOfDay: prev.timesOfDay.map((t, i) => (i === index ? value : t)),
        }));
    };

    // If no method selected, show method picker
    if (method === null) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                <div>
                    <Link href="/dashboard/medications" className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-4 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Back to medications
                    </Link>
                    <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Add Medication</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Choose how you&apos;d like to add your medication</p>
                </div>

                <div className="grid gap-4">
                    {/* Manual Entry */}
                    <button
                        onClick={() => setMethod('manual')}
                        className="card flex items-center gap-5 text-left hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                            <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Manual Entry</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Type medication details with smart drug name search</p>
                        </div>
                    </button>

                    {/* Barcode Scan */}
                    <button
                        onClick={() => setMethod('barcode')}
                        className="card flex items-center gap-5 text-left hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center group-hover:bg-accent-200 transition-colors flex-shrink-0">
                            <svg className="w-7 h-7 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Scan Barcode</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Scan the NDC barcode on your prescription bottle</p>
                        </div>
                    </button>

                    {/* OCR Label Scan */}
                    <button
                        onClick={() => setMethod('ocr')}
                        className="card flex items-center gap-5 text-left hover:border-primary-300 dark:hover:border-primary-700 cursor-pointer group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-200 transition-colors flex-shrink-0">
                            <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Scan Label (OCR)</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Take a photo of your prescription label to auto-fill details</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // Barcode / OCR placeholders
    if (method === 'barcode') {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <button onClick={() => setMethod(null)} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back
                </button>
                <div className="card text-center py-20">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Barcode Scanner</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Point your camera at the NDC barcode on your prescription bottle</p>
                    <div className="w-64 h-64 mx-auto rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center mb-6 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-sm text-gray-400">Camera preview area</p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Can&apos;t scan?{' '}
                        <button onClick={() => setMethod('manual')} className="text-primary-600 hover:underline cursor-pointer">Enter manually</button>
                    </p>
                </div>
            </div>
        );
    }

    if (method === 'ocr') {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <button onClick={() => setMethod(null)} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back
                </button>
                <div className="card text-center py-20">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Label Scanner (OCR)</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Take a clear photo of your prescription label</p>
                    <label className="btn-primary cursor-pointer inline-flex">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        Upload Photo
                        <input type="file" accept="image/*" capture="environment" className="hidden" />
                    </label>
                    <p className="text-sm text-gray-400 mt-6">
                        <strong>Tip:</strong> Ensure good lighting and the full label is visible.
                        <br />
                        Can&apos;t scan?{' '}
                        <button onClick={() => setMethod('manual')} className="text-primary-600 hover:underline cursor-pointer">Enter manually</button>
                    </p>
                </div>
            </div>
        );
    }

    // Manual entry form
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <button onClick={() => setMethod(null)} className="text-sm text-gray-500 hover:text-primary-600 flex items-center gap-1 mb-4 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back
                </button>
                <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Add Medication</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your medication details below</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                setSaving(true);
                store.addMedication({
                    name: form.name, dosage: form.dosage, unit: form.unit,
                    status: form.frequencyType === 'as_needed' ? 'prn' : 'active',
                    medicationType: form.medicationType as any,
                    frequency: { type: form.frequencyType, timesOfDay: form.timesOfDay },
                    withFood: form.withFood, instructions: form.instructions,
                    startDate: form.startDate || new Date().toISOString().split('T')[0],
                    endDate: form.endDate, quantityOnHand: parseInt(form.quantityOnHand) || 30,
                    refillThreshold: parseInt(form.refillThreshold) || 10,
                    prescribingDoctor: form.prescribingDoctor, pharmacy: form.pharmacy,
                    reason: form.reason, pillColor: form.pillColor, pillShape: form.pillShape,
                });
                setToast('✅ Medication saved!');
                setTimeout(() => router.push('/dashboard/medications'), 800);
            }}>
                {/* Medication Name with Autocomplete */}
                <div className="card space-y-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Drug Information</h2>

                    <div className="relative">
                        <label htmlFor="med-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Medication Name *
                        </label>
                        <input
                            id="med-name"
                            type="text"
                            value={searchQuery || form.name}
                            onChange={(e) => { setSearchQuery(e.target.value); updateForm('name', e.target.value); }}
                            placeholder="Start typing to search (e.g., Lisinopril, Metformin)"
                            className="input-field"
                            required
                            autoComplete="off"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-[38px]">
                                <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {searchResults.map((r) => (
                                    <button
                                        key={r.rxcui}
                                        type="button"
                                        onClick={() => selectDrug(r.name)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm text-gray-700 dark:text-gray-300 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="med-dosage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dosage *</label>
                            <input id="med-dosage" type="text" value={form.dosage} onChange={(e) => updateForm('dosage', e.target.value)} placeholder="e.g., 10" className="input-field" required />
                        </div>
                        <div>
                            <label htmlFor="med-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit</label>
                            <select id="med-unit" value={form.unit} onChange={(e) => updateForm('unit', e.target.value)} className="input-field cursor-pointer">
                                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="med-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                        <select id="med-type" value={form.medicationType} onChange={(e) => updateForm('medicationType', e.target.value)} className="input-field cursor-pointer">
                            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Schedule */}
                <div className="card space-y-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Schedule</h2>

                    <div>
                        <label htmlFor="med-freq" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frequency *</label>
                        <select id="med-freq" value={form.frequencyType} onChange={(e) => updateForm('frequencyType', e.target.value)} className="input-field cursor-pointer">
                            {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>

                    {form.frequencyType !== 'as_needed' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Times of Day</label>
                            <div className="space-y-2">
                                {form.timesOfDay.map((time, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => updateTime(i, e.target.value)}
                                            className="input-field flex-1"
                                        />
                                        {form.timesOfDay.length > 1 && (
                                            <button type="button" onClick={() => removeTime(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addTime} className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Add another time
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Food Instructions</label>
                        <div className="flex gap-2">
                            {FOOD_OPTIONS.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => updateForm('withFood', f.value)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${form.withFood === f.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="med-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                            <input id="med-start" type="date" value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="med-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                            <input id="med-end" type="date" value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="card space-y-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Additional Details</h2>

                    <div>
                        <label htmlFor="med-instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Instructions</label>
                        <input id="med-instructions" type="text" value={form.instructions} onChange={(e) => updateForm('instructions', e.target.value)} placeholder="e.g., Take in the morning with water" className="input-field" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="med-qty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantity On Hand</label>
                            <input id="med-qty" type="number" value={form.quantityOnHand} onChange={(e) => updateForm('quantityOnHand', e.target.value)} placeholder="e.g., 30" className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="med-refill" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Refill Alert (days)</label>
                            <input id="med-refill" type="number" value={form.refillThreshold} onChange={(e) => updateForm('refillThreshold', e.target.value)} placeholder="e.g., 7" className="input-field" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="med-doctor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prescribing Doctor</label>
                            <input id="med-doctor" type="text" value={form.prescribingDoctor} onChange={(e) => updateForm('prescribingDoctor', e.target.value)} placeholder="Dr. Smith" className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="med-pharmacy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pharmacy</label>
                            <input id="med-pharmacy" type="text" value={form.pharmacy} onChange={(e) => updateForm('pharmacy', e.target.value)} placeholder="CVS Pharmacy" className="input-field" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="med-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason for Taking</label>
                        <input id="med-reason" type="text" value={form.reason} onChange={(e) => updateForm('reason', e.target.value)} placeholder="e.g., Hypertension" className="input-field" />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1" disabled={saving || !form.name || !form.dosage}>
                        {saving ? '✅ Saved! Redirecting...' : 'Save Medication'}
                    </button>
                    <Link href="/dashboard/medications" className="btn-secondary">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
