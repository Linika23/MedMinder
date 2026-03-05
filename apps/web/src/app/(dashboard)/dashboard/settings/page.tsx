'use client';

import { useState } from 'react';

export default function SettingsPage() {
    const [profile, setProfile] = useState({
        name: 'Margaret Johnson',
        email: 'margaret@example.com',
        phone: '+1 (555) 123-4567',
        dateOfBirth: '1954-03-15',
        biologicalSex: 'F',
        weightKg: '68',
        conditions: 'Hypertension, Type 2 Diabetes',
        allergies: 'Penicillin',
        physicianName: 'Dr. Sarah Chen',
        physicianPhone: '+1 (555) 987-6543',
        pharmacyName: 'CVS Pharmacy',
        pharmacyPhone: '+1 (555) 111-2222',
    });

    const [prefs, setPrefs] = useState({
        theme: 'system',
        fontSize: 'medium',
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: true,
        dndStart: '22:00',
        dndEnd: '07:00',
    });

    const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
        { id: 'preferences' as const, label: 'Preferences', icon: 'M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495' },
        { id: 'notifications' as const, label: 'Notifications', icon: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' },
        { id: 'security' as const, label: 'Security', icon: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                        </svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="card space-y-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                <input type="email" value={profile.email} disabled className="input-field opacity-60" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                                <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of Birth</label>
                                <input type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} className="input-field" />
                            </div>
                        </div>
                    </div>

                    <div className="card space-y-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Health Profile</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Biological Sex</label>
                                <select value={profile.biologicalSex} onChange={(e) => setProfile({ ...profile, biologicalSex: e.target.value })} className="input-field cursor-pointer">
                                    <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option><option value="U">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Weight (kg)</label>
                                <input type="number" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: e.target.value })} className="input-field" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Medical Conditions</label>
                                <input type="text" value={profile.conditions} onChange={(e) => setProfile({ ...profile, conditions: e.target.value })} className="input-field" placeholder="Comma-separated" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Allergies</label>
                                <input type="text" value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} className="input-field" placeholder="Comma-separated" />
                            </div>
                        </div>
                    </div>

                    <div className="card space-y-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Healthcare Providers</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Physician Name</label><input type="text" value={profile.physicianName} onChange={(e) => setProfile({ ...profile, physicianName: e.target.value })} className="input-field" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Physician Phone</label><input type="tel" value={profile.physicianPhone} onChange={(e) => setProfile({ ...profile, physicianPhone: e.target.value })} className="input-field" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pharmacy Name</label><input type="text" value={profile.pharmacyName} onChange={(e) => setProfile({ ...profile, pharmacyName: e.target.value })} className="input-field" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pharmacy Phone</label><input type="tel" value={profile.pharmacyPhone} onChange={(e) => setProfile({ ...profile, pharmacyPhone: e.target.value })} className="input-field" /></div>
                        </div>
                    </div>

                    <button className="btn-primary">Save Changes</button>
                </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <div className="space-y-6">
                    <div className="card space-y-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                            <div className="flex gap-3">
                                {['light', 'dark', 'system'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setPrefs({ ...prefs, theme: t })}
                                        className={`flex-1 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${prefs.theme === t ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
                            <div className="flex gap-3">
                                {[{ v: 'small', l: 'Small' }, { v: 'medium', l: 'Medium' }, { v: 'large', l: 'Large' }, { v: 'extra_large', l: 'Extra Large' }].map((s) => (
                                    <button
                                        key={s.v}
                                        onClick={() => setPrefs({ ...prefs, fontSize: s.v })}
                                        className={`flex-1 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${prefs.fontSize === s.v ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        {s.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button className="btn-primary">Save Preferences</button>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="card space-y-6">
                    <h2 className="font-semibold text-gray-900 dark:text-white">Notification Channels</h2>
                    {[
                        { key: 'pushEnabled', label: 'Push Notifications', desc: 'Browser and mobile push alerts' },
                        { key: 'smsEnabled', label: 'SMS Reminders', desc: 'Text message reminders to your phone' },
                        { key: 'emailEnabled', label: 'Email Reminders', desc: 'Reminder emails and weekly reports' },
                    ].map((ch) => (
                        <div key={ch.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{ch.label}</p>
                                <p className="text-sm text-gray-500">{ch.desc}</p>
                            </div>
                            <button
                                onClick={() => setPrefs({ ...prefs, [ch.key]: !(prefs as any)[ch.key] })}
                                className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer ${(prefs as any)[ch.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${(prefs as any)[ch.key] ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    ))}

                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Do Not Disturb</h3>
                        <div className="flex items-center gap-3">
                            <input type="time" value={prefs.dndStart} onChange={(e) => setPrefs({ ...prefs, dndStart: e.target.value })} className="input-field w-auto" />
                            <span className="text-gray-500">to</span>
                            <input type="time" value={prefs.dndEnd} onChange={(e) => setPrefs({ ...prefs, dndEnd: e.target.value })} className="input-field w-auto" />
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    <div className="card space-y-5">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label><input type="password" className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label><input type="password" className="input-field" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label><input type="password" className="input-field" /></div>
                        <button className="btn-primary">Update Password</button>
                    </div>

                    <div className="card">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add an extra layer of security to your account</p>
                        <button className="btn-secondary cursor-pointer">Enable 2FA</button>
                    </div>

                    <div className="card border-red-200 dark:border-red-800">
                        <h2 className="font-semibold text-red-600 mb-2">Danger Zone</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <button className="btn-danger cursor-pointer">Delete Account</button>
                    </div>
                </div>
            )}
        </div>
    );
}
