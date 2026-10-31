'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Sparkles,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { EventTask, LanguageCode, TaskPhase } from '@/domain/types';
import { exportPlanAsICS } from '@/lib/export';
import { TRANSLATIONS } from '@/lib/i18n';

interface TimelineScreenProps {
  plan: ValidatedEventPlan;
  onUpdatePlan: (updated: ValidatedEventPlan) => void;
  language: LanguageCode;
}

const PHASES: Array<{ id: TaskPhase | 'all' | 'run_of_show'; label: string }> = [
  { id: 'all', label: 'All Tasks' },
  { id: '12_months_out', label: '12 Months Out' },
  { id: '6_months_out', label: '6 Months Out' },
  { id: '3_months_out', label: '3 Months Out' },
  { id: '1_month_out', label: '1 Month Out' },
  { id: 'week_of', label: 'Week Of' },
  { id: 'day_of', label: 'Day-Of' },
  { id: 'run_of_show', label: 'Run-of-Show (Hour-by-Hour)' },
  { id: 'after', label: 'Post-Event' },
];

export const TimelineScreen: React.FC<TimelineScreenProps> = ({
  plan,
  onUpdatePlan,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedPhase, setSelectedPhase] = useState<TaskPhase | 'all' | 'run_of_show'>('all');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const toggleTaskCompletion = (taskId: string) => {
    const updatedTasks = plan.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    onUpdatePlan({ ...plan, tasks: updatedTasks });
  };

  const filteredTasks = plan.tasks.filter(task => {
    if (criticalOnly && !task.isCriticalPath) return false;
    if (selectedPhase === 'all') return true;
    if (selectedPhase === 'run_of_show') return task.dayOffset === 0 && !!task.timeOfDay;
    return task.phase === selectedPhase;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Screen Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t.timeline.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Back-scheduled milestones, critical path tracking, and RFC 5545 calendar export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Critical Path Filter */}
          <button
            type="button"
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all min-h-touch ${
              criticalOnly
                ? 'bg-destructive/10 text-destructive border-destructive'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
            aria-pressed={criticalOnly}
          >
            <Flag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{criticalOnly ? 'Showing Critical Only' : 'Filter Critical Path'}</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-xl p-1 border border-border">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold min-h-touch min-w-touch flex items-center space-x-1 ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs font-bold min-h-touch min-w-touch flex items-center space-x-1 ${
                viewMode === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>

          {/* Export ICS Button */}
          <button
            type="button"
            onClick={() => exportPlanAsICS(plan)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-hover min-h-touch transition-all shadow-md"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{t.timeline.exportIcs}</span>
          </button>
        </div>
      </div>

      {/* Phase Filters Bar */}
      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar" role="tablist">
        {PHASES.map(phase => {
          const isSelected = selectedPhase === phase.id;
          return (
            <button
              key={phase.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedPhase(phase.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-touch transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {phase.label}
            </button>
          );
        })}
      </div>

      {/* Day-of Run-of-Show Highlight (Hour-by-Hour) */}
      {selectedPhase === 'run_of_show' && (
        <div className="p-5 rounded-2xl bg-secondary/50 border border-primary/20 space-y-2">
          <h2 className="text-base font-extrabold text-foreground flex items-center">
            <Clock className="w-5 h-5 text-primary mr-2" aria-hidden="true" />
            <span>Day-Of Run-of-Show Master Protocol ({plan.eventDate})</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Strict minute-by-minute coordinator sequencing. Keep all key family members and vendors aligned on these timed slots.
          </p>
        </div>
      )}

      {/* Task List Render */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border overflow-hidden shadow-sm divide-y divide-border">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
              task.completed ? 'bg-muted/30 opacity-75' : 'hover:bg-muted/20'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <button
                type="button"
                onClick={() => toggleTaskCompletion(task.id)}
                className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all min-h-touch min-w-touch ${
                  task.completed
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-muted-foreground hover:border-primary'
                }`}
                aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
              >
                {task.completed && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
              </button>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-base font-bold text-foreground ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.isCriticalPath && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-destructive/10 text-destructive border border-destructive/20">
                      Critical Path
                    </span>
                  )}
                  {task.timeOfDay && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary flex items-center">
                      <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                      {task.timeOfDay} ({task.estimatedDurationMinutes}m)
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-sm font-extrabold text-foreground block">{task.dueDate}</span>
              <span className="text-xs text-muted-foreground font-semibold block mt-0.5">
                {task.dayOffset === 0
                  ? 'Day of Event'
                  : task.dayOffset < 0
                    ? `${Math.abs(task.dayOffset)} days before`
                    : `${task.dayOffset} days after`}
              </span>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="py-12 text-center text-sm font-semibold text-muted-foreground">
            No milestones found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
