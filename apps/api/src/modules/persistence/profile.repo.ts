import { Injectable } from '@nestjs/common';
import type { Prisma, Profile } from '@prisma/client';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class ProfileRepo {
  constructor(private readonly prisma: PrismaService) {}

  getByDeviceId(deviceId: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { deviceId } });
  }

  getById(id: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({ where: { id } });
  }

  upsertByDeviceId(params: { deviceId: string; displayName: string }): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { deviceId: params.deviceId },
      create: { deviceId: params.deviceId, displayName: params.displayName },
      update: { displayName: params.displayName }
    });
  }

  updateDisplayName(id: string, displayName: string): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id },
      data: { displayName }
    });
  }

  listSessions(params: { profileId: string; limit: number }): Promise<
    Array<{
      id: string;
      capsuleId: string;
      presetId: string | null;
      seed: string;
      status: import('@prisma/client').SessionStatus;
      lastTurnSeq: number;
      updatedAt: Date;
      createdAt: Date;
    }>
  > {
    return this.prisma.session.findMany({
      where: { profileId: params.profileId },
      orderBy: { updatedAt: 'desc' },
      take: params.limit,
      select: {
        id: true,
        capsuleId: true,
        presetId: true,
        seed: true,
        status: true,
        lastTurnSeq: true,
        updatedAt: true,
        createdAt: true
      }
    });
  }

  create(data: Prisma.ProfileCreateInput): Promise<Profile> {
    return this.prisma.profile.create({ data });
  }
}

