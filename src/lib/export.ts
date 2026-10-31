import { ValidatedEventPlan, EventPlanSchema } from '../domain/validators';
import { exportToICS } from '../domain/timeline/icsExporter';

export function exportPlanAsJSON(plan: ValidatedEventPlan): void {
  const jsonStr = JSON.stringify(plan, null, 2);
  downloadBlob(jsonStr, `${cleanFilename(plan.title)}_plan.json`, 'application/json');
}

export function exportPlanAsCSV(plan: ValidatedEventPlan): void {
  // Generate multi-section CSV: Budget, Tasks, Vendors
  const rows: string[] = [];

  // Header & Metadata
  rows.push(`"Jashn Event Plan Export"`);
  rows.push(`"Title","${escapeCSV(plan.title)}"`);
  rows.push(`"Event Type","${plan.eventType}"`);
  rows.push(`"Date","${plan.eventDate}"`);
  rows.push(`"City","${escapeCSV(plan.city)}"`);
  rows.push(`"Guests","${plan.guestCount}"`);
  rows.push(`"Total Budget (${plan.budget.currency})","${plan.budget.totalBudgetPaise / 100}"`);
  rows.push('');

  // 1. Budget Breakdown
  rows.push(`"--- BUDGET BREAKDOWN ---"`);
  rows.push(`"Category","Allocated (${plan.budget.currency})","Spent (${plan.budget.currency})","Difference"`);
  for (const cat of plan.budget.categories) {
    const alloc = cat.allocatedPaise / 100;
    const spent = cat.spentPaise / 100;
    rows.push(`"${escapeCSV(cat.name)}","${alloc}","${spent}","${alloc - spent}"`);
  }
  rows.push(`"Protected Contingency","${plan.budget.contingencyPaise / 100}","0","${plan.budget.contingencyPaise / 100}"`);
  rows.push('');

  // 2. Timeline Tasks
  rows.push(`"--- TIMELINE & MILESTONES ---"`);
  rows.push(`"Due Date","Phase","Title","Time","Priority","Status","Description"`);
  for (const task of plan.tasks) {
    rows.push(
      `"${task.dueDate}","${task.phase}","${escapeCSV(task.title)}","${task.timeOfDay || 'All Day'}","${task.priority}","${task.completed ? 'Completed' : 'Pending'}","${escapeCSV(task.description)}"`,
    );
  }
  rows.push('');

  // 3. Vendors
  rows.push(`"--- VENDORS PIPELINE ---"`);
  rows.push(`"Category","Service","Status","Quote Amount","Deposit Due"`);
  for (const v of plan.vendors) {
    const quote = v.quoteAmountPaise ? v.quoteAmountPaise / 100 : 'N/A';
    rows.push(`"${escapeCSV(v.categoryName)}","${escapeCSV(v.serviceName)}","${v.status}","${quote}","${v.depositDueDate || 'N/A'}"`);
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  downloadBlob(csvContent, `${cleanFilename(plan.title)}_summary.csv`, 'text/csv;charset=utf-8;');
}

export function exportPlanAsICS(plan: ValidatedEventPlan): void {
  const icsString = exportToICS(plan.title, plan.tasks, plan.createdAt);
  downloadBlob(icsString, `${cleanFilename(plan.title)}_timeline.ics`, 'text/calendar;charset=utf-8;');
}

export function importPlanFromJSON(file: File): Promise<{ success: boolean; plan?: ValidatedEventPlan; error?: string }> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = EventPlanSchema.safeParse(parsed);

        if (validation.success) {
          resolve({ success: true, plan: validation.data });
        } else {
          resolve({
            success: false,
            error: 'File does not conform to the valid Jashn event schema.',
          });
        }
      } catch {
        resolve({ success: false, error: 'Invalid JSON file.' });
      }
    };
    reader.onerror = () => resolve({ success: false, error: 'Failed to read file.' });
    reader.readAsText(file);
  });
}

function escapeCSV(text: string): string {
  return text.replace(/"/g, '""');
}

function cleanFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
