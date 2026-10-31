'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  Pin,
  PinOff,
  Sparkles,
  TrendingDown,
  RefreshCw,
  Heart,
  Tag,
  Loader2,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { EventIdea, LanguageCode } from '@/domain/types';
import { TRANSLATIONS } from '@/lib/i18n';

interface IdeasScreenProps {
  plan: ValidatedEventPlan;
  onUpdatePlan: (updated: ValidatedEventPlan) => void;
  language: LanguageCode;
}

export const IdeasScreen: React.FC<IdeasScreenProps> = ({
  plan,
  onUpdatePlan,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const togglePinIdea = (ideaId: string) => {
    const updated = plan.ideas.map(i => (i.id === ideaId ? { ...i, pinned: !i.pinned } : i));
    onUpdatePlan({ ...plan, ideas: updated });
  };

  const handleRefineCategory = async (chip: 'cheaper' | 'more_traditional' | 'more_modern' | 'more_accessible') => {
    setIsRegenerating(true);
    const targetCategory = selectedCategory !== 'all' ? selectedCategory : plan.budget.categories[0]?.id || 'venue_decor';
    const catName = plan.budget.categories.find(c => c.id === targetCategory)?.name || 'Celebration Styling';

    try {
      const res = await fetch('/api/ai/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: targetCategory,
          categoryName: catName,
          eventType: plan.eventType,
          styleVibe: plan.styleVibe,
          constraintsSummary: `${plan.constraints.dietary.join(', ')} | ${plan.constraints.accessibility.join(', ')}`,
          refinementChip: chip,
          language,
        }),
      });

      const data = await res.json();
      if (data.ideas) {
        // Append new ideas to plan
        onUpdatePlan({
          ...plan,
          ideas: [...data.ideas, ...plan.ideas],
        });
      }
    } catch {
      // Fallback idea
      const fallbackIdea: EventIdea = {
        id: `idea-chip-${Date.now()}`,
        categoryId: targetCategory,
        categoryName: catName,
        title: `Custom ${chip.replace('_', ' ')} Solution for ${catName}`,
        description: 'Locally curated, budget-efficient alternative designed for your guest list.',
        whyItFits: 'Customized based on your active refinement chip.',
        costTier: chip === 'cheaper' ? '₹' : '₹₹',
        estimatedBudgetPercent: 3,
        pinned: false,
        tags: [chip],
      };
      onUpdatePlan({
        ...plan,
        ideas: [fallbackIdea, ...plan.ideas],
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const filteredIdeas = plan.ideas.filter(i => {
    if (selectedCategory === 'all') return true;
    return i.categoryId === selectedCategory;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t.ideas.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized themes, decor, menu, and entertainment traceable to your inputs.
          </p>
        </div>

        {/* Refinement Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'cheaper', label: 'Make It Cheaper (₹)' },
            { id: 'more_traditional', label: 'More Traditional' },
            { id: 'more_modern', label: 'More Modern' },
            { id: 'more_accessible', label: 'More Accessible' },
          ].map(chip => (
            <button
              key={chip.id}
              type="button"
              disabled={isRegenerating}
              onClick={() => handleRefineCategory(chip.id as any)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-primary/10 hover:text-primary border border-border min-h-touch transition-all disabled:opacity-50"
            >
              {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : '+ '}
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar" role="tablist">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-touch transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          }`}
        >
          All Categories ({plan.ideas.length})
        </button>
        {plan.budget.categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-touch transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:bg-muted'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas.map(idea => (
          <div
            key={idea.id}
            className={`bg-card text-card-foreground rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
              idea.pinned ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary">{idea.categoryName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {idea.costTier} ({idea.estimatedBudgetPercent}% budget)
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePinIdea(idea.id)}
                    className="p-1 text-muted-foreground hover:text-primary min-h-touch min-w-touch flex items-center justify-center"
                    aria-label={idea.pinned ? 'Unpin idea' : 'Pin idea'}
                  >
                    {idea.pinned ? (
                      <Pin className="w-4 h-4 text-primary fill-primary" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-foreground mb-2">{idea.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{idea.description}</p>
            </div>

            <div className="pt-3 border-t border-border/60">
              <span className="text-[11px] font-semibold text-primary block mb-2">
                🎯 Why it fits: {idea.whyItFits}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {idea.tags.map(t => (
                  <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
