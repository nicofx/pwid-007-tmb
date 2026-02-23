import { Injectable } from '@nestjs/common';
import type { ILlmAdapter, LlmGenerateInput } from './llm.adapter';

@Injectable()
export class MockLlmAdapter implements ILlmAdapter {
  async generate(input: LlmGenerateInput): Promise<string> {
    const mode = (process.env.MOCK_LLM_MODE ?? 'ok').toLowerCase();
    if (mode === 'invalid') {
      return '{"blocks":[]}';
    }
    if (mode === 'timeout') {
      await new Promise((resolve) =>
        setTimeout(resolve, Number(process.env.NARRATIVE_TIMEOUT_MS ?? 1600) + 120)
      );
      return '{"blocks":[{"kind":"SYSTEM","text":"late"}]}';
    }

    const text = `Mock narration for turn ${input.turnId}`;
    return JSON.stringify({
      blocks: [
        { kind: 'NARRATION', text },
        { kind: 'EVENT', text: 'The scene reacts with controlled tension.' }
      ]
    });
  }
}
