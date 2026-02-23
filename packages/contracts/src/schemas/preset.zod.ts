import { z } from 'zod';
import type { PresetDefinition, PresetDials } from '../preset.js';

const dialSchema = z.number().finite();

export const PresetDialsSchema = z.object({
  riskTolerance: dialSchema,
  costSeverity: dialSchema,
  hintDensity: dialSchema,
  pacing: dialSchema
});

export const PresetDefinitionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  description: z.string().min(1).max(200),
  dials: PresetDialsSchema,
  tags: z.array(z.string().min(1).max(40)).max(12).default([])
});

export function clampDial(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0.5;
  }
  return Math.max(0, Math.min(1, value));
}

export function clampPreset(preset: PresetDefinition): {
  preset: PresetDefinition;
  clamped: boolean;
  clampNotes: string[];
} {
  const nextDials: PresetDials = {
    riskTolerance: clampDial(preset.dials.riskTolerance),
    costSeverity: clampDial(preset.dials.costSeverity),
    hintDensity: clampDial(preset.dials.hintDensity),
    pacing: clampDial(preset.dials.pacing)
  };

  const clampNotes: string[] = [];
  for (const key of Object.keys(nextDials) as Array<keyof PresetDials>) {
    if (nextDials[key] !== preset.dials[key]) {
      clampNotes.push(`${key}:${preset.dials[key]}->${nextDials[key]}`);
    }
  }

  return {
    preset: {
      ...preset,
      dials: nextDials
    },
    clamped: clampNotes.length > 0,
    clampNotes
  };
}

export function validatePreset(
  input: unknown
): { ok: true; value: PresetDefinition } | { ok: false; error: string } {
  const parsed = PresetDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; ')
    };
  }

  return { ok: true, value: parsed.data };
}
