export type WorldEventFlavor = 'help' | 'shift' | 'friction';
export type WorldEventIntensity = 'soft' | 'strong';

export interface WorldEventStateCondition {
  kind: 'state';
  metric: 'suspicion' | 'tension' | 'clock' | 'risk';
  op: 'gte' | 'lte' | 'eq';
  value: number;
}

export interface WorldEventRepetitionCondition {
  kind: 'repetition';
  mode: 'verb' | 'target';
  key: string;
  op: 'gte' | 'lte';
  value: number;
}

export interface WorldEventBeatCondition {
  kind: 'beat';
  beatId?: string;
  sceneId?: string;
}

export interface WorldEventPresetCondition {
  kind: 'preset';
  requiredTag?: string;
  dial?: 'riskTolerance' | 'costSeverity' | 'hintDensity' | 'pacing';
  op?: 'gte' | 'lte' | 'eq';
  value?: number;
}

export type WorldEventCondition =
  | WorldEventStateCondition
  | WorldEventRepetitionCondition
  | WorldEventBeatCondition
  | WorldEventPresetCondition;

export interface WorldEventTriggers {
  allOf: WorldEventCondition[];
}

export interface WorldEventEffects {
  stateDelta?: Partial<{
    suspicion: number;
    tension: number;
    clock: number;
    risk: number;
  }>;
  toggleHotspots?: {
    enable?: string[];
    disable?: string[];
  };
  toggleLocations?: {
    enable?: string[];
    disable?: string[];
  };
  npcsDelta?: {
    add?: string[];
    remove?: string[];
  };
  addClue?: string[];
  addLeverage?: string[];
}

export interface WorldEventDefinition {
  eventId: string;
  flavor: WorldEventFlavor;
  intensity: WorldEventIntensity;
  allowedBeats?: string[];
  allowedScenes?: string[];
  cooldownKey?: string;
  triggers: WorldEventTriggers;
  effects: WorldEventEffects;
  fairnessCompensation?: boolean;
  diegeticTextTemplate: string;
}

export interface WedBudgetConfig {
  sceneStrongMax: number;
  sceneSoftMax: number;
  capsuleStrongMax: number;
  capsuleSoftMax: number;
  strongCooldownTurns: number;
}

export interface WedMixConfig {
  help: number;
  shift: number;
  friction: number;
}

export interface WorldEventCatalog {
  events: WorldEventDefinition[];
  overrides?: {
    budget?: Partial<WedBudgetConfig>;
    mix?: Partial<WedMixConfig>;
  };
}
