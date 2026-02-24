import type {
  ActionModel,
  ActionVerb,
  CapsuleBeat,
  CapsuleSchema,
  WorldEventFlavor,
  WorldEventIntensity,
  OutcomeType,
  StateText,
  TurnDeltas,
  TurnRequest
} from '@tmb/contracts';

export interface WedState {
  sceneBudgetUsed: Record<string, { soft: number; strong: number }>;
  capsuleBudgetUsed: { soft: number; strong: number };
  mixCounts: { help: number; shift: number; friction: number };
  cooldowns: Record<string, number>;
  recentEvents: string[];
  repeatsByVerb: Record<string, number>;
  repeatsByTarget: Record<string, number>;
  lastEvent?: {
    eventId: string;
    flavor: WorldEventFlavor;
    intensity: WorldEventIntensity;
  };
  lastSkipReason?: string;
}

export interface SessionState {
  sessionId: string;
  seed: string;
  capsuleId: string;
  roleId: string;
  presetId: string;
  sceneId: string;
  beatId: string;
  locationId: string;
  turnNumber: number;
  stateText: StateText;
  leverage: Set<string>;
  inventory: Set<string>;
  clues: Set<string>;
  repeatActionCounts: Record<string, number>;
  hotspotOverrides?: {
    enable?: string[];
    disable?: string[];
  };
  locationOverrides?: {
    enable?: string[];
    disable?: string[];
  };
  wed: WedState;
  ended: boolean;
}

export interface TurnContext {
  request: TurnRequest;
  capsule: CapsuleSchema;
  beat: CapsuleBeat;
  state: SessionState;
}

export interface ValidationResult {
  allowed: boolean;
  blockedReason?: string;
  alternatives: Array<{ verb: ActionVerb; targetId?: string; reason: string }>;
}

export interface OutcomeResolution {
  outcome: OutcomeType;
  deltas: TurnDeltas;
  costApplied: {
    repeatedActionPenalty: boolean;
    riskyActionPenalty: boolean;
  };
}

export interface ProgressionResult {
  state: SessionState;
  beatChanged?: {
    from: string;
    to: string;
  };
  unsupportedRules: string[];
  end?: {
    endingId: string;
    title: string;
    text: string;
  };
}

export interface ProcessTurnResult {
  state: SessionState;
  action: ActionModel;
  outcome: OutcomeType;
  deltas: TurnDeltas;
  blockedReason?: string;
  wed?: {
    fired: boolean;
    eventId?: string;
    flavor?: WorldEventFlavor;
    intensity?: WorldEventIntensity;
    skipReason?: string;
    compensationUsed?: boolean;
  };
  packet: import('@tmb/contracts').TurnPacket;
}
