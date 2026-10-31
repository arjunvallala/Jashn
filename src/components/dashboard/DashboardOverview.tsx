'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { calculateBudgetSummary } from '@/domain/budget/budgetTracker';
import { Money } from '@/domain/money';
import { LanguageCode } from '@/domain/types';
import { TRANSLATIONS } from '@/lib/i18n';

interface DashboardOverviewProps {
  plan: ValidatedEventPlan;
  onNavigateTab: (tab: string) => void;
  language: LanguageCode;
  onToggleTaskCompleted: (taskId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  plan,
  onNavigateTab,
  language,
  onToggleTaskCompleted,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const budgetSummary = calculateBudgetSummary(plan.budget, plan.guestCount);

  // Countdown timer calculations
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const target = new Date(`${plan.eventDate}T00:00:00`).getTime();
      const now = Date.now();
      const diffMs = target - now;

      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ days, hours, minutes });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000);
    return () => clearInterval(interval);
  }, [plan.eventDate]);

  // Tasks overview: next 5 incomplete tasks sorted by due date
  const upcomingTasks = [...plan.tasks]
    .filter(t => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const completedCount = plan.tasks.filter(t => t.completed).length;
  const totalTasksCount = plan.tasks.length;
  const taskProgressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Vendors pipeline breakdown
  const vendorBookedCount = plan.vendors.filter(v => v.status === 'booked' || v.status === 'paid').length;
  const totalVendorsCount = plan.vendors.length;

  // Budget ring calculations
  const totalBudgetRupees = plan.budget.totalBudgetPaise / 100;
  const totalSpentRupees = budgetSummary.totalSpentPaise / 100;
  const spendPercent = totalBudgetRupees > 0 ? Math.min(100, Math.round((totalSpentRupees / totalBudgetRupees) * 100)) : 0;

  const pinnedIdeas = plan.ideas.filter(i => i.pinned);

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Hero Celebration Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary-hover to-accent text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{plan.eventType.toUpperCase()} CELEBRATION</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              {plan.title}
            </h1>
            <p className="mt-2 text-white/90 text-sm sm:text-base font-medium flex flex-wrap items-center gap-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" aria-hidden="true" />
                {plan.eventDate}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Building className="w-4 h-4 mr-1.5" aria-hidden="true" />
                {plan.city}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1.5" aria-hidden="true" />
                {plan.guestCount} Guests
              </span>
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center flex items-center space-x-4 self-stretch sm:self-auto justify-around">
            <div>
              <span className="block text-3xl sm:text-4xl font-black">{timeLeft.days}</span>
              <span className="text-xs uppercase tracking-wider text-white/80 font-bold">Days</span>
            </div>
            <span className="text-2xl font-light text-white/60">:</span>
            <div>
              <span className="block text-3xl sm:text-4xl font-black">{timeLeft.hours}</span>
              <span className="text-xs uppercase tracking-wider text-white/80 font-bold">Hours</span>
            </div>
            <span className="text-2xl font-light text-white/60">:</span>
            <div>
              <span className="block text-3xl sm:text-4xl font-black">{timeLeft.minutes}</span>
              <span className="text-xs uppercase tracking-wider text-white/80 font-bold">Mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget KPI & Mini Ring */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">{t.budget.title}</span>
            <Coins className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>

          <div className="my-4 flex items-center space-x-4">
            {/* SVG Ring Progress */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={budgetSummary.isOverBudget ? 'text-destructive' : 'text-primary'}
                  strokeDasharray={`${spendPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black">
                {spendPercent}%
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold tracking-tight">
                {Money.fromPaise(budgetSummary.totalSpentPaise).format(plan.budget.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                of {Money.fromPaise(plan.budget.totalBudgetPaise).format(plan.budget.currency)} total
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('budget')}
            className="text-xs font-bold text-primary hover:underline flex items-center min-h-touch"
          >
            <span>View budget breakdown</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
          </button>
        </div>

        {/* Tasks KPI */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">{t.timeline.title}</span>
            <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
          </div>

          <div className="my-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {completedCount} / {totalTasksCount} Tasks
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
              <div
                className="bg-success h-2.5 rounded-full transition-all"
                style={{ width: `${taskProgressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalTasksCount - completedCount} milestones remaining before event day.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('timeline')}
            className="text-xs font-bold text-primary hover:underline flex items-center min-h-touch"
          >
            <span>Explore full timeline</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
          </button>
        </div>

        {/* Vendors KPI */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">{t.vendors.title}</span>
            <Building className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>

          <div className="my-4">
            <div className="text-2xl font-extrabold tracking-tight">
              {vendorBookedCount} / {totalVendorsCount} Confirmed
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalVendorsCount - vendorBookedCount} service categories still in negotiation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('vendors')}
            className="text-xs font-bold text-primary hover:underline flex items-center min-h-touch"
          >
            <span>Manage vendor pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Content Split: Upcoming Milestones & Pinned Ideas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next 5 Tasks */}
        <div className="lg:col-span-2 bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-lg font-bold tracking-tight">Next 5 Milestones to Complete</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-bold text-primary hover:underline"
            >
              See all ({plan.tasks.length})
            </button>
          </div>

          <div className="divide-y divide-border/60 mt-2">
            {upcomingTasks.map(task => (
              <div key={task.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <button
                    type="button"
                    onClick={() => onToggleTaskCompleted(task.id)}
                    className="mt-0.5 w-6 h-6 rounded-md border border-border hover:border-primary flex items-center justify-center transition-all min-h-touch min-w-touch"
                    aria-label={`Mark "${task.title}" as complete`}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </button>
                  <div>
                    <span className="font-semibold text-sm block text-foreground">{task.title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">{task.description}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-primary block">{task.dueDate}</span>
                  {task.isCriticalPath && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold uppercase rounded">
                      Critical
                    </span>
                  )}
                </div>
              </div>
            ))}

            {upcomingTasks.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground font-medium">
                🎉 All milestones completed! Ready for the celebration!
              </p>
            )}
          </div>
        </div>

        {/* Pinned Creative Ideas */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-lg font-bold tracking-tight flex items-center">
                <Lightbulb className="w-5 h-5 text-accent mr-2" aria-hidden="true" />
                <span>Pinned Ideas</span>
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('ideas')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Explore ({plan.ideas.length})
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {pinnedIdeas.slice(0, 3).map(idea => (
                <div key={idea.id} className="p-3.5 rounded-xl bg-muted/60 border border-border/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary">{idea.categoryName}</span>
                    <span className="text-xs font-bold text-accent">{idea.costTier}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{idea.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.description}</p>
                </div>
              ))}

              {pinnedIdeas.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No ideas pinned yet. Explore ideas and pin your favorites!
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ideas')}
            className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold bg-muted hover:bg-primary/10 hover:text-primary transition-all text-center min-h-touch flex items-center justify-center"
          >
            <span>Browse All Personalized Ideas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
