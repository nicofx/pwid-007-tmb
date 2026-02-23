import { Injectable } from '@nestjs/common';
import {
  validateNarrativePayload,
  type NarrativeBlock,
  type NarrativePayload
} from '@tmb/contracts';
import type { NarrativeContext } from './narrative.types';

const FORBIDDEN_PATTERNS = [/https?:\/\//i, /\bout of character\b/i, /\bslur\b/i];

@Injectable()
export class NarrativeGuardrailsService {
  validateStructure(
    input: unknown
  ): { ok: true; value: NarrativePayload } | { ok: false; reason: string } {
    const result = validateNarrativePayload(input);
    if (!result.ok) {
      return { ok: false, reason: `structure:${result.error}` };
    }

    return { ok: true, value: result.value as NarrativePayload };
  }

  sanitizeBlocks(
    blocks: NarrativeBlock[]
  ): { ok: true; value: NarrativeBlock[] } | { ok: false; reason: string } {
    const sanitized = blocks.map((block) => ({
      ...block,
      text: this.sanitizeText(block.text)
    }));

    const hasForbidden = sanitized.some((block) =>
      FORBIDDEN_PATTERNS.some((pattern) => pattern.test(block.text))
    );
    if (hasForbidden) {
      return { ok: false, reason: 'sanitize:forbidden_pattern' };
    }

    return { ok: true, value: sanitized };
  }

  validateCanon(
    blocks: NarrativeBlock[],
    ctx: NarrativeContext
  ): { ok: true } | { ok: false; reason: string } {
    const allowed = new Set([
      ...ctx.allowedLocationIds,
      ...ctx.allowedHotspotIds,
      ...ctx.allowedNpcIds,
      ...ctx.allowedItemTags,
      ...ctx.allowedLabels
    ]);

    const markers = ['LOC_ID:', 'HOTSPOT_ID:', 'NPC_ID:', 'ITEM_TAG:'];
    for (const block of blocks) {
      const tokens = block.text.split(/\s+/);
      for (const token of tokens) {
        const marker = markers.find((candidate) => token.startsWith(candidate));
        if (!marker) {
          continue;
        }
        const value = token.slice(marker.length).replace(/[^a-zA-Z0-9_-]/g, '');
        if (value && !allowed.has(value)) {
          return { ok: false, reason: `canon:${marker}${value}` };
        }
      }
    }

    return { ok: true };
  }

  private sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
