// ============================================================
// MedMinder Zod Validation Schemas
// Request validation used on both client and server
// ============================================================

import { z } from 'zod';

// --- Auth ---
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    name: z.string().min(1, 'Name is required').max(100),
    phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// --- Profile ---
export const profileUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
    biologicalSex: z.enum(['M', 'F', 'O', 'U']).optional(),
    weightKg: z.number().positive().max(500).optional(),
    conditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
});

// --- Medication ---
export const frequencySchema = z.object({
    type: z.enum([
        'once_daily',
        'twice_daily',
        'three_times_daily',
        'every_x_hours',
        'specific_days',
        'as_needed',
        'custom',
    ]),
    timesOfDay: z.array(z.string()).optional(),
    intervalHours: z.number().positive().optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    customSchedule: z.string().optional(),
});

export const createMedicationSchema = z.object({
    name: z.string().min(1, 'Medication name is required').max(255),
    dosage: z.string().max(100).optional(),
    unit: z.string().max(20).optional(),
    frequency: frequencySchema,
    medicationType: z.enum(['prescription', 'otc', 'supplement', 'herbal']),
    instructions: z.string().optional(),
    withFood: z.enum(['with', 'without', 'no_preference']).default('no_preference'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    quantityOnHand: z.number().int().nonnegative().optional(),
    refillThreshold: z.number().int().nonnegative().optional(),
    ndcCode: z.string().max(20).optional(),
    pillColor: z.string().optional(),
    pillShape: z.string().optional(),
    prescribingDoctor: z.string().optional(),
    pharmacy: z.string().optional(),
    reason: z.string().optional(),
});

export const updateMedicationSchema = createMedicationSchema.partial().extend({
    status: z.enum(['active', 'prn', 'discontinued']).optional(),
});

// --- Dose Log ---
export const createDoseLogSchema = z.object({
    medicationId: z.string().uuid(),
    scheduledTime: z.string(),
    actualTime: z.string().optional(),
    status: z.enum(['taken_on_time', 'taken_late', 'skipped', 'snoozed', 'pending']),
    notes: z.string().max(500).optional(),
});

export const updateDoseLogSchema = z.object({
    actualTime: z.string().optional(),
    status: z.enum(['taken_on_time', 'taken_late', 'skipped', 'snoozed', 'pending']).optional(),
    notes: z.string().max(500).optional(),
});

// --- Interaction Check ---
export const checkInteractionsSchema = z.object({
    medicationIds: z.array(z.string().uuid()).min(2, 'Need at least 2 medications to check'),
});

// --- Caregiver ---
export const inviteCaregiverSchema = z.object({
    emailOrPhone: z.string().min(1, 'Email or phone number is required'),
    permissions: z.enum(['read', 'write']).default('read'),
});

export const updateCaregiverSchema = z.object({
    permissions: z.enum(['read', 'write']).optional(),
    status: z.enum(['active', 'revoked']).optional(),
});

// --- Notification Preferences ---
export const notificationPreferencesSchema = z.object({
    channels: z.array(z.enum(['push', 'sms', 'email'])),
    quietHoursStart: z.string().optional(),
    quietHoursEnd: z.string().optional(),
    snoozeDurationMinutes: z.number().int().min(5).max(60).default(15),
});

// --- Query / Pagination ---
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const doseLogQuerySchema = paginationSchema.extend({
    medicationId: z.string().uuid().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.enum(['taken_on_time', 'taken_late', 'skipped', 'snoozed', 'pending']).optional(),
});

// --- Inferred Types ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type CreateDoseLogInput = z.infer<typeof createDoseLogSchema>;
export type UpdateDoseLogInput = z.infer<typeof updateDoseLogSchema>;
export type CheckInteractionsInput = z.infer<typeof checkInteractionsSchema>;
export type InviteCaregiverInput = z.infer<typeof inviteCaregiverSchema>;
export type UpdateCaregiverInput = z.infer<typeof updateCaregiverSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type DoseLogQueryInput = z.infer<typeof doseLogQuerySchema>;
