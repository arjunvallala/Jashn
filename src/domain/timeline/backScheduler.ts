import { EventTask, TaskPhase, TaskPriority } from '../types';

export interface RawTaskInput {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  dayOffset: number; // relative to event date: e.g. -180 for 6 months before, 0 for day-of
  timeOfDay?: string; // HH:mm
  estimatedDurationMinutes?: number;
  dependencies?: string[];
  priority?: TaskPriority;
  source?: 'template' | 'ai' | 'user';
  completed?: boolean;
}

export interface LeadTimeRisk {
  taskId: string;
  taskTitle: string;
  recommendedLeadDays: number;
  actualLeadDaysAvailable: number;
  riskSeverity: 'high' | 'medium';
  message: string;
}

export interface ScheduledTimelineResult {
  tasks: EventTask[];
  isCompressed: boolean;
  totalLeadDays: number;
  leadTimeRisks: LeadTimeRisk[];
  criticalPathTaskIds: Set<string>;
}

/**
 * Parses YYYY-MM-DD string into a UTC Date object at midnight to avoid timezone shifting.
 */
export function parseISODate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid ISO date format (expected YYYY-MM-DD): "${dateStr}"`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date object into YYYY-MM-DD UTC string.
 */
export function formatISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes difference in calendar days (dateB - dateA).
 */
export function diffCalendarDays(dateA: Date, dateB: Date): number {
  const msPerDay = 86400000;
  const utcA = Date.UTC(dateA.getUTCFullYear(), dateA.getUTCMonth(), dateA.getUTCDate());
  const utcB = Date.UTC(dateB.getUTCFullYear(), dateB.getUTCMonth(), dateB.getUTCDate());
  return Math.round((utcB - utcA) / msPerDay);
}

/**
 * Adds an integer number of days to a Date.
 */
export function addDays(date: Date, days: number): Date {
  const res = new Date(date.getTime());
  res.setUTCDate(res.getUTCDate() + days);
  return res;
}

/**
 * Assigns appropriate phase based on day offset.
 */
export function determinePhase(dayOffset: number): TaskPhase {
  if (dayOffset <= -270) return '12_months_out';
  if (dayOffset <= -120) return '6_months_out';
  if (dayOffset <= -45) return '3_months_out';
  if (dayOffset <= -14) return '1_month_out';
  if (dayOffset < 0) return 'week_of';
  if (dayOffset === 0) return 'day_of';
  return 'after';
}

/**
 * Detects cycles in task dependencies and returns a topological order without cycles.
 */
export function resolveDependenciesAndDetectCycles(
  tasks: RawTaskInput[],
): { sortedTaskIds: string[]; hasCycle: boolean } {
  const taskMap = new Map<string, RawTaskInput>(tasks.map(t => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adjacency.set(t.id, []);
  }

  for (const t of tasks) {
    const deps = t.dependencies ?? [];
    for (const depId of deps) {
      if (taskMap.has(depId) && depId !== t.id) {
        adjacency.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    sorted.push(u);

    for (const v of adjacency.get(u) ?? []) {
      const currentDeg = inDegree.get(v)! - 1;
      inDegree.set(v, currentDeg);
      if (currentDeg === 0) {
        queue.push(v);
      }
    }
  }

  const hasCycle = sorted.length < tasks.length;
  // If cycle, append unvisited nodes to preserve all tasks safely
  if (hasCycle) {
    for (const t of tasks) {
      if (!sorted.includes(t.id)) {
        sorted.push(t.id);
      }
    }
  }

  return { sortedTaskIds: sorted, hasCycle };
}

/**
 * Back-schedules tasks from the target event date.
 * If lead time is insufficient (today > task date), compresses the schedule
 * and produces explicit risk warnings.
 */
export function scheduleTimeline(
  eventDateStr: string,
  rawTasks: RawTaskInput[],
  currentDateStr?: string,
): ScheduledTimelineResult {
  const eventDate = parseISODate(eventDateStr);
  const now = currentDateStr ? parseISODate(currentDateStr) : new Date();
  const currentDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const totalLeadDays = diffCalendarDays(currentDate, eventDate);
  const isCompressed = totalLeadDays < 90; // Less than 3 months lead time triggers compression mode
  const leadTimeRisks: LeadTimeRisk[] = [];

  const { sortedTaskIds } = resolveDependenciesAndDetectCycles(rawTasks);
  const taskLookup = new Map<string, RawTaskInput>(rawTasks.map(t => [t.id, t]));

  // Max backward offset among tasks
  const minOffset = rawTasks.reduce((min, t) => Math.min(min, t.dayOffset), 0);
  const maxAbsLeadRequired = Math.abs(minOffset);

  const scheduledMap = new Map<string, EventTask>();
  const criticalPathIds = new Set<string>();

  for (const taskId of sortedTaskIds) {
    const raw = taskLookup.get(taskId);
    if (!raw) continue;

    let targetDate: Date;
    let effectiveOffset = raw.dayOffset;

    const standardDate = addDays(eventDate, raw.dayOffset);
    const standardLeadDaysNeeded = Math.abs(raw.dayOffset);

    if (raw.dayOffset < 0 && standardDate < currentDate) {
      // Task would fall in the past! Compress forward to fit between currentDate and eventDate
      if (totalLeadDays <= 0) {
        // Event is today or in the past
        targetDate = currentDate;
        effectiveOffset = 0;
      } else {
        // Proportional compression within available lead time
        const ratio = maxAbsLeadRequired > 0 ? (maxAbsLeadRequired - standardLeadDaysNeeded) / maxAbsLeadRequired : 0.5;
        const availableOffsetDays = Math.floor(totalLeadDays * ratio);
        targetDate = addDays(currentDate, Math.max(0, availableOffsetDays));
        effectiveOffset = diffCalendarDays(eventDate, targetDate);
      }

      leadTimeRisks.push({
        taskId: raw.id,
        taskTitle: raw.title,
        recommendedLeadDays: standardLeadDaysNeeded,
        actualLeadDaysAvailable: Math.max(0, totalLeadDays),
        riskSeverity: standardLeadDaysNeeded > 60 ? 'high' : 'medium',
        message: `Task "${raw.title}" normally requires ${standardLeadDaysNeeded} days lead time; compressed to ${Math.max(0, totalLeadDays)} days available.`,
      });
    } else {
      targetDate = standardDate;
    }

    // Enforce dependency ordering: targetDate >= predecessorTargetDate
    const deps = raw.dependencies ?? [];
    for (const depId of deps) {
      const parentTask = scheduledMap.get(depId);
      if (parentTask) {
        const parentDate = parseISODate(parentTask.dueDate);
        if (targetDate < parentDate) {
          targetDate = parentDate;
          effectiveOffset = diffCalendarDays(eventDate, targetDate);
        }
      }
    }

    // Critical path flagging: critical priority or dependencies chain
    const isCritical = raw.priority === 'critical' || deps.length > 1 || raw.dayOffset === 0;
    if (isCritical) {
      criticalPathIds.add(raw.id);
    }

    const scheduledTask: EventTask = {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      categoryId: raw.categoryId,
      phase: determinePhase(effectiveOffset),
      dueDate: formatISODate(targetDate),
      dayOffset: effectiveOffset,
      timeOfDay: raw.timeOfDay,
      estimatedDurationMinutes: raw.estimatedDurationMinutes,
      dependencies: deps,
      completed: raw.completed ?? false,
      priority: raw.priority ?? 'medium',
      isCriticalPath: isCritical,
      source: raw.source ?? 'template',
    };

    scheduledMap.set(raw.id, scheduledTask);
  }

  // Preserve initial ordering
  const finalTasks = rawTasks.map(t => scheduledMap.get(t.id)!).filter(Boolean);

  return {
    tasks: finalTasks,
    isCompressed: isCompressed || leadTimeRisks.length > 0,
    totalLeadDays,
    leadTimeRisks,
    criticalPathTaskIds: criticalPathIds,
  };
}
