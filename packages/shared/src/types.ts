// ============================================================
// MedMinder Shared Types
// Domain enums and interfaces used across web, mobile, and API
// ============================================================

// --- User ---
export type BiologicalSex = 'M' | 'F' | 'O' | 'U';

export interface User {
    id: string;
    email: string;
    phone?: string;
    name: string;
    dateOfBirth?: string;
    biologicalSex?: BiologicalSex;
    weightKg?: number;
    conditions: string[];
    allergies: string[];
    createdAt: string;
    updatedAt: string;
}

// --- Medication ---
export type MedicationType = 'prescription' | 'otc' | 'supplement' | 'herbal';
export type MedicationStatus = 'active' | 'prn' | 'discontinued';
export type FoodInstruction = 'with' | 'without' | 'no_preference';

export interface Medication {
    id: string;
    userId: string;
    name: string;
    dosage?: string;
    unit?: string;
    frequency: FrequencyConfig;
    medicationType: MedicationType;
    instructions?: string;
    withFood: FoodInstruction;
    startDate?: string;
    endDate?: string;
    quantityOnHand?: number;
    refillThreshold?: number;
    status: MedicationStatus;
    ndcCode?: string;
    pillColor?: string;
    pillShape?: string;
    prescribingDoctor?: string;
    pharmacy?: string;
    reason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FrequencyConfig {
    type: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'every_x_hours' | 'specific_days' | 'as_needed' | 'custom';
    timesOfDay?: string[];         // e.g. ["08:00", "20:00"]
    intervalHours?: number;        // for 'every_x_hours'
    daysOfWeek?: number[];         // 0=Sun, 1=Mon, ... 6=Sat
    customSchedule?: string;       // free-text for 'custom'
}

// --- Dose Log ---
export type DoseStatus = 'taken_on_time' | 'taken_late' | 'skipped' | 'snoozed' | 'pending';

export interface DoseLog {
    id: string;
    medicationId: string;
    userId: string;
    scheduledTime: string;
    actualTime?: string;
    status: DoseStatus;
    notes?: string;
    createdAt: string;
}

// --- Interactions ---
export type InteractionSeverity = 'critical' | 'major' | 'moderate' | 'mild' | 'none';

export interface Interaction {
    id: string;
    userId: string;
    medAId: string;
    medBId: string;
    medAName?: string;
    medBName?: string;
    severity: InteractionSeverity;
    description?: string;
    aiSummary?: string;
    mechanism?: string;
    symptoms?: string[];
    recommendations?: string[];
    source: string;
    cachedAt?: string;
    createdAt: string;
}

// --- Caregiver ---
export type CaregiverStatus = 'pending' | 'active' | 'revoked';
export type CaregiverPermission = 'read' | 'write';

export interface Caregiver {
    id: string;
    patientId: string;
    caregiverId: string;
    status: CaregiverStatus;
    permissions: CaregiverPermission;
    invitedAt: string;
    acceptedAt?: string;
}

// --- Notification Preferences ---
export type NotificationChannel = 'push' | 'sms' | 'email';

export interface NotificationPreferences {
    channels: NotificationChannel[];
    quietHoursStart?: string; // "22:00"
    quietHoursEnd?: string;   // "07:00"
    snoozeDurationMinutes: number;
}

// --- Dashboard ---
export interface AdherenceStats {
    overallScore: number;          // 0-100
    weeklyData: DailyAdherence[];
    monthlyHeatmap: MonthlyDay[];
    currentStreak: number;
    perMedication: MedicationAdherence[];
}

export interface DailyAdherence {
    date: string;
    percentage: number;
    taken: number;
    total: number;
}

export interface MonthlyDay {
    date: string;
    status: 'full' | 'partial' | 'missed' | 'none';
}

export interface MedicationAdherence {
    medicationId: string;
    medicationName: string;
    adherencePercent: number;
}

// --- API Response Wrappers ---
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: PaginationMeta;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
