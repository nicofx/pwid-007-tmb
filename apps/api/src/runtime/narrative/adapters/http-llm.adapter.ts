import { Injectable } from '@nestjs/common';
import type { ILlmAdapter, LlmGenerateInput } from './llm.adapter';

@Injectable()
export class HttpLlmAdapter implements ILlmAdapter {
  async generate(input: LlmGenerateInput): Promise<string> {
    const baseUrl = process.env.LLM_BASE_URL;
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL ?? 'default-model';

    if (!baseUrl || !apiKey) {
      throw new Error('LLM_NOT_CONFIGURED');
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.LLM_TIMEOUT_MS ?? 1600)
    );

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
