export interface PresetDials {
  riskTolerance: number;
  costSeverity: number;
  hintDensity: number;
  pacing: number;
}

export type PresetDialKey = keyof PresetDials;

export interface DialDefinition {
  key: PresetDialKey;
  min: number;
  max: number;
  default: number;
  supported: boolean;
}

export const DIAL_REGISTRY: Record<PresetDialKey, DialDefinition> = {
  riskTolerance: {
    key: 'riskTolerance',
    min: 0,
    max: 1,
    default: 0.5,
    supported: true
  },
  costSeverity: {
    key: 'costSeverity',
    min: 0,
    max: 1,
    default: 0.5,
    supported: true
  },
  hintDensity: {
    key: 'hintDensity',
    min: 0,
    max: 1,
    default: 0.5,
    supported: true
  },
  pacing: {
    key: 'pacing',
    min: 0,
    max: 1,
    default: 0.5,
    supported: true
  }
};

export interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  dials: PresetDials;
  tags: string[];
}

export interface SelectedPreset {
  capsuleId: string;
  presetId: string;
  dials: PresetDials;
  tags: string[];
  clamped: boolean;
  clampNotes: string[];
}
