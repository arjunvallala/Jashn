import { BudgetCategory, Paise, toPaise } from '../types';

export interface CategoryInputWeight {
  id: string;
  weight: number; // raw weight or percentage (e.g. 0.25 or 25)
  rationale?: string;
}

export interface SplitResult {
  allocations: Array<{
    id: string;
    allocatedPaise: Paise;
    weight: number;
    percentage: number;
    rationale?: string;
  }>;
  contingencyPaise: Paise;
  totalAllocatedPaise: Paise;
}

/**
 * Normalizes weights and allocates budget using the Hare-Niemeyer (Largest Remainder) Method
 * with strict min/max category boundary enforcement.
 * Guarantees that sum(allocations) + contingencyPaise === totalBudgetPaise exactly.
 */
export function proportionalSplit(
  totalBudgetPaise: Paise,
  categories: Array<Pick<BudgetCategory, 'id' | 'minPercent' | 'maxPercent'>>,
  weights: CategoryInputWeight[],
  contingencyPercent: number = 10,
): SplitResult {
  if (totalBudgetPaise < 0) {
    throw new RangeError(`Total budget cannot be negative, received: ${totalBudgetPaise}`);
  }

  const clampedContingencyPercent = Math.min(Math.max(contingencyPercent, 0), 50);
  const contingencyPaise = toPaise(
    Math.round((totalBudgetPaise * clampedContingencyPercent) / 100),
  );
  const allocatablePaise = toPaise(totalBudgetPaise - contingencyPaise);

  if (categories.length === 0) {
    return {
      allocations: [],
      contingencyPaise,
      totalAllocatedPaise: contingencyPaise,
    };
  }

  // Map input weights
  const weightMap = new Map<string, { weight: number; rationale?: string }>();
  for (const w of weights) {
    weightMap.set(w.id, {
      weight: Math.max(0, Number.isFinite(w.weight) ? w.weight : 0),
      rationale: w.rationale,
    });
  }

  let totalRawWeight = 0;
  const parsed = categories.map(cat => {
    const entry = weightMap.get(cat.id);
    const rawWeight = entry && entry.weight > 0 ? entry.weight : 1;
    totalRawWeight += rawWeight;
    return {
      id: cat.id,
      minPercent: Math.max(0, cat.minPercent),
      maxPercent: Math.min(100, Math.max(cat.minPercent, cat.maxPercent)),
      rawWeight,
      rationale: entry?.rationale,
      percent: 0,
    };
  });

  if (totalRawWeight === 0) totalRawWeight = parsed.length;

  // Initialize percentages
  for (const item of parsed) {
    item.percent = (item.rawWeight / totalRawWeight) * 100;
  }

  // Iterative bounded redistribution (up to 15 iterations)
  for (let iter = 0; iter < 15; iter++) {
    let diff = 0;
    for (const item of parsed) {
      const clamped = Math.min(Math.max(item.percent, item.minPercent), item.maxPercent);
      item.percent = clamped;
    }

    const currentSum = parsed.reduce((sum, item) => sum + item.percent, 0);
    diff = 100 - currentSum;

    if (Math.abs(diff) < 0.001) {
      break;
    }

    if (diff > 0) {
      // Distribute shortage to categories that have headroom below maxPercent
      const eligible = parsed.filter(item => item.percent < item.maxPercent);
      if (eligible.length === 0) break;
      const share = diff / eligible.length;
      for (const item of eligible) {
        item.percent = Math.min(item.maxPercent, item.percent + share);
      }
    } else {
      // Subtract excess from categories that are above minPercent
      const eligible = parsed.filter(item => item.percent > item.minPercent);
      if (eligible.length === 0) break;
      const share = Math.abs(diff) / eligible.length;
      for (const item of eligible) {
        item.percent = Math.max(item.minPercent, item.percent - share);
      }
    }
  }

  const finalSum = parsed.reduce((sum, item) => sum + item.percent, 0);

  // Hare-Niemeyer (Largest-Remainder Method)
  // Step 1: Compute floor allocations and remainders
  let floorSum = 0;
  const remainderTable = parsed.map((item, index) => {
    const fraction = finalSum > 0 ? item.percent / finalSum : 1 / parsed.length;
    const exactPaise = allocatablePaise * fraction;
    const floorPaise = Math.floor(exactPaise);
    const remainder = exactPaise - floorPaise;
    floorSum += floorPaise;
    return {
      id: item.id,
      index,
      floorPaise,
      remainder,
      fraction,
      percentage: item.percent,
      rationale: item.rationale,
    };
  });

  // Step 2: Distribute remaining single paise to highest remainders
  const extraPaise = allocatablePaise - floorSum;
  const sorted = [...remainderTable].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.id.localeCompare(b.id);
  });

  const bonusIds = new Set<string>();
  for (let i = 0; i < extraPaise; i++) {
    const target = sorted[i];
    if (target) bonusIds.add(target.id);
  }

  // Step 3: Produce final exact allocations
  const allocations = remainderTable.map(item => {
    const allocatedPaise = toPaise(item.floorPaise + (bonusIds.has(item.id) ? 1 : 0));
    return {
      id: item.id,
      allocatedPaise,
      weight: item.fraction,
      percentage: Math.round(item.fraction * 1000) / 10,
      rationale: item.rationale,
    };
  });

  const totalAllocatedPaise = toPaise(
    allocations.reduce((sum, item) => sum + item.allocatedPaise, contingencyPaise),
  );

  return {
    allocations,
    contingencyPaise,
    totalAllocatedPaise,
  };
}
