import { describe, it, expect } from 'vitest';
import { MockGeminiClient } from '@/ai/mockClient';
import { AIPlanGenerationOutputSchema } from '@/ai/types';
import { generateDeterministicFallbackPlan } from '@/ai/fallback';
import { IntakeWizardInput } from '@/domain/validators';

describe('AI Contract & Resilience Tests with MockClient', () => {
  const sampleInput: IntakeWizardInput = {
    eventType: 'wedding',
    eventDate: '2026-11-20',
    city: 'Mumbai',
    guestCount: 200,
    totalBudgetRupees: 1000000,
    currency: 'INR',
    styleVibe: 'Contemporary Seaside Minimalist',
    mustHaves: ['Sunset vows by the beach'],
    constraints: {
      dietary: ['Jain vegetarian option'],
      accessibility: ['Wheelchair accessible beach ramp'],
      cultureTraditions: [],
      neutralPreferences: [],
    },
    language: 'en',
  };

  const validAIData = {
    eventSummary: 'A coastal sunset celebration reflecting warm family bonding.',
    categoryWeights: [
      { categoryId: 'venue_decor', suggestedWeight: 0.4, rationale: 'Open-air beachfront setup.' },
      { categoryId: 'food_beverage', suggestedWeight: 0.35, rationale: 'Coastal seafood & Jain counters.' },
      { categoryId: 'photography_video', suggestedWeight: 0.15, rationale: 'Sunset lighting photography.' },
      { categoryId: 'music_entertainment', suggestedWeight: 0.1, rationale: 'Live acoustic saxophonist.' },
    ],
    personalizedTasks: [
      {
        title: 'Obtain Beach Municipal Permission',
        description: 'Secure coastal regulation zone permit.',
        categoryId: 'venue_decor',
        dayOffset: -60,
        priority: 'critical' as const,
        dependencies: [],
      },
    ],
    vendorGuidance: [
      {
        categoryId: 'venue_decor',
        serviceName: 'Beachfront Setup',
        questionsToAsk: ['Is there a tidal water safety buffer?'],
        contractRedFlags: ['No backup indoor hall in case of rain.'],
        inquiryDraft: 'Hello, please share your seaside lawn package.',
      },
    ],
    creativeIdeas: [
      {
        categoryId: 'venue_decor',
        title: 'Seashell Place Card Favors',
        description: 'Locally sourced polished shells with calligraphy names.',
        whyItFits: 'Perfect for seaside vibe.',
        costTier: '₹' as const,
        estimatedBudgetPercent: 2,
        tags: ['beach', 'favors'],
      },
    ],
  };

  it('successfully returns and parses valid structured AI output', async () => {
    const mockClient = new MockGeminiClient({ mode: 'success', data: validAIData });
    const result = await mockClient.generateStructured('prompt', 'system', AIPlanGenerationOutputSchema);

    expect(result.eventSummary).toContain('coastal sunset');
    expect(result.categoryWeights).toHaveLength(4);
    expect(mockClient.callCount).toBe(1);
  });

  it('rejects malformed JSON and falls back to deterministic template plan', async () => {
    const mockClient = new MockGeminiClient({ mode: 'malformed_json' });

    let plan;
    try {
      await mockClient.generateStructured('prompt', 'system', AIPlanGenerationOutputSchema);
    } catch {
      // Deterministic fallback path
      plan = generateDeterministicFallbackPlan(sampleInput);
    }

    expect(plan).toBeDefined();
    expect(plan!.budget.totalBudgetPaise).toBe(100000000); // exactly 10 Lakhs in paise
    expect(plan!.tasks.length).toBeGreaterThan(0);
    expect(plan!.budget.categories.length).toBeGreaterThan(0);
  });

  it('rejects schema-violating output and falls back cleanly', async () => {
    const mockClient = new MockGeminiClient({ mode: 'schema_violation' });

    let fallbackPlan;
    try {
      await mockClient.generateStructured('prompt', 'system', AIPlanGenerationOutputSchema);
    } catch {
      fallbackPlan = generateDeterministicFallbackPlan(sampleInput);
    }

    expect(fallbackPlan).toBeDefined();
    expect(fallbackPlan!.eventType).toBe('wedding');
  });

  it('handles request timeouts (>5000ms) and falls back safely', async () => {
    const mockClient = new MockGeminiClient({ mode: 'timeout', delayMs: 10 });

    let fallbackPlan;
    try {
      await mockClient.generateStructured('prompt', 'system', AIPlanGenerationOutputSchema);
    } catch (err: any) {
      expect(err.message).toContain('timed out');
      fallbackPlan = generateDeterministicFallbackPlan(sampleInput);
    }

    expect(fallbackPlan).toBeDefined();
    expect(fallbackPlan!.city).toBe('Mumbai');
  });

  it('handles HTTP 429 rate limit or 500 server error and falls back', async () => {
    const mockClient = new MockGeminiClient({
      mode: 'http_error',
      statusCode: 429,
      statusText: 'Too Many Requests',
    });

    let fallbackPlan;
    try {
      await mockClient.generateStructured('prompt', 'system', AIPlanGenerationOutputSchema);
    } catch (err: any) {
      expect(err.status).toBe(429);
      fallbackPlan = generateDeterministicFallbackPlan(sampleInput);
    }

    expect(fallbackPlan).toBeDefined();
    expect(fallbackPlan!.vendors.length).toBeGreaterThan(0);
  });
});
