import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StartSessionDto } from './dto/start-session.dto';
import { SessionsService } from './services/sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start')
  async start(@Body() dto: StartSessionDto) {
    return this.sessionsService.startSession(dto);
  }

  @Get('presets/:capsuleId')
  async getPresets(@Param('capsuleId') capsuleId: string) {
    return this.sessionsService.getCapsulePresets(capsuleId);
  }

  @Get(':id/resume')
  async resume(@Param('id') id: string) {
    return this.sessionsService.resumeSession(id);
  }
}
