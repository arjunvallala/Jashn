import { NextRequest, NextResponse } from 'next/server';
import { IntakeWizardSchema, IntakeWizardInput } from '@/domain/validators';
import { EventType } from '@/domain/types';
import { parseAndValidateJsonBody, enforceAIRateLimit } from '@/lib/apiSecurity';
import { getGeminiClient } from '@/ai/clientFactory';
import { buildPlanGenerationPrompt, buildSystemInstruction } from '@/ai/prompts';
import { AIPlanGenerationOutputSchema } from '@/ai/types';
import { reconcileAIOutputToPlan } from '@/ai/reconciliation';
import { generateDeterministicFallbackPlan } from '@/ai/fallback';
import { InMemoryAICache, globalAICache } from '@/ai/cache';
import { BUDGET_TEMPLATES } from '@/templates/budgetTemplates';
import { SafeLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  // 1. Enforce rate limiting
  const rateLimitResponse = enforceAIRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Validate JSON body (< 32KB, Zod schema)
  const validation = await parseAndValidateJsonBody(req, IntakeWizardSchema);
  if (validation.errorResponse) return validation.errorResponse;

  const intakeData = validation.data as unknown as IntakeWizardInput;

  // 3. Check in-memory request cache
  const cacheKey = InMemoryAICache.hashInput(intakeData);
  const cachedPlan = globalAICache.get(cacheKey);
  if (cachedPlan) {
    SafeLogger.info('Plan returned from in-memory cache');
    return NextResponse.json({
      plan: cachedPlan,
      isFallback: false,
      cached: true,
    });
  }

  // 4. Call Gemini client with single retry repair
  try {
    const client = getGeminiClient();
    const categoriesTemplate = BUDGET_TEMPLATES[intakeData.eventType as EventType] ?? BUDGET_TEMPLATES.other;
    const systemPrompt = buildSystemInstruction(intakeData.language);
    const userPrompt = buildPlanGenerationPrompt(intakeData, categoriesTemplate);

    const rawAIOutput = await client.generateStructured(
      userPrompt,
      systemPrompt,
      AIPlanGenerationOutputSchema,
    );

    // 5. Reconcile to strict domain invariants
    const reconciledPlan = reconcileAIOutputToPlan(rawAIOutput as any, intakeData);

    // Store in cache
    globalAICache.set(cacheKey, reconciledPlan);

    return NextResponse.json({
      plan: reconciledPlan,
      isFallback: false,
      cached: false,
    });
  } catch (error: unknown) {
    SafeLogger.warn('Gemini plan generation failed or timed out. Falling back to deterministic plan.', {
      message: error instanceof Error ? error.message : String(error),
    });

    // 6. Graceful fallback to deterministic template plan
    const fallbackPlan = generateDeterministicFallbackPlan(intakeData);

    return NextResponse.json({
      plan: fallbackPlan,
      isFallback: true,
      fallbackNotice: 'AI service temporarily unavailable. Generated a balanced offline template plan.',
      cached: false,
    });
  }
}
