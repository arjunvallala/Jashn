'use client';

import React, { useState } from 'react';
import {
  Building,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Coins,
  Send,
  Calendar,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { VendorItem, VendorStatus, LanguageCode, toPaise } from '@/domain/types';
import { compareVendorQuoteToBudget, VENDOR_STATUS_ORDER } from '@/domain/vendors/vendorModel';
import { Money } from '@/domain/money';
import { TRANSLATIONS } from '@/lib/i18n';

interface VendorScreenProps {
  plan: ValidatedEventPlan;
  onUpdatePlan: (updated: ValidatedEventPlan) => void;
  language: LanguageCode;
}

const STATUS_LABELS: Record<VendorStatus, string> = {
  to_contact: '1. To Contact',
  quoted: '2. Quoted',
  negotiating: '3. Negotiating',
  booked: '4. Booked',
  paid: '5. Paid',
};

export const VendorScreen: React.FC<VendorScreenProps> = ({
  plan,
  onUpdatePlan,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedVendorId, setSelectedVendorId] = useState<string>(plan.vendors[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedVendor = plan.vendors.find(v => v.id === selectedVendorId) || plan.vendors[0];
  const matchingCategory = plan.budget.categories.find(c => c.id === selectedVendor?.categoryId);

  const quoteComparison = selectedVendor && matchingCategory
    ? compareVendorQuoteToBudget(selectedVendor, matchingCategory.allocatedPaise)
    : null;

  const handleStatusChange = (status: VendorStatus) => {
    if (!selectedVendor) return;
    const updated = plan.vendors.map(v => (v.id === selectedVendor.id ? { ...v, status } : v));
    onUpdatePlan({ ...plan, vendors: updated });
  };

  const handleUpdateQuote = (amountRupees: number, depositRupees: number, dueDate?: string) => {
    if (!selectedVendor) return;
    const updated = plan.vendors.map(v =>
      v.id === selectedVendor.id
        ? {
            ...v,
            quoteAmountPaise: toPaise(Math.round(amountRupees * 100)),
            depositAmountPaise: toPaise(Math.round(depositRupees * 100)),
            depositDueDate: dueDate,
          }
        : v,
    );
    onUpdatePlan({ ...plan, vendors: updated });
  };

  const copyInquiryToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Screen Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {t.vendors.title}
        </h1>
        {/* Strict Mandatory AI Rules Disclaimer */}
        <p className="text-sm font-semibold text-primary mt-1 flex items-center">
          <ShieldAlert className="w-4 h-4 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span>{t.vendors.disclaimer}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Vendor List & Status Pipeline */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-2">
            Service Categories
          </span>

          {plan.vendors.map(vendor => {
            const isSelected = selectedVendor?.id === vendor.id;
            return (
              <button
                key={vendor.id}
                type="button"
                onClick={() => setSelectedVendorId(vendor.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all min-h-touch flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-primary">{vendor.categoryName}</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {STATUS_LABELS[vendor.status]}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{vendor.serviceName}</h3>
                {vendor.quoteAmountPaise && (
                  <span className="text-xs font-bold text-muted-foreground mt-2 block">
                    Quote: {Money.fromPaise(vendor.quoteAmountPaise).format(plan.budget.currency)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Vendor Details, Checklist, Red Flags & Inquiry */}
        {selectedVendor && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm space-y-6">
              {/* Active Vendor Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-bold text-primary">{selectedVendor.categoryName}</span>
                  <h2 className="text-2xl font-black text-foreground">{selectedVendor.serviceName}</h2>
                </div>

                {/* Pipeline Status Selector */}
                <div>
                  <label htmlFor="pipeline-status" className="sr-only">
                    Update Pipeline Status
                  </label>
                  <select
                    id="pipeline-status"
                    value={selectedVendor.status}
                    onChange={e => handleStatusChange(e.target.value as VendorStatus)}
                    className="bg-muted text-foreground text-sm font-bold rounded-xl px-3 py-2 border border-border min-h-touch focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  >
                    {VENDOR_STATUS_ORDER.map(st => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quote Comparison vs Category Allocation */}
              {quoteComparison && matchingCategory && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">Category Allocation</span>
                    <span className="text-lg font-black text-foreground">
                      {Money.fromPaise(quoteComparison.allocatedPaise).format(plan.budget.currency)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">Recorded Quote</span>
                    <span className="text-lg font-black text-foreground">
                      {quoteComparison.quoteAmountPaise > 0
                        ? Money.fromPaise(quoteComparison.quoteAmountPaise).format(plan.budget.currency)
                        : 'No quote set yet'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-muted-foreground block">Variance</span>
                    <span
                      className={`text-lg font-black ${
                        quoteComparison.isWithinBudget ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {quoteComparison.quoteAmountPaise > 0
                        ? `${quoteComparison.isWithinBudget ? 'Under by' : 'Over by'} ${Money.fromPaise(
                            toPaise(Math.abs(quoteComparison.differencePaise)),
                          ).format(plan.budget.currency)}`
                        : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Questions to Ask Checklist */}
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center mb-3">
                  <HelpCircle className="w-4 h-4 text-primary mr-1.5" aria-hidden="true" />
                  <span>{t.vendors.questionsToAsk}</span>
                </h3>
                <ul className="space-y-2">
                  {selectedVendor.questionsToAsk.map((q, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-card border border-border text-xs text-foreground font-medium flex items-start space-x-2">
                      <span className="text-primary font-bold">{idx + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contract Red Flags to Avoid */}
              <div>
                <h3 className="text-sm font-bold text-destructive flex items-center mb-3">
                  <AlertTriangle className="w-4 h-4 text-destructive mr-1.5" aria-hidden="true" />
                  <span>{t.vendors.redFlags}</span>
                </h3>
                <ul className="space-y-2">
                  {selectedVendor.contractRedFlags.map((flag, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-xs text-foreground font-medium flex items-start space-x-2">
                      <span className="text-destructive font-bold">⚠️</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Inquiry Draft with One-Click Copy */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center">
                    <Send className="w-4 h-4 text-accent mr-1.5" aria-hidden="true" />
                    <span>{t.vendors.inquiryDraft}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyInquiryToClipboard(selectedVendor.inquiryDraft, selectedVendor.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover min-h-touch transition-all shadow-sm"
                  >
                    {copiedId === selectedVendor.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.vendors.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.vendors.copy}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono p-3 bg-card rounded-lg border border-border">
                  {selectedVendor.inquiryDraft}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
