'use client';

import React from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  Sun,
  Moon,
  Eye,
  Database,
  HelpCircle,
} from 'lucide-react';
import { LanguageCode } from '@/domain/types';
import { TRANSLATIONS } from '@/lib/i18n';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  theme: 'light' | 'dark' | 'high-contrast';
  onThemeChange: (theme: 'light' | 'dark' | 'high-contrast') => void;
  plainLanguage: boolean;
  onTogglePlainLanguage: () => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onOpenDataModal: () => void;
  hasPlan: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  plainLanguage,
  onTogglePlainLanguage,
  isSpeaking,
  onToggleSpeech,
  onOpenDataModal,
  hasPlan,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const tabs = [
    { id: 'dashboard', label: t.nav.dashboard },
    { id: 'budget', label: t.nav.budget },
    { id: 'timeline', label: t.nav.timeline },
    { id: 'vendors', label: t.nav.vendors },
    { id: 'ideas', label: t.nav.ideas },
    { id: 'chat', label: t.nav.chat },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center space-x-2 text-primary font-black text-2xl tracking-tight focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
              aria-label="Jashn - Celebration Planner Home"
            >
              <span className="p-2 bg-primary/10 text-primary rounded-xl">
                <Sparkles className="w-6 h-6" aria-hidden="true" />
              </span>
              <span>{t.appName}</span>
            </button>
          </div>

          {/* Accessibility & Customization Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Plain Language Mode Toggle */}
            <button
              type="button"
              onClick={onTogglePlainLanguage}
              className={`p-2 rounded-lg text-sm font-medium min-h-touch min-w-touch flex items-center space-x-1.5 transition-colors ${
                plainLanguage
                  ? 'bg-secondary text-secondary-foreground font-bold border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title="Toggle Plain-Language Mode (Simplifies budget & scheduling terms)"
              aria-pressed={plainLanguage}
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span className="hidden md:inline">
                {plainLanguage ? 'Plain Language: ON' : 'Plain Language'}
              </span>
            </button>

            {/* Read Aloud (TTS) Button */}
            {hasPlan && (
              <button
                type="button"
                onClick={onToggleSpeech}
                className={`p-2 rounded-lg min-h-touch min-w-touch flex items-center justify-center transition-colors ${
                  isSpeaking
                    ? 'bg-accent text-accent-foreground font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={isSpeaking ? 'Stop reading aloud' : 'Read celebration plan aloud'}
                aria-label={isSpeaking ? 'Stop reading plan aloud' : 'Read celebration plan aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-5 h-5 text-destructive" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            )}

            {/* Language Switcher */}
            <div className="relative inline-flex items-center">
              <label htmlFor="language-select" className="sr-only">
                Select Language
              </label>
              <Languages className="w-4 h-4 text-muted-foreground mr-1.5 hidden sm:inline" aria-hidden="true" />
              <select
                id="language-select"
                value={language}
                onChange={e => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-muted text-foreground text-sm font-medium rounded-lg px-2.5 py-1.5 border border-border min-h-touch focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="en" lang="en">
                  English
                </option>
                <option value="hi" lang="hi">
                  हिंदी (Hindi)
                </option>
                <option value="te" lang="te">
                  తెలుగు (Telugu)
                </option>
              </select>
            </div>

            {/* Theme Toggle (Light / Dark / High-Contrast) */}
            <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`p-1.5 rounded-md min-h-touch min-w-touch flex items-center justify-center transition-all ${
                  theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
                title="Light Theme"
                aria-label="Switch to light theme"
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`p-1.5 rounded-md min-h-touch min-w-touch flex items-center justify-center transition-all ${
                  theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
                title="Dark Theme"
                aria-label="Switch to dark theme"
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('high-contrast')}
                className={`p-1.5 rounded-md min-h-touch min-w-touch flex items-center justify-center transition-all ${
                  theme === 'high-contrast'
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground'
                }`}
                title="High-Contrast Theme (WCAG AA)"
                aria-label="Switch to high contrast theme"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Data & Privacy Controls */}
            <button
              type="button"
              onClick={onOpenDataModal}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground min-h-touch min-w-touch flex items-center justify-center transition-colors"
              title="Data Export, Import & Privacy Controls"
              aria-label="Data export and privacy controls"
            >
              <Database className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        {hasPlan && (
          <nav
            className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-border/50 no-scrollbar"
            aria-label="Celebration Sections"
          >
            {tabs.map(tab => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap min-h-touch transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
