import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';
import { ApiError } from '../../common/api-error';
import { ProfileService } from './profile.service';
import { TelemetryRepo } from '../../modules/persistence/telemetry.repo';

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
    private readonly telemetryRepo: TelemetryRepo
  ) {}

  private async resolveProfile(deviceId: string): Promise<{ id: string; deviceId: string }> {
    const profile = await this.profileService.getOrCreate(deviceId);
    return { id: profile.id, deviceId: profile.deviceId };
  }

  private async assertSessionOwned(sessionId: string, profileId: string): Promise<{
    id: string;
    capsuleId: string;
    presetId: string | null;
    seed: string;
    lastTurnSeq: number;
    status: 'ACTIVE' | 'ENDED';
  }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        profileId: true,
        capsuleId: true,
        presetId: true,
        seed: true,
        lastTurnSeq: true,
        status: true
      }
    });

    if (!session) {
      throw ApiError.sessionNotFound(sessionId);
    }

    if (session.profileId !== profileId) {
      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        profileId,
        sessionId,
        eventName: 'security_violation_attempt',
        payloadJson: asJson({ reason: 'SESSION_NOT_OWNED' })
      });
      // Keep response opaque.
      throw ApiError.sessionNotFound(sessionId);
    }

    return session;
  }

  async getSessionTurns(params: {
    deviceId: string;
    sessionId: string;
    limit?: number;
    fromSeq?: number;
    includePacket?: boolean;
  }): Promise<{
    sessionMeta: {
      sessionId: string;
      capsuleId: string;
      presetId?: string;
      seed: string;
      lastTurnSeq: number;
      status: 'ACTIVE' | 'ENDED';
    };
    turns: Array<{
      seq: number;
      turnId: string;
      action: unknown;
      outcome: unknown;
      deltas: unknown;
      createdAt: string;
      packet?: unknown;
      narrativeProvider?: string;
      worldEvent?: unknown;
    }>;
    limit: number;
    fromSeq: number;
  }> {
    const profile = await this.resolveProfile(params.deviceId);
    const session = await this.assertSessionOwned(params.sessionId, profile.id);
    const limit = Math.min(Math.max(params.limit ?? 200, 1), 200);
    const fromSeq = Math.max(params.fromSeq ?? 0, 0);
    const includePacket = Boolean(params.includePacket);

    const turns = await this.prisma.turn.findMany({
      where: { sessionId: params.sessionId, seq: { gte: fromSeq } },
      orderBy: { seq: 'asc' },
      take: limit
    });

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      deviceId: params.deviceId,
      profileId: profile.id,
      sessionId: params.sessionId,
      eventName: 'history_turns_listed',
      payloadJson: asJson({ count: turns.length, limit, fromSeq, includePacket })
    });

    return {
      sessionMeta: {
        sessionId: session.id,
        capsuleId: session.capsuleId,
        presetId: session.presetId ?? undefined,
        seed: session.seed,
        lastTurnSeq: session.lastTurnSeq,
        status: session.status
      },
      turns: turns.map((turn) => {
        const request = turn.requestJson as { action?: unknown };
        const outcomeJson = turn.outcomeJson as { outcome?: unknown; narrativeProvider?: string };
        const packetJson = turn.packetJson as { worldEvent?: unknown } | null;
        return {
          seq: turn.seq,
          turnId: turn.turnId,
          action: request?.action ?? null,
          outcome: outcomeJson?.outcome ?? outcomeJson ?? null,
          deltas: turn.deltasJson,
          createdAt: turn.createdAt.toISOString(),
          packet: includePacket ? turn.packetJson : undefined,
          narrativeProvider: outcomeJson?.narrativeProvider,
          worldEvent: packetJson?.worldEvent
        };
      }),
      limit,
      fromSeq
    };
  }

  async deleteRun(params: { deviceId: string; sessionId: string }): Promise<{ ok: true }> {
    const profile = await this.resolveProfile(params.deviceId);
    await this.assertSessionOwned(params.sessionId, profile.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.turn.deleteMany({ where: { sessionId: params.sessionId } });
      await tx.snapshot.deleteMany({ where: { sessionId: params.sessionId } });
      await tx.telemetryEvent.deleteMany({ where: { sessionId: params.sessionId } });
      await tx.session.delete({ where: { id: params.sessionId } });
    });

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      deviceId: params.deviceId,
      profileId: profile.id,
      sessionId: params.sessionId,
      eventName: 'run_deleted',
      payloadJson: asJson({ sessionId: params.sessionId })
    });

    return { ok: true };
  }

  async wipeProfile(deviceId: string): Promise<{ ok: true }> {
    const profile = await this.resolveProfile(deviceId);
    const sessions = await this.prisma.session.findMany({
      where: { profileId: profile.id },
      select: { id: true }
    });
    const sessionIds = sessions.map((row) => row.id);

    await this.prisma.$transaction(async (tx) => {
      if (sessionIds.length > 0) {
        await tx.turn.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.snapshot.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.telemetryEvent.deleteMany({ where: { sessionId: { in: sessionIds } } });
      }
      await tx.session.deleteMany({ where: { profileId: profile.id } });
      await tx.telemetryEvent.deleteMany({ where: { profileId: profile.id } });
      await tx.profile.delete({ where: { id: profile.id } });
    });

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      deviceId,
      eventName: 'profile_wiped',
      payloadJson: asJson({ profileId: profile.id, sessionsDeleted: sessionIds.length })
    });

    return { ok: true };
  }

  async exportProfile(params: {
    deviceId: string;
    includeTelemetry?: boolean;
    turnLimitPerSession?: number;
  }): Promise<{
    exportedAt: string;
    profile: unknown;
    sessions: unknown[];
    turnsBySession: Record<string, unknown[]>;
    snapshotsBySession: Record<string, unknown | null>;
    telemetry?: unknown[];
  }> {
    const profile = await this.resolveProfile(params.deviceId);
    const includeTelemetry = Boolean(params.includeTelemetry);
    const turnLimitPerSession = Math.min(Math.max(params.turnLimitPerSession ?? 200, 1), 500);

    const sessions = await this.prisma.session.findMany({
      where: { profileId: profile.id },
      orderBy: { updatedAt: 'desc' }
    });

    const turnsBySession: Record<string, unknown[]> = {};
    const snapshotsBySession: Record<string, unknown | null> = {};

    for (const session of sessions) {
      const turns = await this.prisma.turn.findMany({
        where: { sessionId: session.id },
        orderBy: { seq: 'asc' },
        take: turnLimitPerSession
      });
      turnsBySession[session.id] = turns.map((turn) => ({
        seq: turn.seq,
        turnId: turn.turnId,
        createdAt: turn.createdAt.toISOString(),
        requestJson: turn.requestJson,
        outcomeJson: turn.outcomeJson,
        deltasJson: turn.deltasJson,
        packetJson: turn.packetJson
      }));

      const latestSnapshot = await this.prisma.snapshot.findFirst({
        where: { sessionId: session.id },
        orderBy: { seq: 'desc' }
      });
      snapshotsBySession[session.id] = latestSnapshot
        ? {
            seq: latestSnapshot.seq,
            createdAt: latestSnapshot.createdAt.toISOString(),
            stateJson: latestSnapshot.stateJson
          }
        : null;
    }

    const telemetry = includeTelemetry
      ? await this.prisma.telemetryEvent.findMany({
          where: { OR: [{ profileId: profile.id }, { deviceId: params.deviceId }] },
          orderBy: { ts: 'asc' },
          take: 5000
        })
      : undefined;

    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      sessions: sessions.map((session) => ({
        id: session.id,
        capsuleId: session.capsuleId,
        presetId: session.presetId,
        seed: session.seed,
        status: session.status,
        lastTurnSeq: session.lastTurnSeq,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      })),
      turnsBySession,
      snapshotsBySession,
      telemetry:
        telemetry?.map((event) => ({
          id: event.id,
          ts: event.ts.toISOString(),
          source: event.source,
          deviceId: event.deviceId,
          profileId: event.profileId,
          sessionId: event.sessionId,
          turnId: event.turnId,
          eventName: event.eventName,
          payloadJson: event.payloadJson
        })) ?? undefined
    };

    const sizeBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      deviceId: params.deviceId,
      profileId: profile.id,
      eventName: 'profile_exported',
      payloadJson: asJson({
        includeTelemetry,
        sessions: sessions.length,
        turnLimitPerSession,
        sizeBytes
      })
    });

    return payload;
  }
}

