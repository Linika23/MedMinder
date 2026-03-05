// ============================================================
// API Client — Fetch wrapper for MedMinder backend
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchOptions extends RequestInit {
    token?: string;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOpts } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(fetchOpts.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOpts,
        headers,
        credentials: 'include',
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `API Error: ${res.status}`);
    }

    return res.json();
}

// --- Auth ---
export const authApi = {
    register: (data: { email: string; password: string; name: string; phone?: string }) =>
        fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: { email: string; password: string }) =>
        fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    refresh: () =>
        fetchApi('/api/auth/refresh', { method: 'POST' }),

    logout: (token: string) =>
        fetchApi('/api/auth/logout', { method: 'POST', token }),
};

// --- Medications ---
export const medicationsApi = {
    list: (token: string) =>
        fetchApi('/api/medications', { token }),

    get: (id: string, token: string) =>
        fetchApi(`/api/medications/${id}`, { token }),

    create: (data: any, token: string) =>
        fetchApi('/api/medications', { method: 'POST', body: JSON.stringify(data), token }),

    update: (id: string, data: any, token: string) =>
        fetchApi(`/api/medications/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),

    delete: (id: string, token: string, permanent = false) =>
        fetchApi(`/api/medications/${id}?permanent=${permanent}`, { method: 'DELETE', token }),
};

// --- Dose Logs ---
export const doseLogsApi = {
    list: (token: string, params?: Record<string, string>) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchApi(`/api/dose-logs${query}`, { token });
    },

    create: (data: any, token: string) =>
        fetchApi('/api/dose-logs', { method: 'POST', body: JSON.stringify(data), token }),

    update: (id: string, data: any, token: string) =>
        fetchApi(`/api/dose-logs/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
};

// --- Interactions ---
export const interactionsApi = {
    check: (medicationIds: string[], token: string) =>
        fetchApi('/api/interactions/check', { method: 'POST', body: JSON.stringify({ medicationIds }), token }),

    checkAll: (token: string) =>
        fetchApi('/api/interactions/check-all', { method: 'POST', token }),

    list: (token: string) =>
        fetchApi('/api/interactions', { token }),

    get: (id: string, token: string) =>
        fetchApi(`/api/interactions/${id}`, { token }),

    invalidateCache: (token: string) =>
        fetchApi('/api/interactions/invalidate-cache', { method: 'POST', token }),
};

// --- Drug Search ---
export const drugsApi = {
    search: (query: string) =>
        fetchApi(`/api/drugs/search?q=${encodeURIComponent(query)}`),

    lookupNdc: (code: string) =>
        fetchApi(`/api/drugs/ndc?code=${encodeURIComponent(code)}`),
};

// --- Caregivers ---
export const caregiversApi = {
    invite: (data: { emailOrPhone: string; permissions: string }, token: string) =>
        fetchApi('/api/caregivers/invite', { method: 'POST', body: JSON.stringify(data), token }),

    accept: (inviteToken: string, token: string) =>
        fetchApi('/api/caregivers/accept', { method: 'POST', body: JSON.stringify({ token: inviteToken }), token }),

    resend: (linkId: string, token: string) =>
        fetchApi(`/api/caregivers/${linkId}/resend`, { method: 'POST', token }),

    revoke: (linkId: string, token: string) =>
        fetchApi(`/api/caregivers/${linkId}`, { method: 'DELETE', token }),

    list: (token: string) =>
        fetchApi('/api/caregivers', { token }),

    getPatients: (token: string) =>
        fetchApi('/api/caregivers/patients', { token }),

    getPatientDashboard: (patientId: string, token: string) =>
        fetchApi(`/api/caregivers/patients/${patientId}/dashboard`, { token }),
};

// --- Profile ---
export const profileApi = {
    get: (token: string) =>
        fetchApi('/api/profile', { token }),

    update: (data: any, token: string) =>
        fetchApi('/api/profile', { method: 'PUT', body: JSON.stringify(data), token }),

    delete: (token: string) =>
        fetchApi('/api/profile', { method: 'DELETE', token }),
};

// --- Adherence ---
export const adherenceApi = {
    stats: (token: string) =>
        fetchApi('/api/adherence/stats', { token }),

    weekly: (token: string) =>
        fetchApi('/api/adherence/weekly', { token }),

    monthly: (year: number, month: number, token: string) =>
        fetchApi(`/api/adherence/monthly?year=${year}&month=${month}`, { token }),

    perMedication: (token: string) =>
        fetchApi('/api/adherence/per-medication', { token }),
};

// --- Export ---
export const exportApi = {
    pdf: (token: string, from?: string, to?: string) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return `${API_BASE}/api/export/pdf?${params.toString()}`;
    },

    csv: (token: string, from?: string, to?: string) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return `${API_BASE}/api/export/csv?${params.toString()}`;
    },

    doctorSummary: () =>
        `${API_BASE}/api/export/doctor-summary`,
};
