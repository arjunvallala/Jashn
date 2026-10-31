import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAndValidateJsonBody, enforceAIRateLimit } from '@/lib/apiSecurity';
import { getGeminiClient } from '@/ai/clientFactory';
import { buildSystemInstruction } from '@/ai/prompts';
import { LanguageCodeSchema } from '@/domain/validators';
import { SafeLogger } from '@/lib/logger';

const OptimizeRequestSchema = z.object({
  totalBudgetRupees: z.number().positive(),
  totalSpentRupees: z.number().nonnegative(),
  deficitRupees: z.number().positive(),
  currency: z.string().default('INR'),
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      allocatedRupees: z.number(),
      spentRupees: z.number(),
    }),
  ),
  language: LanguageCodeSchema.default('en'),
});

const OptimizationSuggestionSchema = z.object({
  overallStrategy: z.string().max(300),
  trims: z.array(
    z.object({
      categoryId: z.string(),
      categoryName: z.string(),
      currentAllocatedRupees: z.number(),
      proposedNewAllocatedRupees: z.number(),
      savingsRupees: z.number(),
      actionableTrimTip: z.string().max(250),
    }),
  ),
});

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceAIRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const validation = await parseAndValidateJsonBody(req, OptimizeRequestSchema);
  if (validation.errorResponse) return validation.errorResponse;

  const { deficitRupees, currency, categories, language } = validation.data;

  try {
    const client = getGeminiClient();
    const systemPrompt = buildSystemInstruction(language);

    const prompt = `Analyze this celebration budget deficit of ${currency} ${deficitRupees.toLocaleString()} and recommend specific, actionable reductions across categories to restore balance.
<untrusted_user_data>
Deficit Amount: ${deficitRupees} ${currency}
Current Category Breakdown:
${categories.map(c => `- ${c.name} (${c.id}): Allocated ${currency} ${c.allocatedRupees}, Spent ${currency} ${c.spentRupees}`).join('\n')}
</untrusted_user_data>

Suggest concrete trims totaling approximately the deficit amount with practical tips.`;

    const result = await client.generateStructured(prompt, systemPrompt, OptimizationSuggestionSchema);

    return NextResponse.json({ optimization: result });
  } catch (error: unknown) {
    SafeLogger.error('Budget optimization analysis error', error);

    // Deterministic fallback: trim proportionally from highest non-zero categories
    const sortedCats = [...categories].sort((a, b) => b.allocatedRupees - a.allocatedRupees);
    const topCat = sortedCats[0];
    const topCatName = topCat?.name ?? 'Venue & Décor';
    const topCatId = topCat?.id ?? 'venue_decor';
    const currentAlloc = topCat?.allocatedRupees ?? 500000;
    const trimAmount = Math.min(deficitRupees, Math.round(currentAlloc * 0.15));

    return NextResponse.json({
      optimization: {
        overallStrategy: 'Apply a disciplined 10-15% trim to high-overhead production and décor elements.',
        trims: [
          {
            categoryId: topCatId,
            categoryName: topCatName,
            currentAllocatedRupees: currentAlloc,
            proposedNewAllocatedRupees: Math.max(0, currentAlloc - trimAmount),
            savingsRupees: trimAmount,
            actionableTrimTip: 'Substitute custom stage fabrication with reusable modular arch frameworks and seasonal locally sourced flora.',
          },
        ],
      },
    });
  }
}
