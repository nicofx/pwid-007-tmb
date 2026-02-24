import { Injectable } from '@nestjs/common';
import type { NarrativeBlock } from '@tmb/contracts';
import { buildBerlin1933PromptV0 } from '../prompts/berlin_1933_v0';
import { buildBasePromptV0 } from '../prompts/base_v0';
import { HttpLlmAdapter } from '../adapters/http-llm.adapter';
import { MockLlmAdapter } from '../adapters/mock-llm.adapter';
import type { NarrativeContext, NarrativeProviderResult } from '../narrative.types';
import { NarrativeGuardrailsService } from '../narrative-guardrails.service';
import { RuntimeConfigStore } from '../../runtime-config.store';

export class NarrativeProviderError extends Error {
  constructor(
    message: string,
    public readonly reason: string
  ) {
    super(message);
  }
}

@Injectable()
export class LlmNarrativeProvider {
  constructor(
    private readonly guardrails: NarrativeGuardrailsService,
    private readonly httpAdapter: HttpLlmAdapter,
    private readonly mockAdapter: MockLlmAdapter,
    private readonly runtimeConfigStore: RuntimeConfigStore
  ) {}

  async render(ctx: NarrativeContext): Promise<NarrativeProviderResult> {
    const startedAt = Date.now();
    const prompt =
      ctx.capsuleId === 'berlin-1933' ? buildBerlin1933PromptV0(ctx) : buildBasePromptV0(ctx);

    let parsed: unknown;
    try {
      const text = await this.getAdapter().generate({
        sessionId: ctx.sessionId,
        turnId: ctx.turnId,
        prompt
      });
      parsed = JSON.parse(text);
    } catch (error) {
      if (error instanceof NarrativeProviderError) {
        throw error;
      }
      throw new NarrativeProviderError('LLM parse/call failed', 'adapter_or_parse');
    }

    const structure = this.guardrails.validateStructure(parsed);
    if (!structure.ok) {
      throw new NarrativeProviderError('Narrative structure rejected', structure.reason);
    }

    const sanitized = this.guardrails.sanitizeBlocks(structure.value.blocks);
    if (!sanitized.ok) {
      throw new NarrativeProviderError('Narrative sanitize rejected', sanitized.reason);
    }

    const canon = this.guardrails.validateCanon(sanitized.value, ctx);
    if (!canon.ok) {
      throw new NarrativeProviderError('Narrative canon rejected', canon.reason);
    }

    return {
      blocks: sanitized.value as NarrativeBlock[],
      provider: 'llm',
      fallbackUsed: false,
      latencyMs: Date.now() - startedAt,
      cacheHit: false
    };
  }

  private getAdapter() {
    if (this.runtimeConfigStore.get().llmAdapter === 'http') {
      return this.httpAdapter;
    }
    return this.mockAdapter;
  }
}
