import { z } from 'zod';
import { ChatMessage, ChatResponse } from './types';

export interface GenerateStructuredOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiClient {
  /**
   * Generates a structured response strictly conforming to the given Zod schema.
   */
  generateStructured<T>(
    prompt: string,
    systemInstruction: string,
    schema: z.ZodType<T>,
    options?: GenerateStructuredOptions,
  ): Promise<T>;

  /**
   * Interactive multi-turn chat with function calling for planning proposals.
   */
  chatWithTools(
    messages: ChatMessage[],
    systemInstruction: string,
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>,
  ): Promise<ChatResponse>;
}
