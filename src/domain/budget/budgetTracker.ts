import { BudgetAllocation, BudgetCategory, Paise, toPaise } from '../types';

export interface OverspendAlert {
  categoryId: string;
  categoryName: string;
  allocatedPaise: Paise;
  spentPaise: Paise;
  overspendPaise: Paise;
  overspendPercent: number;
  severity: 'warning' | 'critical';
  accessibleMessage: string;
  iconName: string;
}

export interface BudgetSummary {
  totalBudgetPaise: Paise;
  contingencyPaise: Paise;
  totalAllocatedPaise: Paise;
  totalSpentPaise: Paise;
  remainingPaise: Paise;
  isOverBudget: boolean;
  overBudgetPaise: Paise;
  costPerGuestPaise: Paise;
  categoryAlerts: OverspendAlert[];
}

export function calculateBudgetSummary(
  budget: BudgetAllocation,
  guestCount: number,
): BudgetSummary {
  const safeGuestCount = Math.max(1, guestCount);
  let totalSpent = 0;
  let totalAllocated = budget.contingencyPaise;
  const categoryAlerts: OverspendAlert[] = [];

  for (const cat of budget.categories) {
    totalSpent += cat.spentPaise;
    totalAllocated += cat.allocatedPaise;

    if (cat.spentPaise > cat.allocatedPaise) {
      const overspend = cat.spentPaise - cat.allocatedPaise;
      const overspendPercent =
        cat.allocatedPaise > 0
          ? Math.round((overspend / cat.allocatedPaise) * 100)
          : 100;

      const severity: 'warning' | 'critical' = overspendPercent >= 20 ? 'critical' : 'warning';
      const iconName = severity === 'critical' ? 'AlertTriangle' : 'AlertCircle';

      categoryAlerts.push({
        categoryId: cat.id,
        categoryName: cat.name,
        allocatedPaise: cat.allocatedPaise,
        spentPaise: cat.spentPaise,
        overspendPaise: toPaise(overspend),
        overspendPercent,
        severity,
        accessibleMessage: `Alert: ${cat.name} is over budget by ${overspendPercent}% (${(overspend / 100).toLocaleString('en-IN', { style: 'currency', currency: budget.currency })}).`,
        iconName,
      });
    }
  }

  const totalSpentPaise = toPaise(totalSpent);
  const totalAllocatedPaise = toPaise(totalAllocated);
  const remaining = budget.totalBudgetPaise - totalSpentPaise;
  const isOverBudget = remaining < 0;
  const overBudgetPaise = toPaise(isOverBudget ? Math.abs(remaining) : 0);
  const remainingPaise = toPaise(Math.max(0, remaining));

  const costPerGuestPaise = toPaise(
    Math.round(budget.totalBudgetPaise / safeGuestCount),
  );

  return {
    totalBudgetPaise: budget.totalBudgetPaise,
    contingencyPaise: budget.contingencyPaise,
    totalAllocatedPaise,
    totalSpentPaise,
    remainingPaise,
    isOverBudget,
    overBudgetPaise,
    costPerGuestPaise,
    categoryAlerts,
  };
}

/**
 * Live what-if simulation: updates budget total or guest count and re-computes splits.
 */
export function simulateBudgetWhatIf(
  currentBudget: BudgetAllocation,
  newTotalPaise: Paise,
  newGuestCount: number,
): {
  simulatedBudget: BudgetAllocation;
  summary: BudgetSummary;
} {
  const contingencyPercent = currentBudget.contingencyPercent || 10;
  const newContingencyPaise = toPaise(
    Math.round((newTotalPaise * contingencyPercent) / 100),
  );
  const newAllocatablePaise = newTotalPaise - newContingencyPaise;

  const currentAllocatableSum = currentBudget.categories.reduce(
    (sum, c) => sum + c.allocatedPaise,
    0,
  );

  const updatedCategories: BudgetCategory[] = currentBudget.categories.map(cat => {
    const ratio = currentAllocatableSum > 0 ? cat.allocatedPaise / currentAllocatableSum : 1 / currentBudget.categories.length;
    const newAllocated = toPaise(Math.round(newAllocatablePaise * ratio));
    return {
      ...cat,
      allocatedPaise: newAllocated,
    };
  });

  const simulatedBudget: BudgetAllocation = {
    ...currentBudget,
    totalBudgetPaise: newTotalPaise,
    contingencyPaise: newContingencyPaise,
    categories: updatedCategories,
  };

  const summary = calculateBudgetSummary(simulatedBudget, newGuestCount);

  return {
    simulatedBudget,
    summary,
  };
}
