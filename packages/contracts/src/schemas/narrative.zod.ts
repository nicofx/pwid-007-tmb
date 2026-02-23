import { z } from 'zod';

const MAX_BLOCKS = 4;
const MAX_CHARS_PER_BLOCK = 320;
const MAX_TOTAL_CHARS = 900;

export const NarrativeBlockSchema = z.object({
  kind: z.enum(['NARRATION', 'DIALOGUE', 'EVENT', 'SYSTEM']),
  text: z.string().min(1).max(MAX_CHARS_PER_BLOCK),
  speaker: z.string().min(1).max(80).optional(),
  emotionTag: z.string().min(1).max(40).optional(),
  sfxCue: z.string().min(1).max(60).optional()
});

export const NarrativePayloadSchema = z
  .object({
    blocks: z.array(NarrativeBlockSchema).min(1).max(MAX_BLOCKS)
  })
  .superRefine((value, ctx) => {
    const chars = value.blocks.reduce((acc, block) => acc + block.text.length, 0);
    if (chars > MAX_TOTAL_CHARS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Narrative text exceeds max total chars ${MAX_TOTAL_CHARS}`
      });
    }
  });

export type NarrativePayloadInput = z.input<typeof NarrativePayloadSchema>;

export function validateNarrativePayload(
  input: unknown
): { ok: true; value: z.output<typeof NarrativePayloadSchema> } | { ok: false; error: string } {
  const parsed = NarrativePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join('; ')
    };
  }

  return { ok: true, value: parsed.data };
}
