import { z } from 'zod';
import { WorldEventCatalogSchema } from './world-events.zod.js';

const actionVerbSchema = z.enum([
  'TALK',
  'OBSERVE',
  'SEARCH',
  'MOVE',
  'USE',
  'TAKE',
  'WAIT',
  'DROP'
]);

const stateTextSchema = z.object({
  suspicion: z.number().int().min(0).max(100),
  tension: z.number().int().min(0).max(100),
  clock: z.number().int().min(0).max(100),
  risk: z.number().int().min(0).max(100),
  trustByNpc: z.record(z.string().min(1).max(80), z.number().int().min(-100).max(100)).optional()
});

const beatAdvanceRuleSchema = z.object({
  nextBeatId: z.string().min(1).max(80),
  onOutcomes: z
    .array(z.enum(['SUCCESS', 'PARTIAL', 'FAIL_FORWARD']))
    .max(3)
    .optional(),
  clockAtLeast: z.number().int().min(0).max(100).optional()
});

const beatEndingConditionSchema = z.object({
  clockAtLeast: z.number().int().min(0).max(100).optional(),
  requiresClues: z.array(z.string().min(1).max(80)).max(20).optional(),
  requiresLeverage: z.array(z.string().min(1).max(80)).max(20).optional()
});

const beatEndSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  text: z.string().min(1).max(400),
  conditions: beatEndingConditionSchema.optional()
});

const capsuleHotspotSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  locationId: z.string().min(1).max(80),
  verbs: z.array(actionVerbSchema).min(1).max(9),
  risk: z.number().min(0).max(1).optional(),
  rewards: z
    .object({
      clues: z.array(z.string().min(1).max(80)).max(20).optional(),
      leverage: z.array(z.string().min(1).max(80)).max(20).optional(),
      inventory: z.array(z.string().min(1).max(80)).max(20).optional()
    })
    .optional()
});

const capsuleLocationSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(120)
});

const capsuleSceneSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  entryText: z.string().min(1).max(400),
  visual: z.object({
    palette: z.string().min(1).max(80),
    mood: z.string().min(1).max(80),
    backdrop: z.string().min(1).max(80)
  }),
  locations: z.array(capsuleLocationSchema).min(1).max(50)
});

const capsuleBeatSchema = z.object({
  id: z.string().min(1).max(80),
  sceneId: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  entryText: z.string().min(1).max(400).optional(),
  allowedVerbs: z.array(actionVerbSchema).min(1).max(9),
  activeHotspots: z.array(z.string().min(1).max(80)).max(80),
  advanceRules: z.array(beatAdvanceRuleSchema).max(20).optional(),
  end: beatEndSchema.optional()
});

export const CapsuleSchemaZod = z.object({
  schemaVersion: z.literal('1.0.0'),
  capsuleId: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  synopsis: z.string().min(1).max(500),
  roles: z.array(z.string().min(1).max(80)).min(1).max(20),
  presets: z.array(z.string().min(1).max(64)).min(1).max(20),
  defaultRoleId: z.string().min(1).max(80),
  defaultPresetId: z.string().min(1).max(64),
  initial: z.object({
    sceneId: z.string().min(1).max(80),
    beatId: z.string().min(1).max(80),
    locationId: z.string().min(1).max(80),
    stateText: stateTextSchema
  }),
  scenes: z.array(capsuleSceneSchema).min(1).max(100),
  hotspots: z.array(capsuleHotspotSchema).min(1).max(200),
  beats: z.array(capsuleBeatSchema).min(1).max(300),
  worldEvents: WorldEventCatalogSchema.optional()
});

export interface CapsuleSchemaValidationIssue {
  path: string;
  message: string;
}

export function validateCapsuleSchema(
  input: unknown
):
  | { ok: true; value: z.output<typeof CapsuleSchemaZod> }
  | { ok: false; issues: CapsuleSchemaValidationIssue[] } {
  const parsed = CapsuleSchemaZod.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join('.') : '$',
        message: issue.message
      }))
    };
  }
  return { ok: true, value: parsed.data };
}
