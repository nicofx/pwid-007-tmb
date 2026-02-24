import { Injectable } from '@nestjs/common';
import type { NarrativeMode } from './narrative/narrative.types';

export interface RuntimeConfig {
  narrativeMode: NarrativeMode;
  llmAdapter: 'mock' | 'http';
  llmModel: string;
  narrativeTimeoutMs: number;
  narrativeCacheSize: number;
  llmBaseUrl?: string;
  llmApiKey?: string;
  wedEnabled: boolean;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function parseMode(value: string | undefined): NarrativeMode {
  const lower = (value ?? 'placeholder').toLowerCase();
  if (lower === 'llm' || lower === 'hybrid') {
    return lower;
  }
  return 'placeholder';
}

function parseAdapter(value: string | undefined): 'mock' | 'http' {
  return (value ?? 'mock').toLowerCase() === 'http' ? 'http' : 'mock';
}

@Injectable()
export class RuntimeConfigStore {
  private config: RuntimeConfig = {
    narrativeMode: parseMode(process.env.NARRATIVE_MODE),
    llmAdapter: parseAdapter(process.env.LLM_ADAPTER),
    llmModel: process.env.LLM_MODEL ?? 'default-model',
    narrativeTimeoutMs: clampInt(Number(process.env.NARRATIVE_TIMEOUT_MS ?? 1600), 200, 20000),
    narrativeCacheSize: clampInt(Number(process.env.NARRATIVE_CACHE_SIZE ?? 500), 10, 10000),
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmApiKey: process.env.LLM_API_KEY,
    wedEnabled: (process.env.WED_ENABLED ?? 'true').toLowerCase() === 'true'
  };

  get(): RuntimeConfig {
    return { ...this.config };
  }

  update(partial: Partial<RuntimeConfig>): RuntimeConfig {
    const next: RuntimeConfig = {
      ...this.config,
      ...partial,
      narrativeMode: parseMode(partial.narrativeMode ?? this.config.narrativeMode),
      llmAdapter: parseAdapter(partial.llmAdapter ?? this.config.llmAdapter),
      llmModel: partial.llmModel ?? this.config.llmModel,
      narrativeTimeoutMs: clampInt(
        partial.narrativeTimeoutMs ?? this.config.narrativeTimeoutMs,
        200,
        20000
      ),
      narrativeCacheSize: clampInt(
        partial.narrativeCacheSize ?? this.config.narrativeCacheSize,
        10,
        10000
      ),
      llmBaseUrl: partial.llmBaseUrl ?? this.config.llmBaseUrl,
      llmApiKey: partial.llmApiKey ?? this.config.llmApiKey,
      wedEnabled: partial.wedEnabled ?? this.config.wedEnabled
    };

    this.config = next;

    process.env.NARRATIVE_MODE = next.narrativeMode;
    process.env.LLM_ADAPTER = next.llmAdapter;
    process.env.LLM_MODEL = next.llmModel;
    process.env.NARRATIVE_TIMEOUT_MS = String(next.narrativeTimeoutMs);
    process.env.NARRATIVE_CACHE_SIZE = String(next.narrativeCacheSize);
    process.env.WED_ENABLED = String(next.wedEnabled);
    if (next.llmBaseUrl !== undefined) {
      process.env.LLM_BASE_URL = next.llmBaseUrl;
    }
    if (next.llmApiKey !== undefined) {
      process.env.LLM_API_KEY = next.llmApiKey;
    }

    return this.get();
  }
}
