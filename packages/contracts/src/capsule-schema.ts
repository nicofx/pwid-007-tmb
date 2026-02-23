import type { ActionVerb } from './action-model.js';
import type { WorldEventCatalog } from './world-events.js';

export interface CapsuleHotspot {
  id: string;
  label: string;
  locationId: string;
  verbs: ActionVerb[];
  risk?: number;
  rewards?: {
    clues?: string[];
    leverage?: string[];
    inventory?: string[];
  };
}

export interface CapsuleLocation {
  id: string;
  label: string;
}

export interface CapsuleScene {
  id: string;
  title: string;
  entryText: string;
  visual: {
    palette: string;
    mood: string;
    backdrop: string;
  };
  locations: CapsuleLocation[];
}

export interface BeatAdvanceRule {
  nextBeatId: string;
  onOutcomes?: Array<'SUCCESS' | 'PARTIAL' | 'FAIL_FORWARD'>;
  clockAtLeast?: number;
}

export interface BeatEndingCondition {
  clockAtLeast?: number;
  requiresClues?: string[];
  requiresLeverage?: string[];
}

export interface BeatEnd {
  id: string;
  title: string;
  text: string;
  conditions?: BeatEndingCondition;
}

export interface CapsuleBeat {
  id: string;
  sceneId: string;
  title: string;
  entryText?: string;
  allowedVerbs: ActionVerb[];
  activeHotspots: string[];
  advanceRules?: BeatAdvanceRule[];
  end?: BeatEnd;
}

export interface CapsuleSchema {
  schemaVersion: '1.0.0';
  capsuleId: string;
  title: string;
  synopsis: string;
  roles: string[];
  presets: string[];
  defaultRoleId: string;
  defaultPresetId: string;
  initial: {
    sceneId: string;
    beatId: string;
    locationId: string;
    stateText: {
      suspicion: number;
      tension: number;
      clock: number;
      risk: number;
      trustByNpc?: Record<string, number>;
    };
  };
  scenes: CapsuleScene[];
  hotspots: CapsuleHotspot[];
  beats: CapsuleBeat[];
  worldEvents?: WorldEventCatalog;
}
