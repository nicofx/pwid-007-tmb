import { Injectable } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../db/prisma.service';
import { ApiError } from '../../common/api-error';
import { SessionRepo } from '../../modules/persistence/session.repo';
import { SnapshotRepo } from '../../modules/persistence/snapshot.repo';
import { TelemetryRepo } from '../../modules/persistence/telemetry.repo';
import {
  jsonToSessionState,
  jsonToTurnPacket,
  sessionStateToJson
} from '../../modules/persistence/state.mapper';
import { FileCapsuleProvider } from '../adapters/file-capsule.provider';
import { FilePresetProvider } from '../adapters/file-preset.provider';
import type { StartSessionDto } from '../dto/start-session.dto';
import { MemoryService } from '../narrative/memory.service';
import { NarrativeContextBuilder } from '../narrative/narrative-context.builder';
import { NarrativeGateway } from '../narrative/narrative.gateway';
import { ProfileService } from './profile.service';
import { RuntimeEngineFactory } from './runtime-engine.factory';

const SNAPSHOT_EVERY = Number(process.env.SNAPSHOT_EVERY_TURNS ?? 5);
const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

@Injectable()
export class SessionsService {
  constructor(
    private readonly engineFactory: RuntimeEngineFactory,
    private readonly prisma: PrismaService,
    private readonly sessionRepo: SessionRepo,
    private readonly snapshotRepo: SnapshotRepo,
    private readonly telemetryRepo: TelemetryRepo,
    private readonly capsuleProvider: FileCapsuleProvider,
    private readonly presetProvider: FilePresetProvider,
    private readonly narrativeContextBuilder: NarrativeContextBuilder,
    private readonly narrativeGateway: NarrativeGateway,
    private readonly memoryService: MemoryService,
    private readonly profileService: ProfileService
  ) {}

  async getCapsulePresets(capsuleId: string) {
    return this.presetProvider.getPresets(capsuleId);
  }

  async startSession(dto: StartSessionDto, deviceId: string): Promise<{
    sessionId: string;
    seed: string;
    packet: TurnPacket;
    profileId: string;
  }> {
    const engine = this.engineFactory.create();
    const sessionId = randomUUID();

    try {
      const capsule = await this.capsuleProvider.getCapsule(dto.capsuleId);
      const selectedPreset = await this.presetProvider.getSelectedPreset({
        capsuleId: dto.capsuleId,
        presetId: dto.presetId ?? capsule.defaultPresetId
      });

      const seed = dto.seed?.trim() || `${sessionId}:${dto.capsuleId}:${selectedPreset.presetId}`;

      const { state, packet: packetBase } = await engine.startSession({
        sessionId,
        seed,
        capsuleId: dto.capsuleId,
        roleId: dto.roleId,
        presetId: selectedPreset.presetId,
        preset: selectedPreset
      });

      const emptyMemory = this.memoryService.fromJson(undefined);
      const narrativeContext = this.narrativeContextBuilder.build({
        packetBase,
        capsule,
        sessionId,
        turnId: 'init',
        memory: emptyMemory
      });

      const rendered = await this.narrativeGateway.renderTurnNarrative({
        sessionId,
        turnId: 'init',
        packetBase,
        ctx: narrativeContext
      });

      const packet = {
        ...packetBase,
        narrativeBlocks: rendered.blocks
      };

      const profile = await this.profileService.getOrCreate(deviceId);

      await this.prisma.$transaction(async (tx) => {
        await tx.session.create({
          data: {
            id: sessionId,
            profileId: profile.id,
            capsuleId: dto.capsuleId,
            presetId: selectedPreset.presetId,
            seed,
            status: state.ended ? 'ENDED' : 'ACTIVE',
            rev: 0,
            lastTurnSeq: 0,
            currentStateJson: asJson(sessionStateToJson(state)),
            lastPacketJson: asJson(packet),
            variabilityTagsJson: asJson(selectedPreset.tags),
            memoryJson: asJson(emptyMemory)
          }
        });

        await tx.turn.create({
          data: {
            sessionId,
            turnId: 'init',
            seq: 0,
            requestJson: asJson({ type: 'session_start', presetId: selectedPreset.presetId }),
            outcomeJson: asJson({ outcome: packet.outcome }),
            deltasJson: packet.deltas ? asJson(packet.deltas) : Prisma.JsonNull,
            packetJson: asJson(packet)
          }
        });

        await tx.snapshot.create({
          data: {
            sessionId,
            seq: 0,
            stateJson: asJson(sessionStateToJson(state))
          }
        });
      });

      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        deviceId,
        profileId: profile.id,
        sessionId,
        eventName: 'preset_selected',
        payloadJson: asJson({
          presetId: selectedPreset.presetId,
          tags: selectedPreset.tags,
          clamped: selectedPreset.clamped
        })
      });

      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        deviceId,
        profileId: profile.id,
        sessionId,
        eventName: 'session_seed_set',
        payloadJson: asJson({ seed, custom: Boolean(dto.seed?.trim()) })
      });

      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        deviceId,
        profileId: profile.id,
        sessionId,
        eventName: 'session_started',
        payloadJson: asJson({
          capsuleId: dto.capsuleId,
          presetId: selectedPreset.presetId,
          seed
        })
      });

      if (selectedPreset.clamped) {
        await this.telemetryRepo.appendEvent({
          ts: new Date(),
          source: 'server',
          deviceId,
          profileId: profile.id,
          sessionId,
          eventName: 'preset_clamped',
          payloadJson: asJson({
            presetId: selectedPreset.presetId,
            notes: selectedPreset.clampNotes
          })
        });
      }

      return { sessionId, seed, profileId: profile.id, packet };
    } catch (error) {
      if (error instanceof Error && error.message.includes('CAPSULE_NOT_FOUND')) {
        throw ApiError.capsuleNotFound(dto.capsuleId);
      }
      throw error;
    }
  }

  async resumeSession(sessionId: string, deviceId?: string): Promise<{
    sessionId: string;
    capsuleId: string;
    presetId?: string;
    seed: string;
    lastTurnSeq: number;
    packet: TurnPacket;
  }> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw ApiError.sessionNotFound(sessionId);
    }

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      deviceId,
      profileId: session.profileId ?? undefined,
      sessionId,
      eventName: 'session_resumed',
      payloadJson: asJson({ lastTurnSeq: session.lastTurnSeq, presetId: session.presetId })
    });

    return {
      sessionId: session.id,
      capsuleId: session.capsuleId,
      presetId: session.presetId ?? undefined,
      seed: session.seed,
      lastTurnSeq: session.lastTurnSeq,
      packet: jsonToTurnPacket(session.lastPacketJson)
    };
  }

  async getCapsuleOverview(capsuleId: string): Promise<{
    capsuleId: string;
    title: string;
    scenes: Array<{ id: string; title: string; beatIds: string[] }>;
    hotspots: Array<{ id: string; label: string; locationId: string }>;
  }> {
    const capsule = await this.capsuleProvider.getCapsule(capsuleId);
    return {
      capsuleId: capsule.capsuleId,
      title: capsule.title,
      scenes: capsule.scenes.map((scene) => ({
        id: scene.id,
        title: scene.title,
        beatIds: capsule.beats.filter((beat) => beat.sceneId === scene.id).map((beat) => beat.id)
      })),
      hotspots: capsule.hotspots.map((hotspot) => ({
        id: hotspot.id,
        label: hotspot.label,
        locationId: hotspot.locationId
      }))
    };
  }

  async rebuildState(sessionId: string): Promise<ReturnType<typeof jsonToSessionState>> {
    const latestSnapshot = await this.snapshotRepo.getLatestSnapshot(sessionId);
    const baseState = latestSnapshot ? jsonToSessionState(latestSnapshot.stateJson) : null;
    const snapshotSeq = latestSnapshot?.seq ?? 0;

    if (!baseState) {
      throw ApiError.sessionNotFound(sessionId);
    }

    const turns = await this.prisma.turn.findMany({
      where: { sessionId, seq: { gt: snapshotSeq } },
      orderBy: { seq: 'asc' }
    });

    let state = baseState;
    for (const turn of turns) {
      const packet = jsonToTurnPacket(turn.packetJson);
      state = {
        ...state,
        turnNumber: packet.turnNumber,
        sceneId: packet.scene.sceneId,
        beatId: packet.scene.beatId,
        stateText: packet.stateText,
        ended: Boolean(packet.end)
      };
    }

    return state;
  }

  shouldCreateSnapshot(seq: number): boolean {
    return seq % SNAPSHOT_EVERY === 0;
  }
}
