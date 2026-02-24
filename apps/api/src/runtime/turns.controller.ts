import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { Response } from 'express';
import { getDeviceIdFromRequest } from '../common/device-id';
import { TurnDto } from './dto/turn.dto';
import { TurnsService } from './services/turns.service';

@Controller('turns')
@ApiTags('turns')
@ApiHeader({
  name: 'x-tmb-device-id',
  required: true,
  description: 'UUID del dispositivo local'
})
export class TurnsController {
  constructor(private readonly turnsService: TurnsService) {}

  @Post()
  @ApiOperation({ summary: 'Procesar turno' })
  async processTurn(
    @Body() dto: TurnDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.turnsService.processTurn(dto, getDeviceIdFromRequest(req));
    res.setHeader('x-tmb-narrative-provider', result.narrativeProvider);
    return result;
  }
}
