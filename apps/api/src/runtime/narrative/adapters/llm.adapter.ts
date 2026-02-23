export interface LlmGenerateInput {
  sessionId: string;
  turnId: string;
  prompt: string;
}

export interface ILlmAdapter {
  generate(input: LlmGenerateInput): Promise<string>;
}
