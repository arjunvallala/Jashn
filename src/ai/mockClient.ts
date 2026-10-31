import { z } from 'zod';
import { GeminiClient, GenerateStructuredOptions } from './clientInterface';
import { ChatMessage, ChatResponse } from './types';

export type MockBehavior =
  | { mode: 'success'; data: unknown }
  | { mode: 'malformed_json' }
  | { mode: 'schema_violation' }
  | { mode: 'timeout'; delayMs: number }
  | { mode: 'http_error'; statusCode: number; statusText: string };

export class MockGeminiClient implements GeminiClient {
  public behavior: MockBehavior;
  public callCount = 0;
  public lastPrompt = '';
  public lastSystemInstruction = '';

  constructor(behavior: MockBehavior = { mode: 'success', data: {} }) {
    this.behavior = behavior;
  }

  public setBehavior(behavior: MockBehavior): void {
    this.behavior = behavior;
  }

  public async generateStructured<T>(
    prompt: string,
    systemInstruction: string,
    schema: z.ZodType<T>,
    _options?: GenerateStructuredOptions,
  ): Promise<T> {
    this.callCount++;
    this.lastPrompt = prompt;
    this.lastSystemInstruction = systemInstruction;

    if (this.behavior.mode === 'timeout') {
      await new Promise(resolve => setTimeout(resolve, this.behavior.delayMs));
      throw new Error(`MockGeminiClient: Request timed out after ${this.behavior.delayMs}ms`);
    }

    if (this.behavior.mode === 'http_error') {
      const error = new Error(`MockGeminiClient HTTP ${this.behavior.statusCode}: ${this.behavior.statusText}`);
      (error as any).status = this.behavior.statusCode;
      throw error;
    }

    if (this.behavior.mode === 'malformed_json') {
      throw new SyntaxError('MockGeminiClient: Unexpected token in JSON at position 0');
    }

    if (this.behavior.mode === 'schema_violation') {
      // Return invalid shape violating schema
      const invalidData = { invalidField: 12345, missingRequired: true };
      return schema.parse(invalidData); // will throw ZodError
    }

    return schema.parse(this.behavior.data);
  }

  public async chatWithTools(
    messages: ChatMessage[],
    systemInstruction: string,
    _tools: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
  ): Promise<ChatResponse> {
    this.callCount++;
    this.lastSystemInstruction = systemInstruction;
    const lastUserMessage = messages[messages.length - 1]?.content ?? '';

    // Simulate proposing budget change if message mentions budget
    if (lastUserMessage.toLowerCase().includes('budget') || lastUserMessage.toLowerCase().includes('trim')) {
      return {
        replyText: 'I reviewed your budget. To reduce spending, I propose trimming 5% from Venue & Décor and reallocating to your contingency reserve.',
        functionCalls: [
          {
            toolName: 'propose_budget_change',
            arguments: {
              categoryId: 'venue_decor',
              newWeight: 0.3,
              rationale: 'Cost optimization: reduce high stage fabrication expenses',
            },
          },
        ],
      };
    }

    return {
      replyText: `Thank you for your message! I am reviewing your plans for the celebration. How else may I assist you with vendors, timelines, or budget?`,
    };
  }
}
