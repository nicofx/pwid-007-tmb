import type { PresetDials, SelectedPreset } from '@tmb/contracts';

export interface RuntimeVariability {
  riskBias: number;
  costScale: number;
  maxSuggestions: number;
  pacingBias: number;
  tags: string[];
}

const DEFAULT_DIALS: PresetDials = {
  riskTolerance: 0.5,
  costSeverity: 0.5,
  hintDensity: 0.5,
  pacing: 0.5
};

export class VariabilityApplier {
  fromPreset(preset?: SelectedPreset): RuntimeVariability {
    const dials = preset?.dials ?? DEFAULT_DIALS;

    return {
      riskBias: (dials.riskTolerance - 0.5) * 0.4,
      costScale: 0.5 + dials.costSeverity,
      maxSuggestions: Math.max(1, Math.min(4, Math.round(1 + dials.hintDensity * 3))),
      pacingBias: (dials.pacing - 0.5) * 0.3,
      tags: [
        `risk_${bucket(dials.riskTolerance)}`,
        `cost_${bucket(dials.costSeverity)}`,
        `hints_${bucket(dials.hintDensity)}`,
        `pacing_${bucket(dials.pacing)}`
      ]
    };
  }
}

function bucket(value: number): 'low' | 'mid' | 'high' {
  if (value < 0.34) {
    return 'low';
  }
  if (value > 0.66) {
    return 'high';
  }
  return 'mid';
}
