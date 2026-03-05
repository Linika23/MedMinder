// ============================================================
// MedMinder Shared Constants
// ============================================================

// --- Interaction Severity Colors ---
export const SEVERITY_COLORS = {
    critical: { bg: '#FEE2E2', text: '#991B1B', badge: '#DC2626' },
    major: { bg: '#FFEDD5', text: '#9A3412', badge: '#EA580C' },
    moderate: { bg: '#FEF9C3', text: '#854D0E', badge: '#CA8A04' },
    mild: { bg: '#DBEAFE', text: '#1E40AF', badge: '#2563EB' },
    none: { bg: '#DCFCE7', text: '#166534', badge: '#16A34A' },
} as const;

// --- Refill Warning Thresholds ---
export const REFILL_WARNING_DAYS = 14;
export const REFILL_CRITICAL_DAYS = 7;

// --- Snooze Options (minutes) ---
export const SNOOZE_OPTIONS = [5, 10, 15, 30, 60] as const;

// --- Max Caregivers Per Patient (MVP) ---
export const MAX_CAREGIVERS = 3;

// --- Caregiver Invite Expiry (hours) ---
export const CAREGIVER_INVITE_EXPIRY_HOURS = 48;

// --- JWT Durations ---
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// --- Password Config ---
export const BCRYPT_COST_FACTOR = 12;

// --- Pagination Defaults ---
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// --- Font Size Options ---
export const FONT_SIZE_OPTIONS = ['small', 'medium', 'large', 'extra_large'] as const;
export type FontSize = (typeof FONT_SIZE_OPTIONS)[number];

// --- Theme Options ---
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEME_OPTIONS)[number];

// --- Dose Status Labels ---
export const DOSE_STATUS_LABELS: Record<string, string> = {
    taken_on_time: 'Taken (On Time)',
    taken_late: 'Taken (Late)',
    skipped: 'Skipped',
    snoozed: 'Snoozed',
    pending: 'Pending',
} as const;

// --- Medication Type Labels ---
export const MEDICATION_TYPE_LABELS: Record<string, string> = {
    prescription: 'Prescription',
    otc: 'Over-the-Counter',
    supplement: 'Vitamin/Supplement',
    herbal: 'Herbal',
} as const;

// --- API Routes ---
export const API_ROUTES = {
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        VERIFY_EMAIL: '/api/auth/verify-email',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
    },
    MEDICATIONS: {
        BASE: '/api/medications',
        BY_ID: (id: string) => `/api/medications/${id}`,
    },
    DOSE_LOGS: {
        BASE: '/api/dose-logs',
        BY_ID: (id: string) => `/api/dose-logs/${id}`,
    },
    INTERACTIONS: {
        CHECK: '/api/interactions/check',
        BASE: '/api/interactions',
        BY_ID: (id: string) => `/api/interactions/${id}`,
    },
    CAREGIVERS: {
        INVITE: '/api/caregivers/invite',
        BASE: '/api/caregivers',
        BY_ID: (id: string) => `/api/caregivers/${id}`,
    },
    DRUGS: {
        SEARCH: '/api/drugs/search',
    },
    PROFILE: {
        BASE: '/api/profile',
        HEALTH: '/api/profile/health',
        SETTINGS: '/api/profile/settings',
    },
    ADHERENCE: {
        STATS: '/api/adherence/stats',
        WEEKLY: '/api/adherence/weekly',
        MONTHLY: '/api/adherence/monthly',
    },
    EXPORT: {
        PDF: '/api/export/pdf',
        CSV: '/api/export/csv',
    },
} as const;
