import { describe, it, expect } from 'vitest';
import {
  scheduleTimeline,
  resolveDependenciesAndDetectCycles,
  parseISODate,
  formatISODate,
  addDays,
  diffCalendarDays,
  RawTaskInput,
} from '@/domain/timeline/backScheduler';
import { exportToICS, escapeICSText, foldICSLine } from '@/domain/timeline/icsExporter';

describe('Timeline Engine & Back-Scheduling', () => {
  const sampleTasks: RawTaskInput[] = [
    {
      id: 'task-1',
      title: 'Book Venue',
      description: 'Reserve wedding hall',
      categoryId: 'venue',
      dayOffset: -180,
      priority: 'critical',
    },
    {
      id: 'task-2',
      title: 'Hire Caterer',
      description: 'Sign catering contract',
      categoryId: 'food',
      dayOffset: -120,
      dependencies: ['task-1'],
      priority: 'high',
    },
    {
      id: 'task-3',
      title: 'Day-of Décor Check',
      description: 'Inspect flowers and lighting',
      categoryId: 'venue',
      dayOffset: 0,
      timeOfDay: '08:00',
      estimatedDurationMinutes: 60,
      dependencies: ['task-2'],
      priority: 'critical',
    },
  ];

  it('correctly calculates back-scheduled dates from event date', () => {
    const eventDate = '2026-10-31';
    const result = scheduleTimeline(eventDate, sampleTasks, '2025-10-01');

    expect(result.tasks).toHaveLength(3);
    const task1 = result.tasks.find(t => t.id === 'task-1')!;
    const task3 = result.tasks.find(t => t.id === 'task-3')!;

    expect(task1.dueDate).toBe('2026-05-04'); // exactly 180 days before Oct 31, 2026
    expect(task3.dueDate).toBe('2026-10-31');
    expect(task3.timeOfDay).toBe('08:00');
    expect(task1.isCriticalPath).toBe(true);
  });

  it('handles leap year calendar arithmetic correctly', () => {
    // 2028 is a leap year (Feb 29 exists)
    const feb28 = parseISODate('2028-02-28');
    const plusOne = addDays(feb28, 1);
    expect(formatISODate(plusOne)).toBe('2028-02-29');

    const plusTwo = addDays(feb28, 2);
    expect(formatISODate(plusTwo)).toBe('2028-03-01');

    expect(diffCalendarDays(feb28, plusTwo)).toBe(2);
  });

  it('detects tight lead times and compresses infeasible dates forward with risk warnings', () => {
    // Event is only 14 days away, but task-1 normally requires 180 days lead time
    const eventDate = '2026-11-14';
    const currentDate = '2026-10-31';

    const result = scheduleTimeline(eventDate, sampleTasks, currentDate);

    expect(result.isCompressed).toBe(true);
    expect(result.totalLeadDays).toBe(14);
    expect(result.leadTimeRisks.length).toBeGreaterThanOrEqual(1);

    const venueRisk = result.leadTimeRisks.find(r => r.taskId === 'task-1')!;
    expect(venueRisk.riskSeverity).toBe('high');
    expect(venueRisk.message).toContain('normally requires 180 days lead time');

    // Compressed date must NOT be in the past
    for (const t of result.tasks) {
      expect(t.dueDate >= currentDate).toBe(true);
      expect(t.dueDate <= eventDate).toBe(true);
    }
  });

  it('detects cycles in task dependencies and recovers gracefully', () => {
    const cyclicTasks: RawTaskInput[] = [
      { id: 'A', title: 'Task A', description: '', categoryId: 'cat', dayOffset: -30, dependencies: ['B'] },
      { id: 'B', title: 'Task B', description: '', categoryId: 'cat', dayOffset: -20, dependencies: ['C'] },
      { id: 'C', title: 'Task C', description: '', categoryId: 'cat', dayOffset: -10, dependencies: ['A'] }, // Cycle A -> B -> C -> A
    ];

    const { sortedTaskIds, hasCycle } = resolveDependenciesAndDetectCycles(cyclicTasks);
    expect(hasCycle).toBe(true);
    expect(sortedTaskIds).toHaveLength(3);
  });

  describe('RFC 5545 iCalendar Exporter', () => {
    it('generates valid RFC 5545 format with escaping, folding, and CRLF', () => {
      const scheduled = scheduleTimeline('2026-10-31', sampleTasks, '2025-10-01');
      const ics = exportToICS('Diwali Gala; Celebration, Special', scheduled.tasks, '2026-01-01T00:00:00.000Z');

      // RFC 5545 header and footer requirements
      expect(ics).toContain('BEGIN:VCALENDAR\r\n');
      expect(ics).toContain('VERSION:2.0\r\n');
      expect(ics).toContain('PRODID:-//Jashn Celebration Planner//EN\r\n');
      expect(ics).toContain('END:VCALENDAR\r\n');

      // VEVENT requirements
      expect(ics).toContain('BEGIN:VEVENT\r\n');
      expect(ics).toContain('UID:task-task-1@jashn.planner\r\n');
      expect(ics).toContain('DTSTART;VALUE=DATE:20260504\r\n');
      expect(ics).toContain('DTSTART:20261031T080000\r\n'); // Timed event
      expect(ics).toContain('DURATION:PT60M\r\n');
      expect(ics).toContain('END:VEVENT\r\n');
    });

    it('escapes semicolons, commas, backslashes, and newlines per RFC 5545', () => {
      const escaped = escapeICSText('Line 1\nLine 2; with, symbols & \\backslash');
      expect(escaped).toBe('Line 1\\nLine 2\\; with\\, symbols & \\\\backslash');
    });

    it('folds lines exceeding 75 octets with CRLF followed by single space', () => {
      const longLine = 'DESCRIPTION:' + 'A'.repeat(120);
      const folded = foldICSLine(longLine);
      expect(folded).toContain('\r\n ');
      const chunks = folded.split('\r\n ');
      expect(chunks[0]!.length).toBe(75);
    });
  });
});
