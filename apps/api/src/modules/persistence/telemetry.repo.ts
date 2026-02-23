import { Injectable } from '@nestjs/common';
import type { Prisma, TelemetryEvent } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class TelemetryRepo {
  constructor(private readonly prisma: PrismaService) {}

  appendEvents(batch: Prisma.TelemetryEventCreateManyInput[]): Promise<{ count: number }> {
    return this.prisma.telemetryEvent.createMany({ data: batch });
  }

  appendEvent(data: Prisma.TelemetryEventCreateInput): Promise<TelemetryEvent> {
    return this.prisma.telemetryEvent.create({ data });
  }
}
