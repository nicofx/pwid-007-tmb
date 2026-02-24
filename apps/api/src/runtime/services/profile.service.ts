import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProfileRepo } from '../../modules/persistence/profile.repo';
import { TelemetryRepo } from '../../modules/persistence/telemetry.repo';

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepo: ProfileRepo,
    private readonly telemetryRepo: TelemetryRepo
  ) {}

  async getOrCreate(deviceId: string): Promise<{
    id: string;
    deviceId: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const existing = await this.profileRepo.getByDeviceId(deviceId);
    if (existing) {
      return {
        id: existing.id,
        deviceId: existing.deviceId,
        displayName: existing.displayName,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString()
      };
    }

    const created = await this.profileRepo.create({
      deviceId,
      displayName: 'Player'
    });

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      profileId: created.id,
      eventName: 'profile_created',
      payloadJson: asJson({ deviceId: created.deviceId })
    });

    return {
      id: created.id,
      deviceId: created.deviceId,
      displayName: created.displayName,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    };
  }

  async updateDisplayName(params: { deviceId: string; displayName: string }): Promise<{
    id: string;
    deviceId: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const profile = await this.getOrCreate(params.deviceId);
    const updated = await this.profileRepo.updateDisplayName(profile.id, params.displayName.trim());

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      profileId: updated.id,
      eventName: 'profile_updated',
      payloadJson: asJson({ displayName: updated.displayName })
    });

    return {
      id: updated.id,
      deviceId: updated.deviceId,
      displayName: updated.displayName,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  }

  async listSessions(params: { deviceId: string; limit: number }): Promise<
    Array<{
      sessionId: string;
      capsuleId: string;
      presetId?: string;
      seed: string;
      status: 'ACTIVE' | 'ENDED';
      lastTurnSeq: number;
      updatedAt: string;
      createdAt: string;
    }>
  > {
    const profile = await this.getOrCreate(params.deviceId);
    const rows = await this.profileRepo.listSessions({
      profileId: profile.id,
      limit: Math.min(Math.max(params.limit, 1), 50)
    });

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      profileId: profile.id,
      eventName: 'profile_sessions_listed',
      payloadJson: asJson({ count: rows.length, limit: params.limit })
    });

    return rows.map((row) => ({
      sessionId: row.id,
      capsuleId: row.capsuleId,
      presetId: row.presetId ?? undefined,
      seed: row.seed,
      status: row.status,
      lastTurnSeq: row.lastTurnSeq,
      updatedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString()
    }));
  }
}
