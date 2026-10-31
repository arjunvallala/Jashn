'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Coins,
  Palette,
  CheckCircle2,
  Mic,
  MicOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  HeartHandshake,
} from 'lucide-react';
import { IntakeWizardInput, IntakeWizardSchema } from '@/domain/validators';
import { EventType, LanguageCode, SupportedCurrency } from '@/domain/types';
import { VoiceSpeechManager } from '@/lib/speech';
import { TRANSLATIONS } from '@/lib/i18n';

interface IntakeWizardProps {
  onPlanGenerated: (input: IntakeWizardInput) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  language: LanguageCode;
}

export const IntakeWizard: React.FC<IntakeWizardProps> = ({
  onPlanGenerated,
  onLoadSample,
  isLoading,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [currentStep, setCurrentStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Form State
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventDate, setEventDate] = useState('2026-12-18');
  const [city, setCity] = useState('Hyderabad');
  const [guestCount, setGuestCount] = useState(300);
  const [totalBudgetRupees, setTotalBudgetRupees] = useState(2500000); // 25 Lakhs
  const [currency, setCurrency] = useState<SupportedCurrency>('INR');
  const [styleVibe, setStyleVibe] = useState('Royal Heritage with Warm Floral Marigold & Terracotta Accents');
  const [mustHaves, setMustHaves] = useState('Authentic local biryani live counter, wheelchair accessible pathways, live acoustic music');
  const [dietary, setDietary] = useState('Pure vegetarian Jain counter, nut-free desserts');
  const [accessibility, setAccessibility] = useState('Step-free mandap ramp, senior citizen quiet lounge');
  const [cultureTraditions, setCultureTraditions] = useState('Traditional morning rituals, interfaith respectful seating');

  const handleVoiceInputForStyle = () => {
    if (isListening) {
      VoiceSpeechManager.stopSpeaking();
      setIsListening(false);
      return;
    }

    const listener = VoiceSpeechManager.startListening(
      language,
      transcript => {
        setStyleVibe(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        setLiveAnnouncement(`Voice recorded: ${transcript}`);
      },
      err => {
        setIsListening(false);
        setLiveAnnouncement(`Voice input error: ${err}`);
      },
    );

    if (listener) {
      setIsListening(true);
      setLiveAnnouncement('Listening... please speak your celebration vibe.');
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!city.trim() || city.trim().length < 2) {
        errors.city = 'Please enter a valid city (at least 2 characters).';
      }
      if (!eventDate || isNaN(new Date(eventDate).getTime())) {
        errors.eventDate = 'Please select a valid event calendar date.';
      }
      if (guestCount < 1 || guestCount > 50000) {
        errors.guestCount = 'Guest count must be between 1 and 50,000.';
      }
    } else if (currentStep === 2) {
      if (totalBudgetRupees < 1000) {
        errors.totalBudget = 'Total budget must be at least ₹1,000.';
      }
    } else if (currentStep === 3) {
      if (!styleVibe.trim() || styleVibe.trim().length < 2) {
        errors.styleVibe = 'Please specify a style or aesthetic vibe.';
      }
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstErrMsg = Object.values(errors)[0];
      setLiveAnnouncement(`Validation error: ${firstErrMsg}`);
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setLiveAnnouncement(`Moved to step ${next} of 3`);
    }
  };

  const handlePrevStep = () => {
    const prev = currentStep - 1;
    setCurrentStep(prev);
    setValidationErrors({});
    setLiveAnnouncement(`Moved back to step ${prev} of 3`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    const parsedMustHaves = mustHaves
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const parsedDietary = dietary
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const parsedAccessibility = accessibility
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const parsedCulture = cultureTraditions
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const payload: IntakeWizardInput = {
      eventType,
      eventDate,
      city: city.trim(),
      guestCount,
      totalBudgetRupees,
      currency,
      styleVibe: styleVibe.trim(),
      mustHaves: parsedMustHaves,
      constraints: {
        dietary: parsedDietary,
        accessibility: parsedAccessibility,
        cultureTraditions: parsedCulture,
        neutralPreferences: [],
      },
      language,
    };

    const result = IntakeWizardSchema.safeParse(payload);
    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        errMap[issue.path.join('.')] = issue.message;
      });
      setValidationErrors(errMap);
      setLiveAnnouncement('Please correct the highlighted form errors before proceeding.');
      return;
    }

    onPlanGenerated(result.data);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xl p-6 sm:p-10 transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-2xl mb-3">
            <Sparkles className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t.wizard.title}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{t.wizard.subtitle}</p>

          {/* Instant Sample Loader Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-secondary text-secondary-foreground hover:opacity-90 border border-primary/20 min-h-touch transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
            >
              <HeartHandshake className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{t.wizard.loadSample}</span>
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8" aria-label="Wizard Steps">
          <div className="flex items-center justify-between max-w-xs mx-auto">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep === step
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md'
                      : currentStep > step
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                  aria-current={currentStep === step ? 'step' : undefined}
                >
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 sm:w-16 h-1 mx-2 rounded transition-all ${
                      currentStep > step ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 text-sm font-semibold text-muted-foreground">
            {currentStep === 1 && t.wizard.step1}
            {currentStep === 2 && t.wizard.step2}
            {currentStep === 3 && t.wizard.step3}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* STEP 1: EVENT BASICS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Event Type */}
              <div>
                <label htmlFor="event-type" className="block text-sm font-bold text-foreground mb-2">
                  {t.wizard.eventType}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'wedding', label: 'Wedding' },
                    { id: 'birthday', label: 'Birthday' },
                    { id: 'community', label: 'Community' },
                    { id: 'other', label: 'Other Event' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEventType(item.id as EventType)}
                      className={`p-3 rounded-xl border font-semibold text-sm min-h-touch flex items-center justify-center transition-all ${
                        eventType === item.id
                          ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                      aria-pressed={eventType === item.id}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="event-date" className="block text-sm font-bold text-foreground mb-1.5">
                    {t.wizard.eventDate} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="event-date"
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      aria-describedby={validationErrors.eventDate ? 'error-event-date' : undefined}
                      aria-invalid={!!validationErrors.eventDate}
                      className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      required
                    />
                  </div>
                  {validationErrors.eventDate && (
                    <p id="error-event-date" className="mt-1 text-sm font-semibold text-destructive flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
                      {validationErrors.eventDate}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="event-city" className="block text-sm font-bold text-foreground mb-1.5">
                    {t.wizard.city} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="event-city"
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Hyderabad, Mumbai, Delhi"
                      aria-describedby={validationErrors.city ? 'error-city' : undefined}
                      aria-invalid={!!validationErrors.city}
                      className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      required
                    />
                  </div>
                  {validationErrors.city && (
                    <p id="error-city" className="mt-1 text-sm font-semibold text-destructive flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
                      {validationErrors.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label htmlFor="guest-count" className="block text-sm font-bold text-foreground mb-1.5">
                  {t.wizard.guestCount} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    id="guest-count"
                    type="number"
                    min="1"
                    max="50000"
                    value={guestCount}
                    onChange={e => setGuestCount(parseInt(e.target.value, 10) || 0)}
                    aria-describedby={validationErrors.guestCount ? 'error-guest-count' : undefined}
                    aria-invalid={!!validationErrors.guestCount}
                    className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                    required
                  />
                </div>
                {validationErrors.guestCount && (
                  <p id="error-guest-count" className="mt-1 text-sm font-semibold text-destructive flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
                    {validationErrors.guestCount}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET & CURRENCY */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor="total-budget" className="block text-sm font-bold text-foreground mb-1.5">
                    {t.wizard.totalBudget} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="total-budget"
                    type="number"
                    min="1000"
                    step="1000"
                    value={totalBudgetRupees}
                    onChange={e => setTotalBudgetRupees(parseFloat(e.target.value) || 0)}
                    aria-describedby={validationErrors.totalBudget ? 'error-total-budget' : undefined}
                    aria-invalid={!!validationErrors.totalBudget}
                    className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm text-lg font-bold"
                    required
                  />
                  {validationErrors.totalBudget && (
                    <p id="error-total-budget" className="mt-1 text-sm font-semibold text-destructive flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
                      {validationErrors.totalBudget}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Estimated cost per guest:{' '}
                    <strong>
                      {currency} {Math.round(totalBudgetRupees / Math.max(1, guestCount)).toLocaleString('en-IN')}
                    </strong>{' '}
                    (A 10% contingency reserve is automatically protected).
                  </p>
                </div>

                <div>
                  <label htmlFor="currency-select" className="block text-sm font-bold text-foreground mb-1.5">
                    {t.wizard.currency}
                  </label>
                  <select
                    id="currency-select"
                    value={currency}
                    onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                  </select>
                </div>
              </div>

              {/* Quick Budget Chips */}
              <div>
                <span className="block text-xs font-semibold text-muted-foreground mb-2">
                  Quick Budget Presets (INR):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '₹5 Lakhs', val: 500000 },
                    { label: '₹15 Lakhs', val: 1500000 },
                    { label: '₹25 Lakhs', val: 2500000 },
                    { label: '₹50 Lakhs', val: 5000000 },
                    { label: '₹1 Crore', val: 10000000 },
                  ].map(chip => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setTotalBudgetRupees(chip.val)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-primary/10 hover:text-primary border border-border min-h-touch transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VIBE, MUST-HAVES & INCLUSIVITY */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Style & Vibe with Voice Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="style-vibe" className="block text-sm font-bold text-foreground">
                    {t.wizard.styleVibe} <span className="text-destructive">*</span>
                  </label>
                  {VoiceSpeechManager.isSpeechRecognitionSupported() && (
                    <button
                      type="button"
                      onClick={handleVoiceInputForStyle}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all min-h-touch ${
                        isListening
                          ? 'bg-destructive text-destructive-foreground animate-pulse'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      aria-pressed={isListening}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          <span>Speak Vibe</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  id="style-vibe"
                  rows={2}
                  value={styleVibe}
                  onChange={e => setStyleVibe(e.target.value)}
                  placeholder="e.g. Traditional Deccan heritage elegance with marigold draping and acoustic sufi music"
                  aria-describedby={validationErrors.styleVibe ? 'error-style-vibe' : undefined}
                  aria-invalid={!!validationErrors.styleVibe}
                  className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                  required
                />
                {validationErrors.styleVibe && (
                  <p id="error-style-vibe" className="mt-1 text-sm font-semibold text-destructive flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
                    {validationErrors.styleVibe}
                  </p>
                )}
              </div>

              {/* Must-Haves */}
              <div>
                <label htmlFor="must-haves" className="block text-sm font-bold text-foreground mb-1.5">
                  {t.wizard.mustHaves}
                </label>
                <input
                  id="must-haves"
                  type="text"
                  value={mustHaves}
                  onChange={e => setMustHaves(e.target.value)}
                  placeholder="e.g. Drone photography, Halal live counters, wheelchair access"
                  className="w-full bg-card text-foreground border border-border rounded-xl px-3.5 py-2.5 min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                />
              </div>

              {/* Inclusivity & Care Constraints */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                <span className="block text-sm font-bold text-foreground">
                  {t.wizard.constraints}
                </span>

                <div>
                  <label htmlFor="dietary-constraints" className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t.wizard.dietary}
                  </label>
                  <input
                    id="dietary-constraints"
                    type="text"
                    value={dietary}
                    onChange={e => setDietary(e.target.value)}
                    placeholder="e.g. Pure Jain counter, vegan desserts, gluten-free"
                    className="w-full bg-card text-foreground border border-border rounded-lg px-3 py-2 text-sm min-h-touch focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="accessibility-constraints" className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t.wizard.accessibility}
                  </label>
                  <input
                    id="accessibility-constraints"
                    type="text"
                    value={accessibility}
                    onChange={e => setAccessibility(e.target.value)}
                    placeholder="e.g. Wheelchair ramp to stage, quiet sensory room"
                    className="w-full bg-card text-foreground border border-border rounded-lg px-3 py-2 text-sm min-h-touch focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="culture-constraints" className="block text-xs font-semibold text-muted-foreground mb-1">
                    {t.wizard.cultureTraditions}
                  </label>
                  <input
                    id="culture-constraints"
                    type="text"
                    value={cultureTraditions}
                    onChange={e => setCultureTraditions(e.target.value)}
                    placeholder="e.g. Auspicious morning Muhurtham, interfaith blessing"
                    className="w-full bg-card text-foreground border border-border rounded-lg px-3 py-2 text-sm min-h-touch focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-border bg-card hover:bg-muted text-foreground min-h-touch transition-all"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{t.wizard.back}</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-hover min-h-touch transition-all shadow-md focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{t.wizard.next}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl text-base font-extrabold bg-primary text-primary-foreground hover:bg-primary-hover min-h-touch transition-all shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                    <span>{t.wizard.generatingNotice}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    <span>{t.wizard.generate}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
