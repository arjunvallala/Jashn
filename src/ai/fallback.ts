import { BUDGET_TEMPLATES } from '../templates/budgetTemplates';
import { TASK_TEMPLATES } from '../templates/taskTemplates';
import { createInitialVendors } from '../templates/vendorTemplates';
import { proportionalSplit } from '../domain/budget/proportionalSplit';
import { scheduleTimeline } from '../domain/timeline/backScheduler';
import { IntakeWizardInput, ValidatedEventPlan } from '../domain/validators';
import { EventIdea, toPaise } from '../domain/types';

export function generateDeterministicFallbackPlan(
  input: IntakeWizardInput,
  currentDateStr?: string,
): ValidatedEventPlan {
  const eventType = input.eventType;
  const categoriesTemplate = BUDGET_TEMPLATES[eventType] ?? BUDGET_TEMPLATES.other;
  const rawTasksTemplate = TASK_TEMPLATES[eventType] ?? TASK_TEMPLATES.other;

  // Convert rupees to paise
  const totalBudgetPaise = toPaise(Math.round(input.totalBudgetRupees * 100));

  // Default weights from template
  const defaultWeights = categoriesTemplate.map(c => ({
    id: c.id,
    weight: c.defaultPercent,
    rationale: c.description,
  }));

  // Proportional allocation via largest-remainder method
  const splitResult = proportionalSplit(
    totalBudgetPaise,
    categoriesTemplate,
    defaultWeights,
    10, // 10% contingency
  );

  const budgetCategories = categoriesTemplate.map(cat => {
    const alloc = splitResult.allocations.find(a => a.id === cat.id);
    return {
      id: cat.id,
      name: cat.name,
      iconName: cat.iconName,
      minPercent: cat.minPercent,
      maxPercent: cat.maxPercent,
      weight: alloc ? alloc.weight : cat.defaultPercent / 100,
      allocatedPaise: alloc ? alloc.allocatedPaise : toPaise(0),
      spentPaise: toPaise(0),
      rationale: alloc?.rationale ?? cat.description,
    };
  });

  // Back-schedule tasks
  const scheduledTimeline = scheduleTimeline(
    input.eventDate,
    rawTasksTemplate.map(t => ({
      ...t,
      source: 'template' as const,
    })),
    currentDateStr,
  );

  // Generate initial vendor pipeline
  const vendors = createInitialVendors(eventType);

  // Generate baseline ideas matching constraints
  const defaultIdeas: EventIdea[] = [
    {
      id: 'idea-fallback-1',
      categoryId: categoriesTemplate[0]?.id ?? 'venue_decor',
      categoryName: categoriesTemplate[0]?.name ?? 'Venue & Décor',
      title: `${input.styleVibe} Thematic Setup`,
      description: `A celebratory ambiance aligned with your chosen theme in ${input.city}.`,
      whyItFits: `Directly tailored to your requested aesthetic: "${input.styleVibe}".`,
      costTier: '₹₹',
      estimatedBudgetPercent: 5,
      pinned: true,
      tags: ['thematic', 'decor'],
    },
    {
      id: 'idea-fallback-2',
      categoryId: categoriesTemplate[1]?.id ?? 'food_beverage',
      categoryName: categoriesTemplate[1]?.name ?? 'Catering & Dining',
      title: 'Inclusive Culinary Showcase',
      description: `A custom menu incorporating dietary preferences (${input.constraints.dietary.join(', ') || 'Standard & Vegetarian'}).`,
      whyItFits: 'Ensures every guest dines comfortably with zero dietary confusion.',
      costTier: '₹₹',
      estimatedBudgetPercent: 4,
      pinned: true,
      tags: ['dining', 'inclusive'],
    },
  ];

  const nowISO = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    title: `${input.city} ${eventType.toUpperCase()} Celebration`,
    eventType: input.eventType,
    eventDate: input.eventDate,
    city: input.city,
    guestCount: input.guestCount,
    styleVibe: input.styleVibe,
    mustHaves: input.mustHaves,
    constraints: input.constraints,
    language: input.language,
    budget: {
      totalBudgetPaise,
      contingencyPaise: splitResult.contingencyPaise,
      contingencyPercent: 10,
      currency: input.currency,
      categories: budgetCategories,
    },
    tasks: scheduledTimeline.tasks,
    vendors,
    ideas: defaultIdeas,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
}
