'use client';

import React, { useState } from 'react';
import {
  Coins,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  Sliders,
  Check,
  ShieldCheck,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { calculateBudgetSummary, simulateBudgetWhatIf } from '@/domain/budget/budgetTracker';
import { Money } from '@/domain/money';
import { LanguageCode, toPaise } from '@/domain/types';
import { Modal } from '../common/Modal';
import { TRANSLATIONS } from '@/lib/i18n';

interface BudgetScreenProps {
  plan: ValidatedEventPlan;
  onUpdatePlan: (updated: ValidatedEventPlan) => void;
  language: LanguageCode;
  plainLanguage: boolean;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({
  plan,
  onUpdatePlan,
  language,
  plainLanguage,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const summary = calculateBudgetSummary(plan.budget, plan.guestCount);

  // What-If Simulator state
  const [whatIfBudgetRupees, setWhatIfBudgetRupees] = useState(plan.budget.totalBudgetPaise / 100);
  const [whatIfGuests, setWhatIfGuests] = useState(plan.guestCount);
  const [showWhatIf, setShowWhatIf] = useState(false);

  // Optimize Deficit modal state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeDiff, setOptimizeDiff] = useState<any>(null);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  const whatIfSim = simulateBudgetWhatIf(
    plan.budget,
    toPaise(Math.round(whatIfBudgetRupees * 100)),
    whatIfGuests,
  );

  const handleApplyWhatIf = () => {
    onUpdatePlan({
      ...plan,
      guestCount: whatIfGuests,
      budget: whatIfSim.simulatedBudget,
    });
    setShowWhatIf(false);
  };

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    setShowOptimizeModal(true);

    try {
      const deficitRupees = summary.overBudgetPaise > 0 ? summary.overBudgetPaise / 100 : 50000;
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudgetRupees: plan.budget.totalBudgetPaise / 100,
          totalSpentRupees: summary.totalSpentPaise / 100,
          deficitRupees,
          currency: plan.budget.currency,
          categories: plan.budget.categories.map(c => ({
            id: c.id,
            name: c.name,
            allocatedRupees: c.allocatedPaise / 100,
            spentRupees: c.spentPaise / 100,
          })),
          language,
        }),
      });

      const data = await res.json();
      setOptimizeDiff(data.optimization);
    } catch {
      // Fallback proposal
      setOptimizeDiff({
        overallStrategy: 'Rebalance high floral & decor expenses to restore balance.',
        trims: [
          {
            categoryId: plan.budget.categories[0]?.id,
            categoryName: plan.budget.categories[0]?.name,
            currentAllocatedRupees: (plan.budget.categories[0]?.allocatedPaise || 0) / 100,
            proposedNewAllocatedRupees: Math.round(((plan.budget.categories[0]?.allocatedPaise || 0) / 100) * 0.9),
            savingsRupees: Math.round(((plan.budget.categories[0]?.allocatedPaise || 0) / 100) * 0.1),
            actionableTrimTip: 'Use locally available seasonal blooms instead of imported exotics.',
          },
        ],
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizeDiff?.trims) return;

    const updatedCategories = plan.budget.categories.map(cat => {
      const trim = optimizeDiff.trims.find((t: any) => t.categoryId === cat.id);
      if (trim) {
        return {
          ...cat,
          allocatedPaise: toPaise(Math.round(trim.proposedNewAllocatedRupees * 100)),
        };
      }
      return cat;
    });

    onUpdatePlan({
      ...plan,
      budget: {
        ...plan.budget,
        categories: updatedCategories,
      },
    });
    setShowOptimizeModal(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Screen Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t.budget.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exact integer minor unit accounting (0 float drift). Protected 10% reserve.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowWhatIf(!showWhatIf)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-border bg-card hover:bg-muted min-h-touch transition-all shadow-sm"
          >
            <Sliders className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>{showWhatIf ? 'Hide What-If' : t.budget.whatIf}</span>
          </button>

          <button
            type="button"
            onClick={handleRunOptimization}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-hover min-h-touch transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{t.budget.optimize}</span>
          </button>
        </div>
      </div>

      {/* Overspend Alert Banner (Text + Icon + Color, NEVER color alone) */}
      {summary.categoryAlerts.length > 0 && (
        <div className="rounded-2xl bg-destructive/10 border-2 border-destructive p-5" role="alert">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-destructive">
                {t.budget.overspendAlert} ({summary.categoryAlerts.length} Categories Exceeded)
              </h2>
              {summary.categoryAlerts.map(alert => (
                <p key={alert.categoryId} className="text-sm font-medium text-foreground">
                  <strong>{alert.categoryName}:</strong> Over by {alert.overspendPercent}% (
                  {Money.fromPaise(alert.overspendPaise).format(plan.budget.currency)} deficit).
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            {plainLanguage ? 'Planned Money' : t.budget.total}
          </span>
          <div className="text-2xl font-black text-foreground">
            {Money.fromPaise(plan.budget.totalBudgetPaise).format(plan.budget.currency)}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            {t.budget.spent}
          </span>
          <div className="text-2xl font-black text-foreground">
            {Money.fromPaise(summary.totalSpentPaise).format(plan.budget.currency)}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            {t.budget.remaining}
          </span>
          <div className="text-2xl font-black text-success">
            {Money.fromPaise(summary.remainingPaise).format(plan.budget.currency)}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            {plainLanguage ? 'Cost for Each Person' : t.budget.costPerGuest}
          </span>
          <div className="text-2xl font-black text-foreground">
            {Money.fromPaise(summary.costPerGuestPaise).format(plan.budget.currency)}
          </div>
        </div>
      </div>

      {/* Protected Contingency Reserve Callout */}
      <div className="p-4 rounded-xl bg-secondary/60 border border-secondary text-secondary-foreground flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-bold">
            {plainLanguage ? 'Emergency Buffer Money' : t.budget.contingency}:{' '}
            {Money.fromPaise(plan.budget.contingencyPaise).format(plan.budget.currency)} (
            {plan.budget.contingencyPercent}% Protected)
          </span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
          Inviolable reserve line
        </span>
      </div>

      {/* What-If Live Simulator Panel */}
      {showWhatIf && (
        <div className="bg-card text-card-foreground rounded-2xl border-2 border-primary/40 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground flex items-center">
              <Sliders className="w-5 h-5 text-primary mr-2" aria-hidden="true" />
              <span>{t.budget.whatIf}</span>
            </h2>
            <button
              type="button"
              onClick={handleApplyWhatIf}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover min-h-touch"
            >
              Apply Simulated Values
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label htmlFor="sim-budget" className="block text-xs font-bold text-foreground mb-1">
                Simulated Budget ({plan.budget.currency})
              </label>
              <input
                id="sim-budget"
                type="number"
                step="50000"
                value={whatIfBudgetRupees}
                onChange={e => setWhatIfBudgetRupees(parseFloat(e.target.value) || 0)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm font-bold min-h-touch"
              />
            </div>

            <div>
              <label htmlFor="sim-guests" className="block text-xs font-bold text-foreground mb-1">
                Simulated Guest Count
              </label>
              <input
                id="sim-guests"
                type="number"
                min="10"
                max="50000"
                value={whatIfGuests}
                onChange={e => setWhatIfGuests(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm font-bold min-h-touch"
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Ledger Table */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-base font-bold text-foreground">Detailed Category Ledger</h2>
        </div>

        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-b-2xl" tabIndex={0} role="region" aria-label="Detailed Category Ledger Table">
          <table className="w-full text-left text-sm" aria-label="Budget Categories Ledger">
            <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Allocated</th>
                <th className="py-3 px-6">Spent</th>
                <th className="py-3 px-6">Difference</th>
                <th className="py-3 px-6">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plan.budget.categories.map(cat => {
                const isOver = cat.spentPaise > cat.allocatedPaise;
                const diff = cat.allocatedPaise - cat.spentPaise;
                return (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-foreground">{cat.name}</td>
                    <td className="py-4 px-6 font-semibold">
                      {Money.fromPaise(cat.allocatedPaise).format(plan.budget.currency)}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {Money.fromPaise(cat.spentPaise).format(plan.budget.currency)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-bold inline-flex items-center ${
                          isOver ? 'text-destructive' : 'text-success'
                        }`}
                      >
                        {isOver && <AlertTriangle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />}
                        {Money.fromPaise(toPaise(Math.abs(diff))).format(plan.budget.currency)}
                        {isOver ? ' (Over)' : ' (Under)'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground max-w-xs line-clamp-2">
                      {cat.rationale || 'Planned allocation'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Optimize Modal with Diff View */}
      <Modal
        isOpen={showOptimizeModal}
        onClose={() => setShowOptimizeModal(false)}
        title="AI Budget Deficit Optimization (Diff Proposal)"
      >
        <div className="space-y-4">
          {isOptimizing ? (
            <p className="py-8 text-center text-sm font-semibold text-muted-foreground animate-pulse">
              Gemini is evaluating your category allocations to pinpoint painless cost reductions...
            </p>
          ) : optimizeDiff ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground p-3 bg-primary/10 rounded-xl">
                Strategy: {optimizeDiff.overallStrategy}
              </p>

              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {optimizeDiff.trims?.map((trim: any) => (
                  <div key={trim.categoryId} className="p-4 bg-card text-sm space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{trim.categoryName}</span>
                      <span className="text-success font-black">
                        Save {plan.budget.currency} {trim.savingsRupees.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Current: {plan.budget.currency} {trim.currentAllocatedRupees.toLocaleString('en-IN')} →{' '}
                      <strong>
                        New: {plan.budget.currency} {trim.proposedNewAllocatedRupees.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <p className="text-xs text-primary font-medium mt-1">💡 Tip: {trim.actionableTrimTip}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOptimizeModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyOptimization}
                  className="px-5 py-2 rounded-xl text-sm font-extrabold bg-primary text-primary-foreground hover:bg-primary-hover shadow-md"
                >
                  Apply Proposed Trims
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};
