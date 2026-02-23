import { z } from 'zod';

const idArray = z.array(z.string().min(1).max(80)).max(20);

const stateConditionSchema = z.object({
  kind: z.literal('state'),
  metric: z.enum(['suspicion', 'tension', 'clock', 'risk']),
  op: z.enum(['gte', 'lte', 'eq']),
  value: z.number().finite()
});

const repetitionConditionSchema = z.object({
  kind: z.literal('repetition'),
  mode: z.enum(['verb', 'target']),
  key: z.string().min(1).max(80),
  op: z.enum(['gte', 'lte']),
  value: z.number().int().min(0).max(999)
});

const beatConditionSchema = z.object({
  kind: z.literal('beat'),
  beatId: z.string().min(1).max(80).optional(),
  sceneId: z.string().min(1).max(80).optional()
});

const presetConditionSchema = z.object({
  kind: z.literal('preset'),
  requiredTag: z.string().min(1).max(80).optional(),
  dial: z.enum(['riskTolerance', 'costSeverity', 'hintDensity', 'pacing']).optional(),
  op: z.enum(['gte', 'lte', 'eq']).optional(),
  value: z.number().finite().optional()
});

const worldEventConditionSchema = z.discriminatedUnion('kind', [
  stateConditionSchema,
  repetitionConditionSchema,
  beatConditionSchema,
  presetConditionSchema
]);

const worldEventSchema = z.object({
  eventId: z.string().min(1).max(100),
  flavor: z.enum(['help', 'shift', 'friction']),
  intensity: z.enum(['soft', 'strong']),
  allowedBeats: idArray.optional(),
  allowedScenes: idArray.optional(),
  cooldownKey: z.string().min(1).max(80).optional(),
  triggers: z.object({
    allOf: z.array(worldEventConditionSchema).max(20).default([])
  }),
  effects: z.object({
    stateDelta: z
      .object({
        suspicion: z.number().int().min(-40).max(40).optional(),
        tension: z.number().int().min(-40).max(40).optional(),
        clock: z.number().int().min(-10).max(10).optional(),
        risk: z.number().int().min(-40).max(40).optional()
      })
      .optional(),
    toggleHotspots: z
      .object({
        enable: idArray.optional(),
        disable: idArray.optional()
      })
      .optional(),
    toggleLocations: z
      .object({
        enable: idArray.optional(),
        disable: idArray.optional()
      })
      .optional(),
    npcsDelta: z
      .object({
        add: idArray.optional(),
        remove: idArray.optional()
      })
      .optional(),
    addClue: idArray.optional(),
    addLeverage: idArray.optional()
  }),
  fairnessCompensation: z.boolean().optional(),
  diegeticTextTemplate: z.string().min(1).max(260)
});

export const WorldEventCatalogSchema = z.object({
  events: z.array(worldEventSchema).min(1).max(40),
  overrides: z
    .object({
      budget: z
        .object({
          sceneStrongMax: z.number().int().min(0).max(5).optional(),
          sceneSoftMax: z.number().int().min(0).max(6).optional(),
          capsuleStrongMax: z.number().int().min(0).max(8).optional(),
          capsuleSoftMax: z.number().int().min(0).max(12).optional(),
          strongCooldownTurns: z.number().int().min(0).max(12).optional()
        })
        .optional(),
      mix: z
        .object({
          help: z.number().min(0).max(1).optional(),
          shift: z.number().min(0).max(1).optional(),
          friction: z.number().min(0).max(1).optional()
        })
        .optional()
    })
    .optional()
});

export function validateWorldEventCatalog(
  input: unknown
): { ok: true; value: z.output<typeof WorldEventCatalogSchema> } | { ok: false; error: string } {
  const parsed = WorldEventCatalogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; ')
    };
  }
  return { ok: true, value: parsed.data };
}
