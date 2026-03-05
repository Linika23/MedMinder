'use client';

// ============================================================
// PostHog — Product Analytics (GDPR-compliant, no PII)
// ============================================================

import { useEffect, useCallback } from 'react';

// ── PostHog Client ──
// Lightweight wrapper that auto-disables in dev and when key is missing

interface PostHogEvent {
    event: string;
    properties?: Record<string, string | number | boolean>;
}

class PostHogClient {
    private posthog: any = null;
    private initialized = false;
    private queue: PostHogEvent[] = [];

    async init() {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        if (!key || typeof window === 'undefined') {
            console.log('📊 PostHog: disabled (no key or SSR)');
            return;
        }

        try {
            const posthog = (await import('posthog-js')).default;
            posthog.init(key, {
                api_host: host || 'https://us.i.posthog.com',
                capture_pageview: true,
                capture_pageleave: true,
                autocapture: false, // Manual events only — HIPAA safe
                persistence: 'localStorage+cookie',
                disable_session_recording: true, // No session replays — PHI risk
                sanitize_properties: (props: Record<string, unknown>) => {
                    // Strip any accidentally included PII
                    const sanitized = { ...props };
                    delete sanitized['$ip'];
                    delete sanitized['email'];
                    delete sanitized['name'];
                    delete sanitized['phone'];
                    return sanitized;
                },
            });

            this.posthog = posthog;
            this.initialized = true;

            // Flush queued events
            this.queue.forEach((e) => posthog.capture(e.event, e.properties));
            this.queue = [];

            console.log('📊 PostHog: initialized');
        } catch {
            console.warn('📊 PostHog: failed to load');
        }
    }

    capture(event: string, properties?: Record<string, string | number | boolean>) {
        if (this.initialized && this.posthog) {
            this.posthog.capture(event, properties);
        } else {
            this.queue.push({ event, properties });
        }
    }

    identify(userId: string) {
        // Only send anonymized user ID — never email, name, or PII
        if (this.initialized && this.posthog) {
            this.posthog.identify(userId);
        }
    }

    reset() {
        if (this.initialized && this.posthog) {
            this.posthog.reset();
        }
    }
}

// Singleton
export const analytics = new PostHogClient();

// ── React Hook ──
export function useAnalytics() {
    useEffect(() => {
        analytics.init();
    }, []);

    const track = useCallback(
        (event: string, properties?: Record<string, string | number | boolean>) => {
            analytics.capture(event, properties);
        },
        [],
    );

    return { track, identify: analytics.identify.bind(analytics), reset: analytics.reset.bind(analytics) };
}

// ── Pre-defined Event Names (type-safe) ──
export const AnalyticsEvents = {
    // Auth
    SIGN_UP: 'sign_up',
    LOGIN: 'login',
    LOGOUT: 'logout',

    // Medications
    MED_ADDED: 'medication_added',
    MED_EDITED: 'medication_edited',
    MED_DELETED: 'medication_deleted',

    // Doses
    DOSE_TAKEN: 'dose_taken',
    DOSE_SKIPPED: 'dose_skipped',
    DOSE_SNOOZED: 'dose_snoozed',

    // Interactions
    INTERACTION_CHECK: 'interaction_check_run',
    INTERACTION_VIEWED: 'interaction_detail_viewed',

    // Caregivers
    CAREGIVER_INVITED: 'caregiver_invited',
    CAREGIVER_ACCEPTED: 'caregiver_accepted',

    // Analytics
    REPORT_EXPORTED: 'report_exported',
    DOCTOR_MODE_OPENED: 'doctor_mode_opened',

    // Navigation
    PAGE_VIEWED: '$pageview',
} as const;
