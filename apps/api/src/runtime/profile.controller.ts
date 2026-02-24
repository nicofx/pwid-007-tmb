import { Body, Controller, Delete, Get, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { getDeviceIdFromRequest } from '../common/device-id';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './services/profile.service';
import { HistoryService } from './services/history.service';

@Controller('profile')
@ApiTags('profile')
@ApiHeader({
  name: 'x-tmb-device-id',
  required: true,
  description: 'UUID del dispositivo local'
})
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly historyService: HistoryService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get-or-create profile por deviceId' })
  async getProfile(@Req() req: Request) {
    const deviceId = getDeviceIdFromRequest(req);
    return this.profileService.getOrCreate(deviceId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar displayName del profile actual' })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const deviceId = getDeviceIdFromRequest(req);
    return this.profileService.updateDisplayName({ deviceId, displayName: dto.displayName });
  }

  // Backward compatibility for clients still calling POST.
  @Post()
  @ApiOperation({ summary: 'Compat legacy: actualizar profile por POST' })
  async updateProfileLegacy(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const deviceId = getDeviceIdFromRequest(req);
    return this.profileService.updateDisplayName({ deviceId, displayName: dto.displayName });
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Listar sesiones del profile actual' })
  async listSessions(@Req() req: Request, @Query('limit') limitRaw?: string) {
    const deviceId = getDeviceIdFromRequest(req);
    const parsedLimit = Number(limitRaw ?? 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 10;
    return {
      sessions: await this.profileService.listSessions({ deviceId, limit }),
      limit: Math.min(Math.max(limit, 1), 50)
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar profile + sesiones + turns a JSON' })
  async exportProfile(
    @Req() req: Request,
    @Query('includeTelemetry') includeTelemetryRaw?: string,
    @Query('turnLimitPerSession') turnLimitPerSessionRaw?: string
  ) {
    const deviceId = getDeviceIdFromRequest(req);
    const turnLimitPerSession = Number(turnLimitPerSessionRaw ?? 200);
    return this.historyService.exportProfile({
      deviceId,
      includeTelemetry: includeTelemetryRaw === '1' || includeTelemetryRaw === 'true',
      turnLimitPerSession: Number.isFinite(turnLimitPerSession) ? turnLimitPerSession : 200
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Wipe completo del profile actual' })
  async wipeProfile(@Req() req: Request) {
    const deviceId = getDeviceIdFromRequest(req);
    return this.historyService.wipeProfile(deviceId);
  }
}
