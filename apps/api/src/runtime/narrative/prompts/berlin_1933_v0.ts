import type { NarrativeContext } from '../narrative.types';
import { buildBasePromptV0 } from './base_v0';

export function buildBerlin1933PromptV0(ctx: NarrativeContext): string {
  return [
    buildBasePromptV0(ctx),
    'Setting note: Berlin 1933. Keep language grounded and diegetic.',
    'Avoid modern slang and out-of-character commentary.'
  ].join('\n\n');
}
