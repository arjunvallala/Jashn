import { describe, it, expect } from 'vitest';
import { reconcileAIOutputToPlan } from '@/ai/reconciliation';
import { AIPlanGenerationOutput } from '@/ai/types';
import { IntakeWizardInput } from '@/domain/validators';

describe('AI Reconciliation Engine (Invariant Verification)', () => {
  const sampleInput: IntakeWizardInput = {
    eventType: 'wedding',
    eventDate: '2026-12-25',
    city: 'Bengaluru',
    guestCount: 300,
    totalBudgetRupees: 2000000, // 20 Lakhs
    currency: 'INR',
    styleVibe: 'Garden Eco-Chic with Traditional Carnatic Music',
    mustHaves: ['Outdoor amphitheater pheras'],
    constraints: {
      dietary: ['South Indian banana leaf feast'],
      accessibility: ['Tactile paving and wheelchair pathways'],
      cultureTraditions: ['Traditional morning Muhurtham'],
      neutralPreferences: [],
    },
    language: 'en',
  };

  const goldenAIOutput: AIPlanGenerationOutput = {
    eventSummary: 'An eco-conscious garden wedding celebrating timeless traditions.',
    categoryWeights: [
      // Extremely unbalanced weights proposed by AI (totaling 1.8 instead of 1.0)
      { categoryId: 'venue_decor', suggestedWeight: 0.8, rationale: 'Botanical garden setup' },
      { categoryId: 'food_beverage', suggestedWeight: 0.6, rationale: 'Authentic South Indian dining' },
      { categoryId: 'photography_video', suggestedWeight: 0.2, rationale: 'Natural lighting documentation' },
      { categoryId: 'attire_beauty', suggestedWeight: 0.1, rationale: 'Silk styling' },
      { categoryId: 'music_entertainment', suggestedWeight: 0.05, rationale: 'Carnatic ensemble' },
      { categoryId: 'logistics_invites', suggestedWeight: 0.05, rationale: 'Plantable invitations' },
    ],
    personalizedTasks: [
      {
        title: 'Book Outdoor Botanical Amphitheater',
        description: 'Verify sound permits and wheelchair ramps.',
        categoryId: 'venue_decor',
        dayOffset: -180,
        priority: 'critical',
        dependencies: [],
      },
      // Hallucinated date far in past (-500 days)
      {
        title: 'Initial Consultation with Florist',
        description: 'Floral mood board review.',
        categoryId: 'venue_decor',
        dayOffset: -500,
        priority: 'medium',
        dependencies: [],
      },
    ],
    vendorGuidance: [
      {
        categoryId: 'venue_decor',
        serviceName: 'Garden Amphitheater',
        // Hallucinated phone numbers from AI
        questionsToAsk: [
          'What is the curfew for music?',
          'Call manager at +91 98765 43210 for gate security clearance.',
        ],
        contractRedFlags: [
          'Unilateral cancellation clauses.',
          'Verify with agent on 9845012345 before signing.',
        ],
        inquiryDraft: 'Hello, please send booking options. Reach out to +1 555-0199 for details.',
      },
    ],
    creativeIdeas: [
      {
        categoryId: 'venue_decor',
        title: 'Potted Herb Table Centerpieces',
        description: 'Living rosemary and basil plants that guests can take home.',
        whyItFits: 'Zero floral waste and fits eco-garden theme.',
        costTier: '₹',
        estimatedBudgetPercent: 2,
        tags: ['eco', 'decor'],
      },
    ],
  };

  it('proves budget sum invariant: sum(categories) + contingency === totalBudgetPaise exactly', () => {
    const plan = reconcileAIOutputToPlan(goldenAIOutput, sampleInput, '2026-01-01');

    const sumCategories = plan.budget.categories.reduce((acc, c) => acc + c.allocatedPaise, 0);
    const totalAllocated = sumCategories + plan.budget.contingencyPaise;

    expect(totalAllocated).toBe(plan.budget.totalBudgetPaise);
    expect(plan.budget.totalBudgetPaise).toBe(200000000); // 20 Lakhs in paise
    expect(plan.budget.contingencyPaise).toBe(20000000); // 10% contingency protected
  });

  it('proves date invariant: all tasks are >= currentDate and <= eventDate', () => {
    const currentDate = '2026-06-01';
    const plan = reconcileAIOutputToPlan(goldenAIOutput, sampleInput, currentDate);

    for (const task of plan.tasks) {
      expect(task.dueDate >= currentDate).toBe(true);
      if (task.dayOffset <= 0) {
        expect(task.dueDate <= sampleInput.eventDate).toBe(true);
      }
    }
  });

  it('proves vendor safety rule: strips hallucinated phone numbers and contact details', () => {
    const plan = reconcileAIOutputToPlan(goldenAIOutput, sampleInput, '2026-01-01');

    const venueVendor = plan.vendors.find(v => v.categoryId === 'venue_decor')!;
    expect(venueVendor).toBeDefined();

    // Verify phone numbers were redacted from questions
    const questionText = venueVendor.questionsToAsk.join(' ');
    expect(questionText).not.toContain('98765 43210');
    expect(questionText).toContain('[Phone Number Redacted - Verify with Vendor Directly]');

    // Verify phone numbers redacted from red flags
    const redFlagText = venueVendor.contractRedFlags.join(' ');
    expect(redFlagText).not.toContain('9845012345');

    // Verify inquiry draft has phone redacted
    expect(venueVendor.inquiryDraft).not.toContain('555-0199');
  });
});
