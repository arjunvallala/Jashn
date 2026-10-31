import { z } from 'zod';

export type EventType = 'wedding' | 'birthday' | 'community' | 'other';
export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';
export type LanguageCode = 'en' | 'hi' | 'te';

/**
 * Minor currency units (e.g. Paise for INR, Cents for USD).
 * Always an integer, never a float.
 */
export type Paise = number & { readonly __brand: unique symbol };

export function toPaise(value: number): Paise {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Paise must be a safe integer, received: ${value}`);
  }
  return value as Paise;
}

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskPhase =
  | '12_months_out'
  | '6_months_out'
  | '3_months_out'
  | '1_month_out'
  | 'week_of'
  | 'day_of'
  | 'after';

export type VendorStatus = 'to_contact' | 'quoted' | 'negotiating' | 'booked' | 'paid';

export type CostTier = '₹' | '₹₹' | '₹₹₹';

export interface BudgetCategory {
  id: string;
  name: string;
  iconName: string;
  minPercent: number;
  maxPercent: number;
  weight: number; // Normalized weight (0 to 1)
  allocatedPaise: Paise;
  spentPaise: Paise;
  rationale?: string;
}

export interface BudgetAllocation {
  totalBudgetPaise: Paise;
  contingencyPaise: Paise;
  contingencyPercent: number; // default 5-10%
  currency: SupportedCurrency;
  categories: BudgetCategory[];
}

export interface EventTask {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  phase: TaskPhase;
  dueDate: string; // ISO date YYYY-MM-DD
  dayOffset: number; // negative before event, 0 day of, positive after
  timeOfDay?: string; // HH:mm for day-of run-of-show
  estimatedDurationMinutes?: number;
  dependencies: string[]; // task IDs that must be completed first
  completed: boolean;
  priority: TaskPriority;
  isCriticalPath: boolean;
  source: 'template' | 'ai' | 'user';
}

export interface VendorItem {
  id: string;
  categoryId: string;
  categoryName: string;
  serviceName: string; // e.g. "Catering", "Photography"
  notes?: string;
  status: VendorStatus;
  quoteAmountPaise?: Paise;
  depositAmountPaise?: Paise;
  depositDueDate?: string; // YYYY-MM-DD
  questionsToAsk: string[];
  contractRedFlags: string[];
  inquiryDraft: string;
}

export interface EventIdea {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  whyItFits: string;
  costTier: CostTier;
  estimatedBudgetPercent: number;
  pinned: boolean;
  tags: string[];
}

export interface PlanConstraints {
  dietary: string[];
  accessibility: string[];
  cultureTraditions: string[];
  neutralPreferences: string[];
}

export interface EventPlan {
  id: string;
  schemaVersion: number;
  title: string;
  eventType: EventType;
  eventDate: string; // YYYY-MM-DD
  city: string;
  guestCount: number;
  styleVibe: string;
  mustHaves: string[];
  constraints: PlanConstraints;
  language: LanguageCode;
  budget: BudgetAllocation;
  tasks: EventTask[];
  vendors: VendorItem[];
  ideas: EventIdea[];
  createdAt: string;
  updatedAt: string;
}

export type ProposalType =
  | 'propose_budget_change'
  | 'add_task'
  | 'update_vendor_status'
  | 'suggest_ideas';

export interface PlanProposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  diffSummary: string;
  applied: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
}
