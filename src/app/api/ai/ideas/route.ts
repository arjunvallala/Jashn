import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAndValidateJsonBody, enforceAIRateLimit } from '@/lib/apiSecurity';
import { getGeminiClient } from '@/ai/clientFactory';
import { buildSystemInstruction, stripPII } from '@/ai/prompts';
import { LanguageCodeSchema } from '@/domain/validators';
import { AIIdeaProposalSchema } from '@/ai/types';
import { SafeLogger } from '@/lib/logger';

const IdeasRefineRequestSchema = z.object({
  categoryId: z.string().max(50),
  categoryName: z.string().max(100),
  eventType: z.string().max(50),
  styleVibe: z.string().max(200),
  constraintsSummary: z.string().max(500),
  refinementChip: z.enum(['cheaper', 'more_traditional', 'more_modern', 'more_accessible', 'general']).default('general'),
  language: LanguageCodeSchema.default('en'),
});

const IdeasResponseSchema = z.object({
  ideas: z.array(AIIdeaProposalSchema).min(1).max(6),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceAIRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await parseAndValidateJsonBody(req, IdeasRefineRequestSchema);
  if (validation.errorResponse) return validation.errorResponse;

  const { categoryId, categoryName, eventType, styleVibe, constraintsSummary, refinementChip, language } = validation.data;
  const activeChip = refinementChip || 'general';

  try {
    const client = getGeminiClient();
    const systemPrompt = buildSystemInstruction(language);

    const chipDirectives: Record<string, string> = {
      cheaper: 'PRIORITIZE low-cost (₹), high-impact DIY, rental, or smart substitution ideas.',
      more_traditional: 'PRIORITIZE culturally authentic customs, heirloom elements, and time-honored rituals.',
      more_modern: 'PRIORITIZE contemporary aesthetic, minimalist styling, and digital/fusion touches.',
      more_accessible: 'PRIORITIZE sensory-friendly, step-free, all-abilities, and elder-friendly options.',
      general: 'Generate fresh, creative, and memorable ideas.',
    };

    const userPrompt = `Generate 3 to 4 creative ideas for category "${categoryName}" in a ${eventType}.
<untrusted_user_data>
Category ID: ${categoryId}
Style Vibe: ${stripPII(styleVibe)}
Constraints: ${stripPII(constraintsSummary)}
Refinement Direction: ${chipDirectives[activeChip] ?? chipDirectives.general}
</untrusted_user_data>`;

    const result = await client.generateStructured(userPrompt, systemPrompt, IdeasResponseSchema);

    const mappedIdeas = result.ideas.map((idea, idx) => ({
      id: `refined-idea-${Date.now()}-${idx}`,
      categoryId,
      categoryName,
      title: idea.title,
      description: idea.description,
      whyItFits: idea.whyItFits,
      costTier: idea.costTier,
      estimatedBudgetPercent: idea.estimatedBudgetPercent,
      pinned: false,
      tags: [...idea.tags, activeChip],
    }));

    return NextResponse.json({ ideas: mappedIdeas });
  } catch (error: unknown) {
    SafeLogger.error('Error generating refined ideas', error);
    return NextResponse.json(
      {
        ideas: [
          {
            id: `fallback-idea-${Date.now()}`,
            categoryId,
            categoryName,
            title: `Refined Concept for ${categoryName}`,
            description: `A customized approach focusing on ${activeChip.replace('_', ' ')} elements.`,
            whyItFits: 'Customized based on your selected preference.',
            costTier: '₹₹',
            estimatedBudgetPercent: 3,
            pinned: false,
            tags: [activeChip],
          },
        ],
      },
      { status: 200 },
    );
  }
}
