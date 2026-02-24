import { Injectable } from '@nestjs/common';
import type { ILlmAdapter, LlmGenerateInput } from './llm.adapter';
import { RuntimeConfigStore } from '../../runtime-config.store';

@Injectable()
export class HttpLlmAdapter implements ILlmAdapter {
  constructor(private readonly runtimeConfigStore: RuntimeConfigStore) {}

  async generate(input: LlmGenerateInput): Promise<string> {
    const runtimeConfig = this.runtimeConfigStore.get();
    const baseUrl = runtimeConfig.llmBaseUrl;
    const apiKey = runtimeConfig.llmApiKey;
    const model = runtimeConfig.llmModel;

    if (!baseUrl || !apiKey) {
      throw new Error('LLM_NOT_CONFIGURED');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), runtimeConfig.narrativeTimeoutMs);

    try {
      const response = await fetch(`${baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, prompt: input.prompt }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`LLM_HTTP_${response.status}`);
      }

      const payload = (await response.json()) as { text?: string; output?: string };
      return payload.text ?? payload.output ?? '';
    } finally {
      clearTimeout(timeout);
    }
  }
}
