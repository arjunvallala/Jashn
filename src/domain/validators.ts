import { z } from 'zod';

export const EventTypeSchema = z.enum(['wedding', 'birthday', 'community', 'other']);
export const SupportedCurrencySchema = z.enum(['INR', 'USD', 'EUR', 'GBP']);
export const LanguageCodeSchema = z.enum(['en', 'hi', 'te']);
export const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const TaskPhaseSchema = z.enum([
  '12_months_out',
  '6_months_out',
  '3_months_out',
  '1_month_out',
  'week_of',
  'day_of',
  'after',
]);
export const VendorStatusSchema = z.enum(['to_contact', 'quoted', 'negotiating', 'booked', 'paid']);
export const CostTierSchema = z.enum(['₹', '₹₹', '₹₹₹']);

/**
 * Strict intake wizard schema ensuring NO personal identifiers (phone, email) are collected,
 * with bounded lengths and array sizes.
 */
export const IntakeWizardSchema = z.object({
  eventType: EventTypeSchema,
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      val => {
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: 'Invalid calendar date' },
    ),
  city: z.string().trim().min(2).max(100),
  guestCount: z.number().int().min(1).max(50000),
  totalBudgetRupees: z.number().min(1000).max(1000000000), // In major currency units (INR default)
  currency: SupportedCurrencySchema.default('INR'),
  styleVibe: z.string().trim().min(2).max(200),
  mustHaves: z.array(z.string().trim().max(150)).max(20).default([]),
  constraints: z.object({
    dietary: z.array(z.string().trim().max(100)).max(15).default([]),
    accessibility: z.array(z.string().trim().max(100)).max(15).default([]),
    cultureTraditions: z.array(z.string().trim().max(100)).max(15).default([]),
    neutralPreferences: z.array(z.string().trim().max(100)).max(15).default([]),
  }),
  language: LanguageCodeSchema.default('en'),
});

export type IntakeWizardInput = z.infer<typeof IntakeWizardSchema>;

export const BudgetCategorySchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  iconName: z.string().min(1).max(50),
  minPercent: z.number().min(0).max(100),
  maxPercent: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  allocatedPaise: z.number().int().min(0),
  spentPaise: z.number().int().min(0),
  rationale: z.string().max(300).optional(),
});

export const BudgetAllocationSchema = z.object({
  totalBudgetPaise: z.number().int().min(0),
  contingencyPaise: z.number().int().min(0),
  contingencyPercent: z.number().min(0).max(50),
  currency: SupportedCurrencySchema,
  categories: z.array(BudgetCategorySchema).min(1).max(30),
});

export const EventTaskSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  categoryId: z.string().min(1).max(50),
  phase: TaskPhaseSchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOffset: z.number().int(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(1440).optional(),
  dependencies: z.array(z.string().max(64)).max(20).default([]),
  completed: z.boolean().default(false),
  priority: TaskPrioritySchema.default('medium'),
  isCriticalPath: z.boolean().default(false),
  source: z.enum(['template', 'ai', 'user']).default('template'),
});

export const VendorItemSchema = z.object({
  id: z.string().min(1).max(64),
  categoryId: z.string().min(1).max(50),
  categoryName: z.string().min(1).max(100),
  serviceName: z.string().min(1).max(100),
  notes: z.string().max(1000).optional(),
  status: VendorStatusSchema.default('to_contact'),
  quoteAmountPaise: z.number().int().min(0).optional(),
  depositAmountPaise: z.number().int().min(0).optional(),
  depositDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  questionsToAsk: z.array(z.string().max(300)).max(15).default([]),
  contractRedFlags: z.array(z.string().max(300)).max(15).default([]),
  inquiryDraft: z.string().max(2000).default(''),
});

export const EventIdeaSchema = z.object({
  id: z.string().min(1).max(64),
  categoryId: z.string().min(1).max(50),
  categoryName: z.string().min(1).max(100),
  title: z.string().min(1).max(150),
  description: z.string().max(1000),
  whyItFits: z.string().max(400),
  costTier: CostTierSchema,
  estimatedBudgetPercent: z.number().min(0).max(100),
  pinned: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const SCHEMA_VERSION = 1;

export const EventPlanSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  title: z.string().min(1).max(200),
  eventType: EventTypeSchema,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().min(1).max(100),
  guestCount: z.number().int().min(1),
  styleVibe: z.string().max(200),
  mustHaves: z.array(z.string().max(150)).max(20),
  constraints: z.object({
    dietary: z.array(z.string().max(100)).max(15),
    accessibility: z.array(z.string().max(100)).max(15),
    cultureTraditions: z.array(z.string().max(100)).max(15),
    neutralPreferences: z.array(z.string().max(100)).max(15),
  }),
  language: LanguageCodeSchema.default('en'),
  budget: BudgetAllocationSchema,
  tasks: z.array(EventTaskSchema).max(500),
  vendors: z.array(VendorItemSchema).max(100),
  ideas: z.array(EventIdeaSchema).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ValidatedEventPlan = z.infer<typeof EventPlanSchema>;
