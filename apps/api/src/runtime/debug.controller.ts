import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DebugService } from './services/debug.service';

@Controller('debug')
@ApiTags('debug')
@ApiHeader({
  name: 'x-tmb-device-id',
  required: true,
  description: 'UUID del dispositivo local'
})
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  @Get('sessions/:id/trace')
  @ApiOperation({ summary: 'Traza debug de una sesión' })
  async getTrace(@Param('id') sessionId: string, @Query('last') last?: string) {
    const parsed = Number(last ?? 20);
    const safeLast = Number.isFinite(parsed) ? Math.max(1, Math.min(100, parsed)) : 20;
    return this.debugService.getSessionTrace(sessionId, safeLast);
  }
}
