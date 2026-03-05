// ============================================================
// Auth Service — Registration, Login, Token Management
// ============================================================

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_COST_FACTOR, REFRESH_TOKEN_EXPIRY_DAYS } from '@medminder/shared';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    async register(email: string, password: string, name: string, phone?: string) {
        // Check if user already exists
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictException('An account with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                phone,
            },
        });

        const tokens = await this.generateTokens(user.id, user.email);
        return { user: this.sanitizeUser(user), ...tokens };
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const tokens = await this.generateTokens(user.id, user.email);
        return { user: this.sanitizeUser(user), ...tokens };
    }

    async refreshAccessToken(refreshToken: string) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!stored || stored.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Rotate refresh token
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        const tokens = await this.generateTokens(stored.user.id, stored.user.email);
        return tokens;
    }

    async logout(refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return this.sanitizeUser(user);
    }

    private async generateTokens(userId: string, email: string) {
        const accessToken = this.jwt.sign({ sub: userId, email });

        const refreshToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: refreshToken,
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }

    private sanitizeUser(user: any) {
        const { passwordHash, twoFactorSecret, ...sanitized } = user;
        return sanitized;
    }
}
