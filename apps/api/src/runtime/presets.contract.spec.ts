import { DIAL_REGISTRY, clampPreset, validatePreset, validatePresetDetailed } from '@tmb/contracts';

describe('Preset contracts', () => {
  it('validates preset shape', () => {
    const result = validatePreset({
      id: 'guided',
      label: 'Guided',
      description: 'desc',
      dials: {
        riskTolerance: 0.8,
        costSeverity: 0.3,
        hintDensity: 0.9,
        pacing: 0.4
      },
      tags: ['onboarding']
    });

    expect(result.ok).toBe(true);
  });

  it('clamps out of range dial values', () => {
    const clamped = clampPreset({
      id: 'broken',
      label: 'Broken',
      description: 'desc',
      dials: {
        riskTolerance: 4,
        costSeverity: -2,
        hintDensity: 0.6,
        pacing: 9
      },
      tags: []
    });

    expect(clamped.clamped).toBe(true);
    expect(clamped.preset.dials.riskTolerance).toBe(1);
    expect(clamped.preset.dials.costSeverity).toBe(0);
    expect(clamped.preset.dials.pacing).toBe(1);
  });

  it('exposes dial registry and flags unknown dial in detailed validation', () => {
    expect(DIAL_REGISTRY.riskTolerance.supported).toBe(true);

    const detailed = validatePresetDetailed({
      id: 'bad-dials',
      label: 'Bad',
      description: 'desc',
      dials: {
        riskTolerance: 0.5,
        costSeverity: 0.5,
        hintDensity: 0.5,
        pacing: 0.5,
        chaosBias: 0.9
      },
      tags: []
    });

    expect(detailed.ok).toBe(false);
    if (!detailed.ok) {
      expect(detailed.issues[0]?.code).toBe('UNKNOWN_DIAL');
      expect(detailed.issues[0]?.path).toBe('dials.chaosBias');
    }
  });
});
