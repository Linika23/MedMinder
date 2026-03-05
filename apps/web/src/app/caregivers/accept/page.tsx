'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
    const [patientName, setPatientName] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        // Simulate accepting invite via API
        const acceptInvite = async () => {
            try {
                const res = await fetch('/api/caregivers/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ token }),
                });

                if (!res.ok) {
                    const error = await res.json().catch(() => ({}));
                    if (error.message?.includes('expired')) {
                        setStatus('expired');
                    } else {
                        setStatus('error');
                    }
                    return;
                }

                const data = await res.json();
                setPatientName(data.data?.patientName || 'your patient');
                setStatus('success');
            } catch {
                setStatus('error');
            }
        };

        acceptInvite();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="card max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accepting Invitation...</h2>
                        <p className="text-gray-500 mt-2">Please wait while we set up your caregiver access.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re Connected!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            You now have caregiver access to <strong>{patientName}&apos;s</strong> medications and dose history.
                        </p>
                        <Link href="/dashboard/caregiver-view" className="btn-primary w-full">
                            View Patient Dashboard
                        </Link>
                    </>
                )}

                {status === 'expired' && (
                    <>
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invite Expired</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            This invitation link has expired. Please ask the patient to send a new invite from their MedMinder app.
                        </p>
                        <Link href="/" className="btn-secondary w-full">Go Home</Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something Went Wrong</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            We couldn&apos;t process this invitation. The link may be invalid or already used.
                        </p>
                        <Link href="/" className="btn-secondary w-full">Go Home</Link>
                    </>
                )}
            </div>
        </div>
    );
}
