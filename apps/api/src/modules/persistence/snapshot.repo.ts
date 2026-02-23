import { Injectable } from '@nestjs/common';
import type { Prisma, Snapshot } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class SnapshotRepo {
  constructor(private readonly prisma: PrismaService) {}

  createSnapshot(data: Prisma.SnapshotCreateInput): Promise<Snapshot> {
    return this.prisma.snapshot.create({ data });
  }

  getLatestSnapshot(sessionId: string): Promise<Snapshot | null> {
    return this.prisma.snapshot.findFirst({
      where: { sessionId },
      orderBy: { seq: 'desc' }
    });
  }
}
