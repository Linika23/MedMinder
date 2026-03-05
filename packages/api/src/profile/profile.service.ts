import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileUpdateInput } from '@medminder/shared';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException();
        const { passwordHash, twoFactorSecret, ...profile } = user;
        return profile;
    }

    async updateProfile(userId: string, data: ProfileUpdateInput) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            },
            select: {
                id: true, email: true, name: true, phone: true, dateOfBirth: true,
                biologicalSex: true, weightKg: true, conditions: true, allergies: true,
                theme: true, fontSize: true, physicianName: true, physicianPhone: true,
                pharmacyName: true, pharmacyPhone: true, createdAt: true, updatedAt: true,
            },
        });
    }

    async deleteAccount(userId: string) {
        await this.prisma.user.delete({ where: { id: userId } });
    }
}
