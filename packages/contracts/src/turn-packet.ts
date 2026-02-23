import type { ActionModel } from './action-model.js';
import type { NarrativeBlock } from './narrative.js';

export type OutcomeType = 'SUCCESS' | 'PARTIAL' | 'FAIL_FORWARD' | 'BLOCKED';

export interface StateText {
  suspicion: number;
  tension: number;
  clock: number;
  risk: number;
  trustByNpc?: Record<string, number>;
}

export interface TurnDeltas {
  state?: Partial<StateText>;
  cluesAdded?: string[];
  leverageAdded?: string[];
  inventoryAdded?: string[];
  beatChanged?: {
    from: string;
    to: string;
  };
}

export interface TurnAffordances {
  activeLocations: string[];
  activeHotspots: string[];
  allowedVerbs: ActionModel['verb'][];
  suggestedActions: Array<{
    verb: ActionModel['verb'];
    targetId?: string;
    reason: string;
  }>;
}

export interface TurnPacket {
  schemaVersion: '1.0.0';
  sessionId: string;
  turnId: string;
  turnNumber: number;
  capsuleId: string;
  scene: {
    sceneId: string;
    beatId: string;
    sceneTitle: string;
    beatTitle: string;
  };
  visual: {
    palette: string;
    mood: string;
    backdrop: string;
  };
  action: ActionModel;
  outcome: OutcomeType;
  narrativeBlocks: NarrativeBlock[];
  stateText: StateText;
  activeIU?: {
    iuId: string;
    title: string;
    brief: string;
    approaches: Array<{
      id: string;
      label: string;
      intentHint?: string;
    }>;
  };
  affordances?: TurnAffordances;
  deltas?: TurnDeltas;
  worldEvent?: {
    fired: boolean;
    eventId?: string;
    flavor?: 'help' | 'shift' | 'friction';
    intensity?: 'soft' | 'strong';
    skipReason?: string;
    compensationUsed?: boolean;
  };
  end?: {
    endingId: string;
    title: string;
    text: string;
  };
}
