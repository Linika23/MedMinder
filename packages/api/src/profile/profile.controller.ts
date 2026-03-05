import { Controller, Get, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { profileUpdateSchema } from '@medminder/shared';

@Controller('api/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    async getProfile(@CurrentUser('id') userId: string) {
        const profile = await this.profileService.getProfile(userId);
        return { success: true, data: profile };
    }

    @Put()
    async updateProfile(@CurrentUser('id') userId: string, @Body() body: unknown) {
        const validated = profileUpdateSchema.parse(body);
        const profile = await this.profileService.updateProfile(userId, validated);
        return { success: true, data: profile };
    }

    @Delete()
    async deleteAccount(@CurrentUser('id') userId: string) {
        await this.profileService.deleteAccount(userId);
        return { success: true };
    }
}
