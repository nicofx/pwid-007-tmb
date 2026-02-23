import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../common/api-error';
import { SessionRepo } from '../../modules/persistence/session.repo';
import { TelemetryRepo } from '../../modules/persistence/telemetry.repo';
import { TurnRepo } from '../../modules/persistence/turn.repo';

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

@Injectable()
export class DebugService {
  constructor(
    private readonly sessionRepo: SessionRepo,
    private readonly turnRepo: TurnRepo,
    private readonly telemetryRepo: TelemetryRepo
  ) {}

  async getSessionTrace(
    sessionId: string,
    last: number
  ): Promise<{
    sessionId: string;
    last: number;
    turns: Array<{
      seq: number;
      turnId: string;
      request: unknown;
      outcome: unknown;
      deltas: unknown;
      packet: unknown;
      wed?: unknown;
      createdAt: string;
    }>;
  }> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw ApiError.sessionNotFound(sessionId);
    }

    const turns = await this.turnRepo.getRecentTurns(sessionId, last);
    const ordered = [...turns].sort((a, b) => a.seq - b.seq);

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      sessionId,
      eventName: 'debug_trace_requested',
      payloadJson: asJson({ last, returned: ordered.length })
    });

    return {
      sessionId,
      last,
      turns: ordered.map((turn) => ({
        seq: turn.seq,
        turnId: turn.turnId,
        request: turn.requestJson,
        outcome: turn.outcomeJson,
        deltas: turn.deltasJson,
        packet: turn.packetJson,
        wed: (turn.packetJson as { worldEvent?: unknown }).worldEvent,
        createdAt: turn.createdAt.toISOString()
      }))
    };
  }
}
