import type { CapsuleSchema } from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

export interface ICapsuleProvider {
  getCapsule(capsuleId: string): Promise<CapsuleSchema>;
}

export interface ITelemetrySink {
  emitSessionEvent(event: {
    type: 'session_started';
    sessionId: string;
    capsuleId: string;
    roleId: string;
    presetId: string;
  }): void | Promise<void>;

  emitTurnEvent(event: {
    type: 'turn_processed';
    sessionId: string;
    turnId: string;
    turnNumber: number;
    verb: import('@tmb/contracts').ActionVerb;
    actionSource: import('@tmb/contracts').ActionSource;
    outcome: import('@tmb/contracts').OutcomeType;
    sceneId: string;
    beatId: string;
    presetId: string;
    variabilityTags: string[];
    blockedReason?: string;
    idempotencyHit: boolean;
    costApplied?: {
      repeatedActionPenalty: boolean;
      riskyActionPenalty: boolean;
    };
  }): void | Promise<void>;
}

export interface IRng {
  readonly seed: number;
  nextFloat(): number;
  nextInt(maxExclusive: number): number;
}

export interface IRngFactory {
  create(seedInput: string): IRng;
}

export interface IClockPolicy {
  nowIso(): string;
}

export interface IRuntimeDeps {
  capsuleProvider: ICapsuleProvider;
  telemetrySink: ITelemetrySink;
  rngFactory: IRngFactory;
  clock: IClockPolicy;
}

export interface IStateFactory {
  createInitial(params: {
    sessionId: string;
    capsule: CapsuleSchema;
    roleId?: string;
    presetId?: string;
  }): SessionState;
}
