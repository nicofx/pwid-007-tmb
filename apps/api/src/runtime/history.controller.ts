import { Controller, Delete, Get, Param, Query, Req } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { getDeviceIdFromRequest } from '../common/device-id';
import { HistoryService } from './services/history.service';

@Controller()
@ApiTags('history')
@ApiHeader({
  name: 'x-tmb-device-id',
  required: true,
  description: 'UUID del dispositivo local'
})
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('sessions/:id/turns')
  @ApiOperation({ summary: 'Listar timeline de turns de una sesión' })
  async getSessionTurns(
    @Param('id') sessionId: string,
    @Req() req: Request,
    @Query('limit') limitRaw?: string,
    @Query('fromSeq') fromSeqRaw?: string,
    @Query('includePacket') includePacketRaw?: string
  ) {
    const deviceId = getDeviceIdFromRequest(req);
    const limit = Number(limitRaw ?? 200);
    const fromSeq = Number(fromSeqRaw ?? 0);
    const includePacket = includePacketRaw === '1' || includePacketRaw === 'true';
    return this.historyService.getSessionTurns({
      deviceId,
      sessionId,
      limit: Number.isFinite(limit) ? limit : 200,
      fromSeq: Number.isFinite(fromSeq) ? fromSeq : 0,
      includePacket
    });
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Borrar una run (hard delete)' })
  async deleteSession(@Param('id') sessionId: string, @Req() req: Request) {
    const deviceId = getDeviceIdFromRequest(req);
    return this.historyService.deleteRun({ deviceId, sessionId });
  }
}
