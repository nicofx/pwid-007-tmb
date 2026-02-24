import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { getDeviceIdFromRequest } from '../common/device-id';
import { StartSessionDto } from './dto/start-session.dto';
import { SessionsService } from './services/sessions.service';

@Controller('sessions')
@ApiTags('sessions')
@ApiHeader({
  name: 'x-tmb-device-id',
  required: true,
  description: 'UUID del dispositivo local'
})
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Iniciar una sesión nueva' })
  async start(@Body() dto: StartSessionDto, @Req() req: Request) {
    return this.sessionsService.startSession(dto, getDeviceIdFromRequest(req));
  }

  @Get('presets/:capsuleId')
  @ApiOperation({ summary: 'Listar presets disponibles de una cápsula' })
  async getPresets(@Param('capsuleId') capsuleId: string) {
    return this.sessionsService.getCapsulePresets(capsuleId);
  }

  @Get('capsules/:capsuleId/overview')
  @ApiOperation({ summary: 'Resumen de escenas/beats/hotspots de la cápsula' })
  async getCapsuleOverview(@Param('capsuleId') capsuleId: string) {
    return this.sessionsService.getCapsuleOverview(capsuleId);
  }

  @Get(':id/resume')
  @ApiOperation({ summary: 'Reanudar sesión por id' })
  async resume(@Param('id') id: string, @Req() req: Request) {
    return this.sessionsService.resumeSession(id, getDeviceIdFromRequest(req));
  }
}
