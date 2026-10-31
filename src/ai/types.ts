import { z } from 'zod';
import { CostTier, LanguageCode, TaskPriority } from '../domain/types';

export interface AIClientConfig {
  apiKey?: string;
  modelName?: string;
  timeoutMs?: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

/**
 * Raw AI output schema for initial plan generation.
 * Notice: Gemini proposes qualitative weights and ideas; domain engine computes numbers.
 */
export const AIBudgetWeightProposalSchema = z.object({
  categoryId: z.string(),
  suggestedWeight: z.number().min(0.01).max(1),
  rationale: z.string().max(300),
});

export const AITaskProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(800),
  categoryId: z.string(),
  dayOffset: z.number().int(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(1440).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  dependencies: z.array(z.string()).default([]),
});

export const AIVendorAdviceSchema = z.object({
  categoryId: z.string(),
  serviceName: z.string(),
  questionsToAsk: z.array(z.string().max(300)).max(10),
  contractRedFlags: z.array(z.string().max(300)).max(10),
  inquiryDraft: z.string().max(1500),
});

export const AIIdeaProposalSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1).max(150),
  description: z.string().max(800),
  whyItFits: z.string().max(400),
  costTier: z.enum(['₹', '₹₹', '₹₹₹']),
  estimatedBudgetPercent: z.number().min(0.5).max(40),
  tags: z.array(z.string().max(40)).max(8),
});

export const AIPlanGenerationOutputSchema = z.object({
  eventSummary: z.string().max(500),
  categoryWeights: z.array(AIBudgetWeightProposalSchema).min(1),
  personalizedTasks: z.array(AITaskProposalSchema).max(30),
  vendorGuidance: z.array(AIVendorAdviceSchema).max(15),
  creativeIdeas: z.array(AIIdeaProposalSchema).max(20),
});

export type AIPlanGenerationOutput = z.infer<typeof AIPlanGenerationOutputSchema>;

export interface ChatFunctionCallResult {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface ChatResponse {
  replyText: string;
  functionCalls?: ChatFunctionCallResult[];
}
