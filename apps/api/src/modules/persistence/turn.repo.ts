import { Injectable } from '@nestjs/common';
import type { Prisma, Turn } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class TurnRepo {
  constructor(private readonly prisma: PrismaService) {}

  getByTurnId(sessionId: string, turnId: string): Promise<Turn | null> {
    return this.prisma.turn.findUnique({
      where: {
        sessionId_turnId: {
          sessionId,
          turnId
        }
      }
    });
  }

  appendTurn(data: Prisma.TurnCreateInput): Promise<Turn> {
    return this.prisma.turn.create({ data });
  }

  getLastTurn(sessionId: string): Promise<Turn | null> {
    return this.prisma.turn.findFirst({
      where: { sessionId },
      orderBy: { seq: 'desc' }
    });
  }

  getRecentTurns(sessionId: string, last: number): Promise<Turn[]> {
    return this.prisma.turn.findMany({
      where: { sessionId },
      orderBy: { seq: 'desc' },
      take: last
    });
  }
}
