import { EventTask } from '../types';

/**
 * Escapes characters according to RFC 5545 section 3.3.11.
 * Special characters that MUST be escaped with a backslash: '\', ';', ',', and newlines.
 */
export function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds lines longer than 75 octets per RFC 5545 section 3.1.
 */
export function foldICSLine(line: string): string {
  const MAX_LEN = 75;
  if (line.length <= MAX_LEN) {
    return line;
  }

  let result = '';
  let current = line;

  while (current.length > MAX_LEN) {
    result += current.substring(0, MAX_LEN) + '\r\n ';
    current = current.substring(MAX_LEN);
  }
  result += current;

  return result;
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string.
 */
export function exportToICS(
  eventTitle: string,
  tasks: EventTask[],
  createdTimestamp?: string,
): string {
  const dtstamp = (createdTimestamp ? new Date(createdTimestamp) : new Date())
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jashn Celebration Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldICSLine(`X-WR-CALNAME:${escapeICSText(eventTitle)} Timeline`),
  ];

  for (const task of tasks) {
    const cleanDate = task.dueDate.replace(/-/g, '');
    const uid = `task-${task.id}@jashn.planner`;

    lines.push('BEGIN:VEVENT');
    lines.push(foldICSLine(`UID:${uid}`));
    lines.push(foldICSLine(`DTSTAMP:${dtstamp}`));

    if (task.timeOfDay) {
      // Day-of time format: YYYYMMDDTHHmm00
      const timeClean = task.timeOfDay.replace(':', '');
      lines.push(foldICSLine(`DTSTART:${cleanDate}T${timeClean}00`));
      if (task.estimatedDurationMinutes) {
        lines.push(foldICSLine(`DURATION:PT${task.estimatedDurationMinutes}M`));
      }
    } else {
      // Full-day event
      lines.push(foldICSLine(`DTSTART;VALUE=DATE:${cleanDate}`));
    }

    lines.push(foldICSLine(`SUMMARY:${escapeICSText(task.title)}`));

    const descriptionParts = [task.description];
    if (task.priority === 'critical') {
      descriptionParts.push('[CRITICAL PATH]');
    }
    lines.push(foldICSLine(`DESCRIPTION:${escapeICSText(descriptionParts.join(' - '))}`));

    lines.push(foldICSLine(`STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}
