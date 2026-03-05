// ============================================================
// Prisma Seed Script — Test Data
// ============================================================

import { PrismaClient, BiologicalSex, MedicationType, MedicationStatus, FoodInstruction, DoseStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create test user
    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    const user = await prisma.user.upsert({
        where: { email: 'margaret@example.com' },
        update: {},
        create: {
            email: 'margaret@example.com',
            passwordHash,
            name: 'Margaret Johnson',
            phone: '+15551234567',
            dateOfBirth: new Date('1954-03-15'),
            biologicalSex: BiologicalSex.F,
            weightKg: 68.0,
            conditions: ['Hypertension', 'Type 2 Diabetes'],
            allergies: ['Penicillin'],
            emailVerified: true,
            physicianName: 'Dr. Sarah Chen',
            physicianPhone: '+15559876543',
            pharmacyName: 'CVS Pharmacy',
            pharmacyPhone: '+15551112222',
        },
    });

    console.log(`✅ Created user: ${user.name} (${user.email})`);

    // Create medications
    const lisinopril = await prisma.medication.create({
        data: {
            userId: user.id,
            name: 'Lisinopril',
            dosage: '10',
            unit: 'mg',
            frequency: { type: 'once_daily', timesOfDay: ['08:00'] },
            medicationType: MedicationType.prescription,
            withFood: FoodInstruction.no_preference,
            instructions: 'Take in the morning',
            status: MedicationStatus.active,
            quantityOnHand: 25,
            refillThreshold: 7,
            prescribingDoctor: 'Dr. Sarah Chen',
            reason: 'Hypertension',
        },
    });

    const metformin = await prisma.medication.create({
        data: {
            userId: user.id,
            name: 'Metformin',
            dosage: '500',
            unit: 'mg',
            frequency: { type: 'twice_daily', timesOfDay: ['08:00', '20:00'] },
            medicationType: MedicationType.prescription,
            withFood: FoodInstruction.with,
            instructions: 'Take with meals',
            status: MedicationStatus.active,
            quantityOnHand: 50,
            refillThreshold: 10,
            prescribingDoctor: 'Dr. Sarah Chen',
            reason: 'Type 2 Diabetes',
        },
    });

    const vitaminD = await prisma.medication.create({
        data: {
            userId: user.id,
            name: 'Vitamin D3',
            dosage: '2000',
            unit: 'IU',
            frequency: { type: 'once_daily', timesOfDay: ['08:00'] },
            medicationType: MedicationType.supplement,
            withFood: FoodInstruction.with,
            status: MedicationStatus.active,
            quantityOnHand: 60,
            refillThreshold: 14,
        },
    });

    console.log(`✅ Created ${3} medications`);

    // Create sample dose logs for past 7 days
    const now = new Date();
    let logCount = 0;
    for (let day = 6; day >= 0; day--) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);

        // Lisinopril 8am
        const lisinoprilTime = new Date(date);
        lisinoprilTime.setHours(8, 0, 0, 0);
        await prisma.doseLog.create({
            data: {
                userId: user.id,
                medicationId: lisinopril.id,
                scheduledTime: lisinoprilTime,
                actualTime: day === 2 ? undefined : new Date(lisinoprilTime.getTime() + Math.random() * 1800000),
                status: day === 2 ? DoseStatus.skipped : DoseStatus.taken_on_time,
                notes: day === 2 ? 'Forgot — was out of the house' : undefined,
            },
        });
        logCount++;

        // Metformin 8am + 8pm
        for (const hour of [8, 20]) {
            const metTime = new Date(date);
            metTime.setHours(hour, 0, 0, 0);
            await prisma.doseLog.create({
                data: {
                    userId: user.id,
                    medicationId: metformin.id,
                    scheduledTime: metTime,
                    actualTime: new Date(metTime.getTime() + Math.random() * 3600000),
                    status: hour === 20 && day === 4 ? DoseStatus.taken_late : DoseStatus.taken_on_time,
                },
            });
            logCount++;
        }
    }

    console.log(`✅ Created ${logCount} dose logs`);

    // Create a caregiver user
    const caregiverHash = await bcrypt.hash('TestPass123!', 12);
    const caregiver = await prisma.user.upsert({
        where: { email: 'priya@example.com' },
        update: {},
        create: {
            email: 'priya@example.com',
            passwordHash: caregiverHash,
            name: 'Priya Sharma',
            phone: '+15559998888',
            emailVerified: true,
        },
    });

    await prisma.caregiverLink.create({
        data: {
            patientId: user.id,
            caregiverId: caregiver.id,
            status: 'active',
            permissions: 'read',
        },
    });

    console.log(`✅ Created caregiver: ${caregiver.name}`);
    console.log('🎉 Seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
