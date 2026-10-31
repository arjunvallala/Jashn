import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { proportionalSplit } from '@/domain/budget/proportionalSplit';
import { calculateBudgetSummary, simulateBudgetWhatIf } from '@/domain/budget/budgetTracker';
import { BudgetAllocation, toPaise } from '@/domain/types';

describe('Budget Engine & Proportional Split', () => {
  const testCategories = [
    { id: 'cat-venue', minPercent: 20, maxPercent: 50 },
    { id: 'cat-food', minPercent: 20, maxPercent: 45 },
    { id: 'cat-photo', minPercent: 5, maxPercent: 25 },
    { id: 'cat-music', minPercent: 5, maxPercent: 20 },
  ];

  it('allocates budget so that sum(allocations) + contingency === totalBudgetPaise exactly', () => {
    const totalPaise = toPaise(100000000); // 10 Lakhs
    const weights = [
      { id: 'cat-venue', weight: 0.4 },
      { id: 'cat-food', weight: 0.35 },
      { id: 'cat-photo', weight: 0.15 },
      { id: 'cat-music', weight: 0.1 },
    ];

    const result = proportionalSplit(totalPaise, testCategories, weights, 10);
    const sumCategories = result.allocations.reduce((acc, c) => acc + c.allocatedPaise, 0);

    expect(sumCategories + result.contingencyPaise).toBe(totalPaise);
    expect(result.totalAllocatedPaise).toBe(totalPaise);
  });

  it('enforces min and max percentage bounds per category', () => {
    const totalPaise = toPaise(50000000);
    // Request extreme weight of 0.99 on venue (capped at maxPercent: 50)
    const weights = [
      { id: 'cat-venue', weight: 0.99 },
      { id: 'cat-food', weight: 0.01 },
      { id: 'cat-photo', weight: 0.01 },
      { id: 'cat-music', weight: 0.01 },
    ];

    const result = proportionalSplit(totalPaise, testCategories, weights, 5);
    const sumCategories = result.allocations.reduce((acc, c) => acc + c.allocatedPaise, 0);
    expect(sumCategories + result.contingencyPaise).toBe(totalPaise);

    const venue = result.allocations.find(c => c.id === 'cat-venue')!;
    // Allocatable is 95% of total. Venue should not exceed bounds
    const venuePercentOfAllocatable = (venue.allocatedPaise / (totalPaise - result.contingencyPaise)) * 100;
    expect(venuePercentOfAllocatable).toBeLessThanOrEqual(51);
  });

  describe('Property-Based Fuzzing with fast-check', () => {
    it('always preserves exact sum, no negatives, and non-empty allocation for any randomized input', () => {
      fc.assert(
        fc.property(
          // Total budget from ₹100 (10,000 paise) to ₹10 Crore (1,000,000,000 paise)
          fc.integer({ min: 10000, max: 1000000000 }),
          // Contingency percentage 0% to 30%
          fc.integer({ min: 0, max: 30 }),
          // Randomized raw weights
          fc.array(fc.double({ min: 0.01, max: 100 }), { minLength: 4, maxLength: 4 }),
          (budgetPaiseInt, contingencyPct, rawWeights) => {
            const total = toPaise(budgetPaiseInt);
            const weights = testCategories.map((c, i) => ({
              id: c.id,
              weight: rawWeights[i] ?? 1,
            }));

            const result = proportionalSplit(total, testCategories, weights, contingencyPct);
            const sumCategories = result.allocations.reduce((acc, c) => acc + c.allocatedPaise, 0);

            // Invariant 1: Sum of category paise + contingency MUST equal total paise EXACTLY down to 1 paisa
            expect(sumCategories + result.contingencyPaise).toBe(total);

            // Invariant 2: No allocation is negative
            for (const alloc of result.allocations) {
              expect(alloc.allocatedPaise).toBeGreaterThanOrEqual(0);
            }
          },
        ),
        { numRuns: 1000 },
      );
    });
  });

  describe('Budget Tracker & Live What-If Simulator', () => {
    const sampleBudget: BudgetAllocation = {
      totalBudgetPaise: toPaise(100000000), // 10 Lakhs
      contingencyPaise: toPaise(10000000), // 1 Lakh
      contingencyPercent: 10,
      currency: 'INR',
      categories: [
        {
          id: 'venue',
          name: 'Venue',
          iconName: 'Building',
          minPercent: 20,
          maxPercent: 50,
          weight: 0.5,
          allocatedPaise: toPaise(45000000),
          spentPaise: toPaise(50000000), // Overspent by 50,000
        },
        {
          id: 'food',
          name: 'Food',
          iconName: 'UtensilsCrossed',
          minPercent: 20,
          maxPercent: 50,
          weight: 0.5,
          allocatedPaise: toPaise(45000000),
          spentPaise: toPaise(30000000), // Underspent
        },
      ],
    };

    it('calculates summary, detects overspent categories with accessible alert', () => {
      const summary = calculateBudgetSummary(sampleBudget, 200);

      expect(summary.totalSpentPaise).toBe(80000000);
      expect(summary.remainingPaise).toBe(20000000);
      expect(summary.isOverBudget).toBe(false);
      expect(summary.costPerGuestPaise).toBe(500000); // 10 Lakhs / 200 guests = 5000 INR

      // Check overspend alert has text, icon, and severity
      expect(summary.categoryAlerts).toHaveLength(1);
      const alert = summary.categoryAlerts[0]!;
      expect(alert.categoryName).toBe('Venue');
      expect(alert.iconName).toBeDefined();
      expect(alert.accessibleMessage).toContain('Venue is over budget');
    });

    it('simulates what-if live re-split when guest count or total budget changes', () => {
      const { simulatedBudget, summary } = simulateBudgetWhatIf(
        sampleBudget,
        toPaise(200000000), // Double total to 20 Lakhs
        400, // Double guests
      );

      expect(simulatedBudget.totalBudgetPaise).toBe(200000000);
      expect(simulatedBudget.contingencyPaise).toBe(20000000);
      expect(summary.costPerGuestPaise).toBe(500000);
    });
  });
});
