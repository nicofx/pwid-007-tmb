import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { TurnPacket } from '@tmb/contracts';
import { PrismaService } from '../../db/prisma.service';
import { ApiError } from '../../common/api-error';
import { SessionRepo } from '../../modules/persistence/session.repo';
import { TurnRepo } from '../../modules/persistence/turn.repo';
import {
  jsonToSessionState,
  jsonToTurnPacket,
  sessionStateToJson
} from '../../modules/persistence/state.mapper';
import type { TurnDto } from '../dto/turn.dto';
import { RuntimeEngineFactory } from './runtime-engine.factory';
import { SessionsService } from './sessions.service';
import { TelemetryRepo } from '../../modules/persistence/telemetry.repo';
import { FileCapsuleProvider } from '../adapters/file-capsule.provider';
import { FilePresetProvider } from '../adapters/file-preset.provider';
import { NarrativeContextBuilder } from '../narrative/narrative-context.builder';
import { NarrativeGateway } from '../narrative/narrative.gateway';
import { MemoryService } from '../narrative/memory.service';
import { SceneSummaryService } from '../narrative/scene-summary.service';
import { RunSummaryService } from '../narrative/run-summary.service';
import { PostalComposerService } from '../narrative/postal-composer.service';
import { PlaceholderNarrativeService } from '../narrative/placeholder-narrative.service';

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

@Injectable()
export class TurnsService {
  private readonly logger = new Logger(TurnsService.name);

  constructor(
    private readonly engineFactory: RuntimeEngineFactory,
    private readonly prisma: PrismaService,
    private readonly sessionRepo: SessionRepo,
    private readonly turnRepo: TurnRepo,
    private readonly telemetryRepo: TelemetryRepo,
    private readonly sessionsService: SessionsService,
    private readonly capsuleProvider: FileCapsuleProvider,
    private readonly presetProvider: FilePresetProvider,
    private readonly narrativeContextBuilder: NarrativeContextBuilder,
    private readonly narrativeGateway: NarrativeGateway,
    private readonly memoryService: MemoryService,
    private readonly sceneSummaryService: SceneSummaryService,
    private readonly runSummaryService: RunSummaryService,
    private readonly postalComposer: PostalComposerService,
    private readonly placeholderNarrativeService: PlaceholderNarrativeService
  ) {}

  async processTurn(dto: TurnDto): Promise<{ packet: TurnPacket; idempotencyHit: boolean }> {
    const startedAt = Date.now();

    const session = await this.sessionRepo.getById(dto.sessionId);
    if (!session) {
      throw ApiError.sessionNotFound(dto.sessionId);
    }

    const idempotent = await this.turnRepo.getByTurnId(dto.sessionId, dto.turnId);
    if (idempotent) {
      const packet = jsonToTurnPacket(idempotent.packetJson);

      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'turn_idempotent_hit',
        payloadJson: asJson({ idempotencyHit: true, seq: idempotent.seq })
      });

      this.logger.log(
        JSON.stringify({
          event: 'turn_processed',
          sessionId: dto.sessionId,
          turnId: dto.turnId,
          verb: packet.action.verb,
          outcome: packet.outcome,
          sceneId: packet.scene.sceneId,
          beatId: packet.scene.beatId,
          idempotencyHit: true
        })
      );

      return { packet, idempotencyHit: true };
    }

    const engine = this.engineFactory.create();
    const state = jsonToSessionState(session.currentStateJson);
    const nextSeq = session.lastTurnSeq + 1;
    const selectedPreset = await this.presetProvider.getSelectedPreset({
      capsuleId: session.capsuleId,
      presetId: session.presetId ?? undefined
    });

    const result = await engine.processTurn({
      request: {
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        playerText: dto.playerText,
        action: dto.action
      },
      state,
      preset: selectedPreset,
      idempotencyHit: false
    });

    const narrativeStartedAt = Date.now();
    let packetFinal: TurnPacket = result.packet;
    let narrativeProvider: 'llm' | 'placeholder' = 'placeholder';
    let narrativeFallback = false;
    let narrativeRejectReason: string | undefined;
    let narrativeCacheHit = false;
    let narrativeLatencyMs: number | undefined;

    const previousPacket = jsonToTurnPacket(session.lastPacketJson);
    const memory = this.memoryService.fromJson(session.memoryJson);
    const existingSceneSummary = this.sceneSummaryService.fromJson(session.sceneSummaryJson);
    const existingRunSummary = this.runSummaryService.fromJson(session.runSummaryJson);

    try {
      let capsule: Awaited<ReturnType<FileCapsuleProvider['getCapsule']>> | undefined;
      try {
        capsule = await this.capsuleProvider.getCapsule(session.capsuleId);
      } catch {
        capsule = undefined;
      }

      const narrativeContext = this.narrativeContextBuilder.build({
        packetBase: result.packet,
        capsule,
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        memory
      });

      const rendered = await this.narrativeGateway.renderTurnNarrative({
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        packetBase: result.packet,
        ctx: narrativeContext
      });

      packetFinal = {
        ...result.packet,
        narrativeBlocks: [...result.packet.narrativeBlocks, ...rendered.blocks]
      };
      narrativeProvider = rendered.meta.provider;
      narrativeFallback = rendered.meta.fallbackUsed;
      narrativeRejectReason = rendered.meta.guardrailRejectReason;
      narrativeCacheHit = rendered.meta.cacheHit;
      narrativeLatencyMs = rendered.meta.latencyMs;
    } catch (error) {
      packetFinal = {
        ...result.packet,
        narrativeBlocks: [
          ...result.packet.narrativeBlocks,
          ...this.placeholderNarrativeService.render(result.packet)
        ]
      };
      narrativeProvider = 'placeholder';
      narrativeFallback = true;
      narrativeRejectReason = error instanceof Error ? error.message : 'gateway_error';
      narrativeLatencyMs = Date.now() - narrativeStartedAt;
    }

    const nextMemory = this.memoryService.update({
      memory,
      packet: packetFinal,
      blockedReason: result.blockedReason
    });
    const nextSceneSummary = this.sceneSummaryService.updateOnTurn({
      previousPacket,
      currentPacket: packetFinal,
      memory: nextMemory,
      existing: existingSceneSummary
    });
    const nextRunSummary = this.runSummaryService.updateOnEnd({
      packet: packetFinal,
      memory: nextMemory,
      existing: existingRunSummary
    });

    if (packetFinal.end) {
      packetFinal = {
        ...packetFinal,
        end: this.postalComposer.compose(packetFinal.end, nextRunSummary)
      };
    }

    const nextRev = session.rev + 1;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.turn.create({
          data: {
            sessionId: dto.sessionId,
            turnId: dto.turnId,
            seq: nextSeq,
            requestJson: {
              sessionId: dto.sessionId,
              turnId: dto.turnId,
              playerText: dto.playerText,
              action: dto.action
            } as Prisma.InputJsonValue,
            outcomeJson: {
              outcome: packetFinal.outcome,
              blockedReason: result.blockedReason
            } as Prisma.InputJsonValue,
            deltasJson:
              Object.keys(result.deltas).length > 0 ? asJson(result.deltas) : Prisma.JsonNull,
            packetJson: asJson(packetFinal)
          }
        });

        const update = await tx.session.updateMany({
          where: { id: dto.sessionId, rev: session.rev },
          data: {
            rev: nextRev,
            lastTurnSeq: nextSeq,
            currentStateJson: asJson(sessionStateToJson(result.state)),
            lastPacketJson: asJson(packetFinal),
            status: result.state.ended ? 'ENDED' : 'ACTIVE',
            variabilityTagsJson: asJson(selectedPreset.tags),
            memoryJson: asJson(nextMemory),
            sceneSummaryJson: nextSceneSummary ? asJson(nextSceneSummary) : Prisma.JsonNull,
            runSummaryJson: nextRunSummary ? asJson(nextRunSummary) : Prisma.JsonNull
          }
        });

        if (update.count === 0) {
          throw ApiError.sessionConflict();
        }

        if (this.sessionsService.shouldCreateSnapshot(nextSeq)) {
          await tx.snapshot.create({
            data: {
              sessionId: dto.sessionId,
              seq: nextSeq,
              stateJson: asJson(sessionStateToJson(result.state))
            }
          });

          await tx.telemetryEvent.create({
            data: {
              ts: new Date(),
              source: 'server',
              sessionId: dto.sessionId,
              turnId: dto.turnId,
              eventName: 'snapshot_created',
              payloadJson: asJson({ seq: nextSeq })
            }
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const cached = await this.turnRepo.getByTurnId(dto.sessionId, dto.turnId);
        if (cached) {
          return { packet: jsonToTurnPacket(cached.packetJson), idempotencyHit: true };
        }
      }
      if (error instanceof Error && error.message.includes('SESSION_CONFLICT')) {
        throw ApiError.sessionConflict();
      }
      throw error;
    }

    const durationMs = Date.now() - startedAt;

    await this.telemetryRepo.appendEvents([
      {
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'turn_processed',
        payloadJson: asJson({
          duration_ms: durationMs,
          seq: nextSeq,
          presetId: selectedPreset.presetId,
          variability_tags: selectedPreset.tags,
          outcome: packetFinal.outcome,
          blockedReason: result.blockedReason,
          imponderable_fired: result.wed?.fired ?? false,
          imponderable_event_id: result.wed?.eventId ?? null,
          imponderable_skip_reason: result.wed?.skipReason ?? null
        })
      },
      {
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'turn_idempotent_hit',
        payloadJson: asJson({ idempotencyHit: false, seq: nextSeq })
      },
      {
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'variability_applied',
        payloadJson: asJson({
          presetId: selectedPreset.presetId,
          dials: selectedPreset.dials,
          tags: selectedPreset.tags
        })
      },
      {
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'narrative_rendered',
        payloadJson: asJson({
          provider: narrativeProvider,
          fallbackUsed: narrativeFallback,
          guardrailRejectReason: narrativeRejectReason,
          latency_ms: narrativeLatencyMs ?? Date.now() - narrativeStartedAt,
          cacheHit: narrativeCacheHit
        })
      },
      {
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'memory_updated',
        payloadJson: asJson({ bullet_count: nextMemory.bullets.length })
      },
      {
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: result.wed?.fired ? 'imponderable_fired' : 'imponderable_skipped',
        payloadJson: asJson(
          result.wed?.fired
            ? {
                eventId: result.wed?.eventId,
                flavor: result.wed?.flavor,
                intensity: result.wed?.intensity,
                compensationUsed: result.wed?.compensationUsed ?? false,
                sceneId: packetFinal.scene.sceneId,
                beatId: packetFinal.scene.beatId
              }
            : {
                reason: result.wed?.skipReason ?? 'NO_CANDIDATES',
                sceneId: packetFinal.scene.sceneId,
                beatId: packetFinal.scene.beatId
              }
        )
      }
    ]);

    if (narrativeFallback) {
      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'narrative_fallback',
        payloadJson: asJson({ reason: narrativeRejectReason ?? 'unknown' })
      });
    }

    if (narrativeRejectReason) {
      await this.telemetryRepo.appendEvent({
        ts: new Date(),
        source: 'server',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        eventName: 'guardrail_reject',
        payloadJson: asJson({ reason: narrativeRejectReason })
      });
    }

    this.logger.log(
      JSON.stringify({
        event: 'turn_processed',
        sessionId: dto.sessionId,
        turnId: dto.turnId,
        seq: nextSeq,
        verb: packetFinal.action.verb,
        outcome: packetFinal.outcome,
        sceneId: packetFinal.scene.sceneId,
        beatId: packetFinal.scene.beatId,
        blockedReason: result.blockedReason,
        idempotencyHit: false,
        duration_ms: durationMs,
        narrative_provider: narrativeProvider,
        narrative_fallback: narrativeFallback,
        presetId: selectedPreset.presetId,
        variability_tags: selectedPreset.tags,
        imponderable_fired: result.wed?.fired ?? false,
        imponderable_event_id: result.wed?.eventId,
        imponderable_skip_reason: result.wed?.skipReason
      })
    );

    return { packet: packetFinal, idempotencyHit: false };
  }
}
