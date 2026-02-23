export interface PresetDials {
  riskTolerance: number;
  costSeverity: number;
  hintDensity: number;
  pacing: number;
}

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
