import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { TurnPacket } from '@tmb/contracts';
import { PrismaService } from '../db/prisma.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check básico' })
  getHealth(): { status: 'ok'; service: 'tmb-api'; dbConnected: boolean } {
    const _contractAnchor: TurnPacket | null = null;
    void _contractAnchor;

    return {
      status: 'ok',
      service: 'tmb-api',
      dbConnected: this.prisma.getStatus().dbConnected
    };
  }

  @Get('/ready')
  @ApiOperation({ summary: 'Readiness check' })
  getReady(): { status: 'ready' | 'not_ready'; service: 'tmb-api'; dbConnected: boolean } {
    const dbConnected = this.prisma.getStatus().dbConnected;
    return {
      status: dbConnected ? 'ready' : 'not_ready',
      service: 'tmb-api',
      dbConnected
    };
  }
}
