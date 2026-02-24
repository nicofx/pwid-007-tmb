import { Injectable, Logger } from '@nestjs/common';
import type { NarrativeBlock, TurnPacket } from '@tmb/contracts';
import { PlaceholderNarrativeService } from './placeholder-narrative.service';
import type { NarrativeContext, NarrativeMode, NarrativeRenderMetadata } from './narrative.types';
import { LlmNarrativeProvider, NarrativeProviderError } from './providers/llm-narrative.provider';
import { RuntimeConfigStore } from '../runtime-config.store';

interface CachedNarrative {
  blocks: NarrativeBlock[];
  provider: 'placeholder' | 'llm';
}

@Injectable()
export class NarrativeGateway {
  private readonly logger = new Logger(NarrativeGateway.name);
  private readonly cache = new Map<string, CachedNarrative>();

  constructor(
    private readonly placeholder: PlaceholderNarrativeService,
    private readonly llmProvider: LlmNarrativeProvider,
    private readonly runtimeConfigStore: RuntimeConfigStore
  ) {}

  async renderTurnNarrative(params: {
    sessionId: string;
    turnId: string;
    packetBase: TurnPacket;
    ctx: NarrativeContext;
  }): Promise<{ blocks: NarrativeBlock[]; meta: NarrativeRenderMetadata }> {
    const mode = this.getMode();
    const cacheKey = `${params.sessionId}:${params.turnId}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return {
        blocks: cached.blocks,
        meta: {
          mode,
          provider: cached.provider,
          fallbackUsed: cached.provider !== 'llm',
          cacheHit: true
        }
      };
    }

    if (mode === 'placeholder') {
      const blocks = this.placeholder.render(params.packetBase);
      this.setCache(cacheKey, { blocks, provider: 'placeholder' });
      return {
        blocks,
        meta: {
          mode,
          provider: 'placeholder',
          fallbackUsed: false,
          cacheHit: false
        }
      };
    }

    const startedAt = Date.now();
    try {
      const llmResult = await this.withTimeout(
        this.llmProvider.render(params.ctx),
        this.runtimeConfigStore.get().narrativeTimeoutMs
      );

      this.setCache(cacheKey, { blocks: llmResult.blocks, provider: 'llm' });
      return {
        blocks: llmResult.blocks,
        meta: {
          mode,
          provider: 'llm',
          fallbackUsed: false,
          latencyMs: llmResult.latencyMs ?? Date.now() - startedAt,
          cacheHit: false
        }
      };
    } catch (error) {
      const reason =
        error instanceof NarrativeProviderError
          ? error.reason
          : error instanceof Error
            ? error.message
            : 'unknown';

      this.logger.warn(
        JSON.stringify({
          event: 'narrative_fallback',
          sessionId: params.sessionId,
          turnId: params.turnId,
          mode,
          reason
        })
      );

      const blocks = this.placeholder.render(params.packetBase);
      this.setCache(cacheKey, { blocks, provider: 'placeholder' });
      return {
        blocks,
        meta: {
          mode,
          provider: 'placeholder',
          fallbackUsed: true,
          guardrailRejectReason: reason,
          latencyMs: Date.now() - startedAt,
          cacheHit: false
        }
      };
    }
  }

  private getMode(): NarrativeMode {
    return this.runtimeConfigStore.get().narrativeMode;
  }

  private setCache(key: string, value: CachedNarrative): void {
    const max = this.runtimeConfigStore.get().narrativeCacheSize;
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size <= max) {
      return;
    }
    const oldestKey = this.cache.keys().next().value as string | undefined;
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new NarrativeProviderError('Timeout', 'timeout')),
        timeoutMs
      );
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
