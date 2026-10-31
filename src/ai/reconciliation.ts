import { BUDGET_TEMPLATES } from '../templates/budgetTemplates';
import { TASK_TEMPLATES } from '../templates/taskTemplates';
import { proportionalSplit } from '../domain/budget/proportionalSplit';
import { RawTaskInput, scheduleTimeline } from '../domain/timeline/backScheduler';
import { sanitizeVendorSuggestions } from '../domain/vendors/vendorModel';
import { IntakeWizardInput, ValidatedEventPlan } from '../domain/validators';
import { AIPlanGenerationOutput } from './types';
import { EventIdea, EventTask, toPaise, VendorItem } from '../domain/types';

export function reconcileAIOutputToPlan(
  aiOutput: AIPlanGenerationOutput,
  input: IntakeWizardInput,
  currentDateStr?: string,
): ValidatedEventPlan {
  const eventType = input.eventType;
  const categoriesTemplate = BUDGET_TEMPLATES[eventType] ?? BUDGET_TEMPLATES.other;
  const rawTasksTemplate = TASK_TEMPLATES[eventType] ?? TASK_TEMPLATES.other;

  // 1. Reconcile Budget
  const totalBudgetPaise = toPaise(Math.round(input.totalBudgetRupees * 100));

  // Merge AI suggested weights with category templates
  const categoryWeights = categoriesTemplate.map(cat => {
    const aiWeight = aiOutput.categoryWeights.find(w => w.categoryId === cat.id);
    return {
      id: cat.id,
      weight: aiWeight ? aiWeight.suggestedWeight : cat.defaultPercent,
      rationale: aiWeight?.rationale ?? cat.description,
    };
  });

  // Largest-Remainder proportional split enforcing exact sum
  const splitResult = proportionalSplit(
    totalBudgetPaise,
    categoriesTemplate,
    categoryWeights,
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

  // 2. Reconcile Tasks (Merge template milestones with AI personalized tasks)
  const taskInputs: RawTaskInput[] = [
    ...rawTasksTemplate.map(t => ({
      ...t,
      source: 'template' as const,
    })),
  ];

  // Add and deduplicate AI proposed tasks
  const existingTitles = new Set(taskInputs.map(t => t.title.toLowerCase().trim()));
  aiOutput.personalizedTasks.forEach((aiTask, idx) => {
    const cleanTitle = aiTask.title.trim();
    if (!existingTitles.has(cleanTitle.toLowerCase())) {
      existingTitles.add(cleanTitle.toLowerCase());
      taskInputs.push({
        id: `ai-task-${idx + 1}`,
        title: cleanTitle,
        description: aiTask.description,
        categoryId: aiTask.categoryId,
        dayOffset: aiTask.dayOffset,
        timeOfDay: aiTask.timeOfDay,
        estimatedDurationMinutes: aiTask.estimatedDurationMinutes,
        dependencies: aiTask.dependencies,
        priority: aiTask.priority,
        source: 'ai',
      });
    }
  });

  // Schedule timeline with cycle detection, back-scheduling, and compression
  const scheduledTimeline = scheduleTimeline(input.eventDate, taskInputs, currentDateStr);

  // 3. Reconcile Vendors (Enforce vendor safety rules: NO synthetic phone numbers or fake names)
  const vendorGuidanceMap = new Map(aiOutput.vendorGuidance.map(v => [v.categoryId, v]));
  const vendors: VendorItem[] = categoriesTemplate.map((cat, idx) => {
    const aiGuidance = vendorGuidanceMap.get(cat.id);
    const questions = (aiGuidance?.questionsToAsk ?? [
      'What are your primary package inclusions and payment milestones?',
      'Are there overtime or cancellation surcharges?',
    ]).map(sanitizeVendorSuggestions);

    const redFlags = (aiGuidance?.contractRedFlags ?? [
      'Unclear overtime penalty fees without prior notice.',
      'Refusal to provide written receipt or service warranty.',
    ]).map(sanitizeVendorSuggestions);

    const inquiryDraft = sanitizeVendorSuggestions(
      aiGuidance?.inquiryDraft ??
        `Hello, we are planning our ${eventType} on ${input.eventDate} in ${input.city} for ${input.guestCount} guests. We are interested in ${cat.name} services. Please share your brochure and pricing tiers.`,
    );

    return {
      id: `vendor-${cat.id}-${idx + 1}`,
      categoryId: cat.id,
      categoryName: cat.name,
      serviceName: aiGuidance?.serviceName ?? `${cat.name} Coordination`,
      status: 'to_contact',
      questionsToAsk: questions,
      contractRedFlags: redFlags,
      inquiryDraft,
    };
  });

  // 4. Reconcile Ideas
  const ideas: EventIdea[] = aiOutput.creativeIdeas.map((idea, idx) => {
    const matchingCat = categoriesTemplate.find(c => c.id === idea.categoryId);
    return {
      id: `idea-${idx + 1}`,
      categoryId: idea.categoryId,
      categoryName: matchingCat?.name ?? 'Celebration Styling',
      title: idea.title,
      description: idea.description,
      whyItFits: idea.whyItFits,
      costTier: idea.costTier,
      estimatedBudgetPercent: idea.estimatedBudgetPercent,
      pinned: idx < 2, // Pin top 2 by default
      tags: idea.tags,
    };
  });

  const nowISO = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    title: aiOutput.eventSummary || `${input.city} ${eventType.toUpperCase()} Celebration`,
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
    ideas,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
}
