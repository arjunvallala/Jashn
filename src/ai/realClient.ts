import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { GeminiClient, GenerateStructuredOptions } from './clientInterface';
import { AIClientConfig, ChatMessage, ChatResponse } from './types';

export class RealGeminiClient implements GeminiClient {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(config: AIClientConfig = {}) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('RealGeminiClient: GEMINI_API_KEY environment variable is missing.');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = config.modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  public async generateStructured<T>(
    prompt: string,
    systemInstruction: string,
    schema: z.ZodType<T>,
    options?: GenerateStructuredOptions,
  ): Promise<T> {
    const maxOutputTokens = options?.maxOutputTokens ?? 4096;
    const temperature = options?.temperature ?? 0.3;

    // Attempt 1
    try {
      return await this.executeGenerate(prompt, systemInstruction, schema, {
        maxOutputTokens,
        temperature,
      });
    } catch (err: unknown) {
      const firstErrorMessage = err instanceof Error ? err.message : String(err);

      // Retry once with repair prompt
      try {
        const repairPrompt = `${prompt}\n\n[REPAIR DIRECTIVE]: Your previous output caused a schema verification error: "${firstErrorMessage}". Strictly generate valid JSON adhering to all required fields.`;
        return await this.executeGenerate(repairPrompt, systemInstruction, schema, {
          maxOutputTokens,
          temperature,
        });
      } catch (retryErr: unknown) {
        throw new Error(
          `Gemini generation failed after repair retry: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
        );
      }
    }
  }

  private async executeGenerate<T>(
    prompt: string,
    systemInstruction: string,
    schema: z.ZodType<T>,
    config: { maxOutputTokens: number; temperature: number },
  ): Promise<T> {
    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty text response.');
    }

    const parsedJson = JSON.parse(responseText);
    return schema.parse(parsedJson);
  }

  public async chatWithTools(
    messages: ChatMessage[],
    systemInstruction: string,
    tools: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
  ): Promise<ChatResponse> {
    // Format conversation history
    const contents = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        tools: tools.length > 0 ? [{ functionDeclarations: tools as any }] : undefined,
      },
    });

    const candidate = response.candidates?.[0];
    const functionCalls: Array<{ toolName: string; arguments: Record<string, unknown> }> = [];

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.functionCall) {
          functionCalls.push({
            toolName: part.functionCall.name || 'unnamed_tool',
            arguments: (part.functionCall.args as Record<string, unknown>) ?? {},
          });
        }
      }
    }

    return {
      replyText: response.text || 'I have generated recommendations for your celebration plan.',
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  }
}
