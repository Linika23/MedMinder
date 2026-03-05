'use client';

import { useState } from 'react';

const MOCK_CAREGIVERS = [
    { id: '1', name: 'Priya Sharma', email: 'priya@example.com', status: 'active', permissions: 'read', acceptedAt: '2025-12-01' },
    { id: '2', name: null, email: 'john@example.com', status: 'pending', permissions: 'write', invitedAt: '2026-03-01' },
];

export default function CaregiversPage() {
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState({ emailOrPhone: '', permissions: 'read' as 'read' | 'write' });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Caregivers</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Share access with family members and caregivers</p>
                </div>
                <button onClick={() => setShowInvite(true)} className="btn-primary cursor-pointer">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                    Invite Caregiver
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-5">
                <div className="flex gap-3">
                    <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                    <div>
                        <p className="font-medium text-primary-800 dark:text-primary-200">How Caregiver Access Works</p>
                        <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                            Caregivers with <strong>read</strong> access can view your medications and dose history.
                            Those with <strong>write</strong> access can also manage medications and log doses on your behalf.
                            You can revoke access at any time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Caregiver List */}
            <div className="space-y-3">
                {MOCK_CAREGIVERS.map((cg) => (
                    <div key={cg.id} className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold text-violet-600 dark:text-violet-400">
                                {cg.name ? cg.name[0] : cg.email[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{cg.name || 'Pending'}</h3>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cg.status === 'active' ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' :
                                        cg.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {cg.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{cg.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {cg.permissions === 'write' ? 'Can view & edit' : 'View-only access'}
                                {cg.status === 'pending' && ` • Invited ${new Date(cg.invitedAt!).toLocaleDateString()}`}
                            </p>
                        </div>
                        <button className="text-sm text-red-500 hover:text-red-600 font-medium cursor-pointer">
                            {cg.status === 'pending' ? 'Cancel' : 'Revoke'}
                        </button>
                    </div>
                ))}

                {MOCK_CAREGIVERS.length === 0 && (
                    <div className="card text-center py-16">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No caregivers yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Invite a family member or caregiver to monitor your medications</p>
                        <button onClick={() => setShowInvite(true)} className="btn-primary cursor-pointer">Invite Caregiver</button>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="card max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Invite a Caregiver</h3>
                        <form onSubmit={(e) => { e.preventDefault(); setShowInvite(false); }} className="space-y-5">
                            <div>
                                <label htmlFor="invite-contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email or Phone Number
                                </label>
                                <input
                                    id="invite-contact"
                                    type="text"
                                    value={inviteForm.emailOrPhone}
                                    onChange={(e) => setInviteForm({ ...inviteForm, emailOrPhone: e.target.value })}
                                    placeholder="caregiver@email.com or +1 555-123-4567"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Permission Level</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setInviteForm({ ...inviteForm, permissions: 'read' })}
                                        className={`flex-1 p-4 rounded-xl border-2 text-left cursor-pointer transition-colors ${inviteForm.permissions === 'read' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">View Only</p>
                                        <p className="text-xs text-gray-500 mt-1">Can view medications and dose history</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInviteForm({ ...inviteForm, permissions: 'write' })}
                                        className={`flex-1 p-4 rounded-xl border-2 text-left cursor-pointer transition-colors ${inviteForm.permissions === 'write' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Full Access</p>
                                        <p className="text-xs text-gray-500 mt-1">Can view, edit, and log doses</p>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1 cursor-pointer">Cancel</button>
                                <button type="submit" className="btn-primary flex-1 cursor-pointer">Send Invite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
