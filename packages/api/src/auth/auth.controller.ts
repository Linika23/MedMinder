// ============================================================
// Auth Controller — Registration, Login, Refresh, Logout
// ============================================================

import {
    Controller,
    Post,
    Body,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { registerSchema, loginSchema } from '@medminder/shared';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
        const validated = registerSchema.parse(body);
        const result = await this.authService.register(
            validated.email,
            validated.password,
            validated.name,
            validated.phone,
        );

        this.setRefreshTokenCookie(res, result.refreshToken);
        return {
            success: true,
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
        const validated = loginSchema.parse(body);
        const result = await this.authService.login(validated.email, validated.password);

        this.setRefreshTokenCookie(res, result.refreshToken);
        return {
            success: true,
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return { success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token' } };
        }

        const tokens = await this.authService.refreshAccessToken(refreshToken);
        this.setRefreshTokenCookie(res, tokens.refreshToken);
        return {
            success: true,
            data: { accessToken: tokens.accessToken },
        };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await this.authService.logout(refreshToken);
        }

        res.clearCookie('refreshToken');
        return { success: true };
    }

    private setRefreshTokenCookie(res: Response, token: string) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/api/auth',
        });
    }
}
