import type { CapsuleBeat, SelectedPreset, TurnPacket, TurnRequest } from '@tmb/contracts';
import type { ProcessTurnResult, SessionState } from '../domain/types.js';
import type { IRuntimeDeps, IStateFactory } from '../ports/interfaces.js';
import { ActionResolver } from './action-resolver.js';
import { AffordancesBuilder } from './affordances-builder.js';
import { BeatProgression } from './beat-progression.js';
import { BeatValidator } from './beat-validator.js';
import { OutcomeResolver } from './outcome-resolver.js';
import { SessionStateFactory } from './session-state-factory.js';
import { StateReducer } from './state-reducer.js';
import { TurnPacketBuilder } from './turn-packet-builder.js';
import { VariabilityApplier } from './variability-applier.js';
import { WorldEventDirector } from './world-event-director.js';

function getBeat(
  state: SessionState,
  capsule: import('@tmb/contracts').CapsuleSchema
): CapsuleBeat {
  const beat = capsule.beats.find((candidate) => candidate.id === state.beatId);
  if (!beat) {
    throw new Error(`BEAT_NOT_FOUND:${state.beatId}`);
  }
  return beat;
}

export class TurnEngine {
  private readonly actionResolver = new ActionResolver();
  private readonly beatValidator = new BeatValidator();
  private readonly outcomeResolver = new OutcomeResolver();
  private readonly stateReducer = new StateReducer();
  private readonly beatProgression = new BeatProgression();
  private readonly affordancesBuilder = new AffordancesBuilder();
  private readonly packetBuilder = new TurnPacketBuilder();
  private readonly variabilityApplier = new VariabilityApplier();
  private readonly worldEventDirector = new WorldEventDirector();

  constructor(
    private readonly deps: IRuntimeDeps,
    private readonly stateFactory: IStateFactory = new SessionStateFactory()
  ) {}

  async startSession(params: {
    sessionId: string;
    capsuleId: string;
    roleId?: string;
    presetId?: string;
    preset?: SelectedPreset;
  }): Promise<{ state: SessionState; packet: TurnPacket }> {
    const capsule = await this.deps.capsuleProvider.getCapsule(params.capsuleId);
    const state = this.stateFactory.createInitial({
      sessionId: params.sessionId,
      capsule,
      roleId: params.roleId,
      presetId: params.presetId
    });

    const beat = getBeat(state, capsule);
    const variability = this.variabilityApplier.fromPreset(params.preset);
    const action = {
      verb: 'OBSERVE' as const,
      modifiers: [],
      source: 'fallback' as const,
      targetId: state.locationId,
      rawText: 'Session started'
    };

    const affordances = this.affordancesBuilder.buildAffordances(state, beat, capsule, {
      maxSuggestions: variability.maxSuggestions
    });

    const packet = this.packetBuilder.buildTurnPacket({
      state,
      capsule,
      beat,
      turnId: 'init',
      action,
      outcome: 'SUCCESS',
      narrativeBlocks: [],
      affordances,
      worldEvent: { fired: false, skipReason: 'NO_CANDIDATES' }
    });

    await this.deps.telemetrySink.emitSessionEvent({
      type: 'session_started',
      sessionId: state.sessionId,
      capsuleId: state.capsuleId,
      roleId: state.roleId,
      presetId: state.presetId
    });

    return { state, packet };
  }

  async processTurn(params: {
    request: TurnRequest;
    state: SessionState;
    preset?: SelectedPreset;
    idempotencyHit?: boolean;
  }): Promise<ProcessTurnResult> {
    const { request } = params;
    const capsule = await this.deps.capsuleProvider.getCapsule(params.state.capsuleId);
    const beat = getBeat(params.state, capsule);
    const variability = this.variabilityApplier.fromPreset(params.preset);

    const rng = this.deps.rngFactory.create(
      `${params.state.sessionId}:${params.state.capsuleId}:${params.state.presetId}:${request.turnId}`
    );

    const action = this.actionResolver.resolveAction(request, params.state, capsule);
    const validation = this.beatValidator.validateActionAgainstBeat(action, beat, capsule, {
      maxSuggestions: variability.maxSuggestions
    });

    const outcomeResolution = this.outcomeResolver.resolveOutcome({
      action,
      beat,
      capsule,
      state: params.state,
      rng,
      blocked: !validation.allowed,
      riskBias: variability.riskBias,
      costScale: variability.costScale
    });

    const key = `${params.state.beatId}:${action.verb}:${action.targetId ?? 'none'}`;
    const stateWithCounters: SessionState = {
      ...params.state,
      repeatActionCounts: {
        ...params.state.repeatActionCounts,
        [key]: (params.state.repeatActionCounts[key] ?? 0) + 1
      },
      turnNumber: params.state.turnNumber + 1
    };

    const stateAfterDeltas = this.stateReducer.applyDeltas(
      stateWithCounters,
      outcomeResolution.deltas
    );

    const progression = this.beatProgression.advanceBeat({
      state: stateAfterDeltas,
      capsule,
      beat,
      outcome: outcomeResolution.outcome,
      deltas: outcomeResolution.deltas
    });

    const activeBeat = getBeat(progression.state, capsule);
    const affordances = progression.end
      ? undefined
      : this.affordancesBuilder.buildAffordances(progression.state, activeBeat, capsule, {
          maxSuggestions: variability.maxSuggestions
        });

    const deltas =
      Object.keys(outcomeResolution.deltas).length > 0 ? outcomeResolution.deltas : undefined;

    const wedApplied = this.worldEventDirector.maybeApply({
      context: {
        request,
        capsule,
        beat: activeBeat,
        state: progression.state
      },
      state: progression.state,
      capsule,
      preset: params.preset,
      rng,
      deltas: deltas ?? {},
      affordances
    });
    const wedNarrativeBlocks = wedApplied.eventBlock ? [wedApplied.eventBlock] : [];

    const packet = this.packetBuilder.buildTurnPacket({
      state: wedApplied.state,
      capsule,
      beat: activeBeat,
      turnId: request.turnId,
      action,
      outcome: outcomeResolution.outcome,
      narrativeBlocks: wedNarrativeBlocks,
      affordances: wedApplied.affordances,
      deltas: Object.keys(wedApplied.deltas).length > 0 ? wedApplied.deltas : undefined,
      worldEvent: wedApplied.fired
        ? {
            fired: true,
            eventId: wedApplied.eventId,
            flavor: wedApplied.flavor,
            intensity: wedApplied.intensity,
            compensationUsed: wedApplied.compensationUsed
          }
        : { fired: false, skipReason: wedApplied.skipReason },
      end: progression.end
    });

    await this.deps.telemetrySink.emitTurnEvent({
      type: 'turn_processed',
      sessionId: wedApplied.state.sessionId,
      turnId: request.turnId,
      turnNumber: wedApplied.state.turnNumber,
      verb: action.verb,
      actionSource: action.source,
      outcome: packet.outcome,
      sceneId: packet.scene.sceneId,
      beatId: packet.scene.beatId,
      presetId: wedApplied.state.presetId,
      variabilityTags: variability.tags,
      blockedReason: validation.blockedReason,
      idempotencyHit: Boolean(params.idempotencyHit),
      costApplied: outcomeResolution.costApplied
    });

    return {
      state: wedApplied.state,
      wed: wedApplied.fired
        ? {
            fired: true,
            eventId: wedApplied.eventId,
            flavor: wedApplied.flavor,
            intensity: wedApplied.intensity,
            compensationUsed: wedApplied.compensationUsed
          }
        : {
            fired: false,
            skipReason: wedApplied.skipReason
          },
      action,
      outcome: packet.outcome,
      blockedReason: validation.blockedReason,
      deltas: wedApplied.deltas,
      packet
    };
  }
}
