import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAndValidateJsonBody, enforceAIRateLimit } from '@/lib/apiSecurity';
import { getGeminiClient } from '@/ai/clientFactory';
import { buildChatSystemPrompt } from '@/ai/prompts';
import { LanguageCodeSchema } from '@/domain/validators';
import { PlanProposal } from '@/domain/types';
import { SafeLogger } from '@/lib/logger';

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'model', 'system']),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(25),
  compactPlanSummary: z.string().max(3000),
  language: LanguageCodeSchema.default('en'),
});

const PLANNING_TOOLS = [
  {
    name: 'propose_budget_change',
    description: 'Propose adjusting the weight/allocation of a budget category.',
    parameters: {
      type: 'object',
      properties: {
        categoryId: { type: 'string', description: 'The ID of the budget category' },
        newWeight: { type: 'number', description: 'Proposed fractional weight (e.g. 0.35)' },
        rationale: { type: 'string', description: 'Why this adjustment is recommended' },
      },
      required: ['categoryId', 'newWeight', 'rationale'],
    },
  },
  {
    name: 'add_task',
    description: 'Propose adding a new milestone or day-of run-of-show task to the timeline.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Detailed action instructions' },
        categoryId: { type: 'string', description: 'Associated category ID' },
        dayOffset: { type: 'integer', description: 'Negative days before event or 0 for day of' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
      },
      required: ['title', 'categoryId', 'dayOffset'],
    },
  },
  {
    name: 'update_vendor_status',
    description: 'Propose updating a vendor pipeline status.',
    parameters: {
      type: 'object',
      properties: {
        vendorId: { type: 'string', description: 'The ID of the vendor' },
        status: { type: 'string', enum: ['to_contact', 'quoted', 'negotiating', 'booked', 'paid'] },
      },
      required: ['vendorId', 'status'],
    },
  },
  {
    name: 'suggest_ideas',
    description: 'Propose a new personalized idea or celebration customization.',
    parameters: {
      type: 'object',
      properties: {
        categoryId: { type: 'string', description: 'Associated category' },
        title: { type: 'string', description: 'Idea title' },
        description: { type: 'string', description: 'Idea description' },
        costTier: { type: 'string', enum: ['₹', '₹₹', '₹₹₹'] },
        whyItFits: { type: 'string', description: 'Why it fits user preferences' },
      },
      required: ['categoryId', 'title', 'description', 'costTier', 'whyItFits'],
    },
  },
];

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceAIRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await parseAndValidateJsonBody(req, ChatRequestSchema);
  if (validation.errorResponse) return validation.errorResponse;

  const { messages, compactPlanSummary, language } = validation.data;

  try {
    const client = getGeminiClient();
    const systemPrompt = buildChatSystemPrompt(compactPlanSummary, language);

    const chatResponse = await client.chatWithTools(messages, systemPrompt, PLANNING_TOOLS);

    // Transform function calls into structured pending proposals
    const proposals: PlanProposal[] = (chatResponse.functionCalls ?? []).map(fc => {
      const proposalId = crypto.randomUUID();
      const toolName = fc.toolName;
      const args = fc.arguments;

      let title = 'Plan Proposal';
      let description = '';
      let diffSummary = '';

      if (toolName === 'propose_budget_change') {
        title = `Adjust Budget for ${String(args.categoryId)}`;
        description = String(args.rationale || 'Adjust category allocation');
        diffSummary = `New suggested weight: ${Math.round(Number(args.newWeight) * 100)}%`;
      } else if (toolName === 'add_task') {
        title = `Add Task: ${String(args.title)}`;
        description = String(args.description || '');
        diffSummary = `Offset: ${Number(args.dayOffset)} days | Priority: ${String(args.priority || 'medium')}`;
      } else if (toolName === 'update_vendor_status') {
        title = `Update Vendor Status`;
        description = `Change status of ${String(args.vendorId)} to ${String(args.status)}`;
        diffSummary = `Status -> ${String(args.status)}`;
      } else if (toolName === 'suggest_ideas') {
        title = `New Idea: ${String(args.title)}`;
        description = String(args.whyItFits || '');
        diffSummary = `Cost: ${String(args.costTier)} | Category: ${String(args.categoryId)}`;
      }

      return {
        id: proposalId,
        type: toolName as any,
        title,
        description,
        diffSummary,
        applied: false,
        payload: args,
        createdAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      replyText: chatResponse.replyText,
      proposals,
    });
  } catch (error: unknown) {
    SafeLogger.error('Chat assistant error', error);
    return NextResponse.json(
      {
        replyText:
          'I apologize, but I encountered an issue processing your request right now. You can continue managing your timeline and budget directly.',
        proposals: [],
      },
      { status: 200 }, // Graceful degradation in UI
    );
  }
}
