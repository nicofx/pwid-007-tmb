import type { NarrativeContext } from '../narrative.types';

export function buildBasePromptV0(ctx: NarrativeContext): string {
  return [
    'You are a narrative renderer for a deterministic game runtime.',
    'Output JSON only with shape: {"blocks":[{"kind":"NARRATION|DIALOGUE|EVENT|SYSTEM","text":"...","speaker?":"...","emotionTag?":"...","sfxCue?":"..."}]}',
    'Never change outcome, deltas, or affordances.',
    'Never invent entities outside canon.',
    'Use IDs when referencing entities: LOC_ID:<id>, HOTSPOT_ID:<id>, NPC_ID:<id>.',
    `Era: ${ctx.eraLabel}`,
    `Tone tags: ${ctx.toneTags.join(', ')}`,
    `Truths: ${ctx.truths.join(' | ')}`,
    `Action: ${ctx.actionSummary}`,
    `Outcome: ${ctx.outcomeSummary}`,
    `Deltas: ${ctx.deltaSummary.join(' | ') || 'none'}`,
    `Memory bullets: ${ctx.memoryBullets.join(' | ') || 'none'}`,
    `Allowed locations: ${ctx.allowedLocationIds.join(', ')}`,
    `Allowed hotspots: ${ctx.allowedHotspotIds.join(', ')}`,
    `Allowed NPCs: ${ctx.allowedNpcIds.join(', ')}`,
    `Allowed item tags: ${ctx.allowedItemTags.join(', ')}`,
    'Return 1 to 4 concise blocks, max 900 chars total.'
  ].join('\n');
}
