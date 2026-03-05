'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [consent, setConsent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('Please enter your name.'); return; }
        if (!email) { setError('Please enter your email.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
        if (!/[0-9]/.test(password)) { setError('Password must contain at least one number.'); return; }
        if (!/[^A-Za-z0-9]/.test(password)) { setError('Password must contain at least one special character.'); return; }
        if (!consent) { setError('Please agree to the Terms of Service and Privacy Policy.'); return; }

        setLoading(true);

        // Simulate registration — save user session to localStorage
        const user = {
            id: crypto.randomUUID(),
            email,
            name: name.trim(),
            phone: phone || undefined,
            loggedInAt: new Date().toISOString(),
            provider: 'email',
            isNewUser: true,
        };
        localStorage.setItem('medminder_user', JSON.stringify(user));
        localStorage.setItem('medminder_auth', 'true');

        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 500);
    };

    const handleSocialRegister = (provider: 'google' | 'apple') => {
        setLoading(true);
        setError('');

        const user = {
            id: crypto.randomUUID(),
            email: provider === 'google' ? 'user@gmail.com' : 'user@icloud.com',
            name: provider === 'google' ? 'Google User' : 'Apple User',
            loggedInAt: new Date().toISOString(),
            provider,
            isNewUser: true,
        };
        localStorage.setItem('medminder_user', JSON.stringify(user));
        localStorage.setItem('medminder_auth', 'true');

        setTimeout(() => router.push('/dashboard'), 500);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <span className="font-display text-xl font-bold text-gray-900 dark:text-white">MedMinder</span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="card-glass">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Start managing your medications safely</p>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleRegister}>
                        <div>
                            <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="register-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                className="input-field"
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Email
                            </label>
                            <input
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="input-field"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="register-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Phone Number <span className="text-gray-400">(optional, for SMS reminders)</span>
                            </label>
                            <input
                                id="register-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 123-4567"
                                className="input-field"
                                autoComplete="tel"
                            />
                        </div>

                        <div>
                            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Password
                            </label>
                            <input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 special"
                                className="input-field"
                                autoComplete="new-password"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1.5">8+ characters with uppercase, number, and special character</p>
                        </div>

                        {/* Consent */}
                        <div className="flex items-start gap-3">
                            <input
                                id="register-consent"
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                required
                            />
                            <label htmlFor="register-consent" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                                I agree to the{' '}
                                <Link href="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                            </label>
                        </div>

                        <button type="submit" className="btn-primary w-full cursor-pointer" disabled={loading}>
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white/80 dark:bg-gray-900/80 text-gray-500">or sign up with</span>
                        </div>
                    </div>

                    {/* Social */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="btn-secondary text-sm py-2.5 cursor-pointer" type="button" onClick={() => handleSocialRegister('google')} disabled={loading}>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </button>
                        <button className="btn-secondary text-sm py-2.5 cursor-pointer" type="button" onClick={() => handleSocialRegister('apple')} disabled={loading}>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" /><path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" /></svg>
                            Apple
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
