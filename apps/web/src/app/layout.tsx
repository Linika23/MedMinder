import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'MedMinder — Medication Reminder + Interaction Checker',
    description:
        'AI-powered medication management app with smart reminders, drug interaction checking, caregiver dashboards, and adherence analytics. Take the right pills at the right time, safely.',
    keywords: [
        'medication reminder',
        'drug interaction checker',
        'pill reminder',
        'medication management',
        'caregiver',
        'adherence',
        'health',
    ],
    authors: [{ name: 'MedMinder' }],
    openGraph: {
        title: 'MedMinder — Medication Reminder + Interaction Checker',
        description: 'AI-powered medication management for safer, smarter health.',
        type: 'website',
    },
    robots: { index: true, follow: true },
    manifest: '/manifest.json',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5, // WCAG: allow pinch-zoom up to 5x
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#0C6E8A' },
        { media: '(prefers-color-scheme: dark)', color: '#0A4F64' },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen" data-font-size="medium">
                {/* WCAG Skip Navigation Link */}
                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>

                {/* ARIA Live Region for dynamic announcements */}
                <div
                    id="live-announcer"
                    aria-live="polite"
                    aria-atomic="true"
                    className="live-region"
                    role="status"
                />

                {children}
            </body>
        </html>
    );
}
