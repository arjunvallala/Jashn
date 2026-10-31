'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { SkipLink } from '@/components/common/SkipLink';
import { IntakeWizard } from '@/components/intake/IntakeWizard';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { BudgetScreen } from '@/components/budget/BudgetScreen';
import { TimelineScreen } from '@/components/timeline/TimelineScreen';
import { VendorScreen } from '@/components/vendors/VendorScreen';
import { IdeasScreen } from '@/components/ideas/IdeasScreen';
import { ChatAssistant } from '@/components/chat/ChatAssistant';
import { DataControlModal } from '@/components/data/DataControlModal';
import { LocalPlanStorage } from '@/lib/storage';
import { ValidatedEventPlan, IntakeWizardInput } from '@/domain/validators';
import { LanguageCode } from '@/domain/types';
import { VoiceSpeechManager } from '@/lib/speech';
import { Money } from '@/domain/money';

export default function HomePage() {
  const [plan, setPlan] = useState<ValidatedEventPlan | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client load
  useEffect(() => {
    const saved = LocalPlanStorage.load();
    if (saved) {
      setPlan(saved);
      setLanguage(saved.language || 'en');
    }
    setIsHydrated(true);
  }, []);

  // Update theme classes on HTML element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('dark', 'high-contrast');
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'high-contrast') {
        root.classList.add('high-contrast');
      }
    }
  }, [theme]);

  // Handle TTS Read-Aloud
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      VoiceSpeechManager.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!plan) return;

    const remainingPaise = plan.budget.totalBudgetPaise - plan.budget.categories.reduce((s, c) => s + c.spentPaise, 0);
    const speechScript = `Celebration Plan for ${plan.title}. Event date is ${plan.eventDate} in ${plan.city} for ${plan.guestCount} guests. Total budget is ${Money.fromPaise(plan.budget.totalBudgetPaise).format(plan.budget.currency)}, with ${Money.fromPaise(plan.budget.contingencyPaise).format(plan.budget.currency)} protected in contingency reserve. You have ${plan.tasks.length} milestones and ${plan.vendors.length} vendor categories.`;

    VoiceSpeechManager.speak(speechScript, language);
    setIsSpeaking(true);
  };

  const handlePlanGenerated = async (input: IntakeWizardInput) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (data.plan) {
        setPlan(data.plan);
        LocalPlanStorage.save(data.plan);
        setCurrentTab('dashboard');
      }
    } catch {
      // Deterministic client fallback if network fails
      const sample = LocalPlanStorage.loadSampleWedding();
      setPlan(sample);
      setCurrentTab('dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleWedding = () => {
    const sample = LocalPlanStorage.loadSampleWedding();
    setPlan(sample);
    setCurrentTab('dashboard');
  };

  const handleUpdatePlan = (updated: ValidatedEventPlan) => {
    setPlan(updated);
    LocalPlanStorage.save(updated);
  };

  const handleToggleTaskCompleted = (taskId: string) => {
    if (!plan) return;
    const updatedTasks = plan.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    handleUpdatePlan({ ...plan, tasks: updatedTasks });
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-semibold text-sm">
        Loading Jashn Planner...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <SkipLink />

      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeChange={setTheme}
        plainLanguage={plainLanguage}
        onTogglePlainLanguage={() => setPlainLanguage(!plainLanguage)}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        hasPlan={!!plan}
      />

      <main id="main-content" className="flex-1 pb-16">
        {!plan ? (
          <IntakeWizard
            onPlanGenerated={handlePlanGenerated}
            onLoadSample={handleLoadSampleWedding}
            isLoading={isLoading}
            language={language}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardOverview
                plan={plan}
                onNavigateTab={setCurrentTab}
                language={language}
                onToggleTaskCompleted={handleToggleTaskCompleted}
              />
            )}
            {currentTab === 'budget' && (
              <BudgetScreen
                plan={plan}
                onUpdatePlan={handleUpdatePlan}
                language={language}
                plainLanguage={plainLanguage}
              />
            )}
            {currentTab === 'timeline' && (
              <TimelineScreen
                plan={plan}
                onUpdatePlan={handleUpdatePlan}
                language={language}
              />
            )}
            {currentTab === 'vendors' && (
              <VendorScreen
                plan={plan}
                onUpdatePlan={handleUpdatePlan}
                language={language}
              />
            )}
            {currentTab === 'ideas' && (
              <IdeasScreen
                plan={plan}
                onUpdatePlan={handleUpdatePlan}
                language={language}
              />
            )}
            {currentTab === 'chat' && (
              <ChatAssistant
                plan={plan}
                onUpdatePlan={handleUpdatePlan}
                language={language}
              />
            )}
          </>
        )}
      </main>

      <DataControlModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        plan={plan}
        onPlanImported={imported => {
          setPlan(imported);
          setCurrentTab('dashboard');
        }}
        onPlanDeleted={() => {
          setPlan(null);
          setCurrentTab('dashboard');
        }}
      />
    </div>
  );
}
