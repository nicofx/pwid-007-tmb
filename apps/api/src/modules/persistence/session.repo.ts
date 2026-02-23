import { Injectable } from '@nestjs/common';
import type { Prisma, Session } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class SessionRepo {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  getById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  updateStateOptimistic(params: {
    id: string;
    rev: number;
    nextRev: number;
    currentStateJson: Prisma.InputJsonValue;
    lastPacketJson: Prisma.InputJsonValue;
    lastTurnSeq: number;
    status?: 'ACTIVE' | 'ENDED';
  }): Promise<number> {
    return this.prisma.session
      .updateMany({
        where: { id: params.id, rev: params.rev },
        data: {
          rev: params.nextRev,
          currentStateJson: params.currentStateJson,
          lastPacketJson: params.lastPacketJson,
          lastTurnSeq: params.lastTurnSeq,
          status: params.status
        }
      })
      .then((result) => result.count);
  }

  markEnded(id: string): Promise<Session> {
    return this.prisma.session.update({
      where: { id },
      data: { status: 'ENDED' }
    });
  }
}
