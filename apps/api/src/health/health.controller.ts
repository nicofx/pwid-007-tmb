import { Controller, Get } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import { PrismaService } from '../db/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth(): { status: 'ok'; service: 'tmb-api'; dbConnected: boolean } {
    const _contractAnchor: TurnPacket | null = null;
    void _contractAnchor;

    return {
      status: 'ok',
      service: 'tmb-api',
      dbConnected: this.prisma.getStatus().dbConnected
    };
  }
}
