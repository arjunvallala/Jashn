import { describe, it, expect } from 'vitest';
import { scheduleTimeline, RawTaskInput } from '@/domain/timeline/backScheduler';
import { proportionalSplit } from '@/domain/budget/proportionalSplit';
import { toPaise } from '@/domain/types';

describe('Performance Benchmarks', () => {
  it('schedules 200 tasks and resolves dependencies in under 50ms', () => {
    const taskCount = 200;
    const rawTasks: RawTaskInput[] = [];

    for (let i = 0; i < taskCount; i++) {
      rawTasks.push({
        id: `perf-task-${i}`,
        title: `Task Number ${i} Setup Milestone`,
        description: `Detailed description for milestone ${i} in the grand celebration plan.`,
        categoryId: i % 2 === 0 ? 'venue' : 'catering',
        dayOffset: -Math.floor((i / taskCount) * 180),
        dependencies: i > 0 && i % 5 === 0 ? [`perf-task-${i - 1}`] : [],
        priority: i % 10 === 0 ? 'critical' : 'medium',
      });
    }

    const startTime = performance.now();
    const result = scheduleTimeline('2027-01-01', rawTasks, '2026-01-01');
    const elapsedMs = performance.now() - startTime;

    expect(result.tasks).toHaveLength(200);
    expect(elapsedMs).toBeLessThan(50);
  });

  it('proportionalSplit handles 50 categories in under 50ms', () => {
    const categories = Array.from({ length: 50 }, (_, i) => ({
      id: `cat-${i}`,
      minPercent: 0.5,
      maxPercent: 5,
    }));
    const weights = categories.map(c => ({ id: c.id, weight: 1 }));

    // Warm up JIT
    proportionalSplit(toPaise(10000000), categories, weights, 10);

    const startTime = performance.now();
    const result = proportionalSplit(toPaise(1000000000), categories, weights, 10);
    const elapsedMs = performance.now() - startTime;

    expect(result.allocations).toHaveLength(50);
    expect(elapsedMs).toBeLessThan(50);
  });
});
