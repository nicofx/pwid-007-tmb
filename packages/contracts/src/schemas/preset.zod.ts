import { z } from 'zod';
import {
  DIAL_REGISTRY,
  type PresetDefinition,
  type PresetDials,
  type PresetDialKey
} from '../preset.js';

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
    return DIAL_REGISTRY.riskTolerance.default;
  }
  return Math.max(0, Math.min(1, value));
}

export function clampPreset(preset: PresetDefinition): {
  preset: PresetDefinition;
  clamped: boolean;
  clampNotes: string[];
} {
  const nextDials: PresetDials = {
    riskTolerance: clampByDial('riskTolerance', preset.dials.riskTolerance),
    costSeverity: clampByDial('costSeverity', preset.dials.costSeverity),
    hintDensity: clampByDial('hintDensity', preset.dials.hintDensity),
    pacing: clampByDial('pacing', preset.dials.pacing)
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

export interface PresetValidationIssue {
  path: string;
  message: string;
  code: 'PRESET_INVALID' | 'UNKNOWN_DIAL';
}

export function validatePresetDetailed(
  input: unknown
): { ok: true; value: PresetDefinition } | { ok: false; issues: PresetValidationIssue[] } {
  const parsed = PresetDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join('.') : '$',
        message: issue.message,
        code: 'PRESET_INVALID'
      }))
    };
  }

  if (typeof input === 'object' && input !== null) {
    const dials = (input as { dials?: unknown }).dials;
    if (typeof dials === 'object' && dials !== null) {
      const unknown = Object.keys(dials as Record<string, unknown>).filter(
        (key) => !(key in DIAL_REGISTRY)
      );
      if (unknown.length > 0) {
        return {
          ok: false,
          issues: unknown.map((key) => ({
            path: `dials.${key}`,
            message: `Unknown dial ${key}`,
            code: 'UNKNOWN_DIAL'
          }))
        };
      }
    }
  }

  return { ok: true, value: parsed.data };
}

function clampByDial(key: PresetDialKey, value: number): number {
  const dial = DIAL_REGISTRY[key];
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return dial.default;
  }
  return Math.max(dial.min, Math.min(dial.max, value));
}
