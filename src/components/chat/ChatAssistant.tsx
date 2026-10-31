'use client';

import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Mic,
  MicOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import { ValidatedEventPlan } from '@/domain/validators';
import { PlanProposal, LanguageCode, toPaise } from '@/domain/types';
import { VoiceSpeechManager } from '@/lib/speech';
import { TRANSLATIONS } from '@/lib/i18n';

interface ChatAssistantProps {
  plan: ValidatedEventPlan;
  onUpdatePlan: (updated: ValidatedEventPlan) => void;
  language: LanguageCode;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  plan,
  onUpdatePlan,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: `Hello! I am your Jashn Planning Assistant. How can I help you adjust your budget, schedule milestones, or negotiate with vendors today?`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [pendingProposals, setPendingProposals] = useState<PlanProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    if (isListening) {
      VoiceSpeechManager.stopSpeaking();
      setIsListening(false);
      return;
    }

    const listener = VoiceSpeechManager.startListening(
      language,
      transcript => {
        setInputMessage(transcript);
        setIsListening(false);
      },
      () => setIsListening(false),
    );

    if (listener) {
      setIsListening(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Build compact plan summary to save tokens
    const compactSummary = `Title: ${plan.title} | Type: ${plan.eventType} | Date: ${plan.eventDate} | City: ${plan.city} | Guests: ${plan.guestCount} | Budget: ${plan.budget.totalBudgetPaise / 100} ${plan.budget.currency} | Remaining: ${(plan.budget.totalBudgetPaise - plan.budget.categories.reduce((s, c) => s + c.spentPaise, 0)) / 100} | Total Tasks: ${plan.tasks.length}`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          compactPlanSummary: compactSummary,
          language,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.replyText }]);

      if (data.proposals && data.proposals.length > 0) {
        setPendingProposals(prev => [...prev, ...data.proposals]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'I encountered a connection issue. You can continue updating your budget or timeline directly.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyProposal = (proposal: PlanProposal) => {
    if (proposal.applied) return;

    if (proposal.type === 'propose_budget_change') {
      const { categoryId, newWeight } = proposal.payload as any;
      const updatedCategories = plan.budget.categories.map(c =>
        c.id === categoryId ? { ...c, weight: Number(newWeight) } : c,
      );
      onUpdatePlan({ ...plan, budget: { ...plan.budget, categories: updatedCategories } });
    } else if (proposal.type === 'add_task') {
      const { title, description, categoryId, dayOffset, priority } = proposal.payload as any;
      const newTask = {
        id: `custom-task-${Date.now()}`,
        title: String(title),
        description: String(description || ''),
        categoryId: String(categoryId || 'venue_decor'),
        phase: '1_month_out' as any,
        dueDate: plan.eventDate,
        dayOffset: Number(dayOffset || 0),
        dependencies: [],
        completed: false,
        priority: (priority as any) || 'medium',
        isCriticalPath: false,
        source: 'ai' as const,
      };
      onUpdatePlan({ ...plan, tasks: [...plan.tasks, newTask] });
    } else if (proposal.type === 'update_vendor_status') {
      const { vendorId, status } = proposal.payload as any;
      const updatedVendors = plan.vendors.map(v => (v.id === vendorId ? { ...v, status } : v));
      onUpdatePlan({ ...plan, vendors: updatedVendors });
    } else if (proposal.type === 'suggest_ideas') {
      const { categoryId, title, description, costTier, whyItFits } = proposal.payload as any;
      const newIdea = {
        id: `custom-idea-${Date.now()}`,
        categoryId: String(categoryId || 'venue_decor'),
        categoryName: 'Celebration Styling',
        title: String(title),
        description: String(description || ''),
        whyItFits: String(whyItFits || ''),
        costTier: (costTier as any) || '₹₹',
        estimatedBudgetPercent: 3,
        pinned: true,
        tags: ['assistant'],
      };
      onUpdatePlan({ ...plan, ideas: [newIdea, ...plan.ideas] });
    }

    setPendingProposals(prev =>
      prev.map(p => (p.id === proposal.id ? { ...p, applied: true } : p)),
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-border">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">AI Planning Assistant</h1>
          <p className="text-xs text-muted-foreground">
            Gemini with Function Calling. Proposes budget edits, tasks, or vendor shifts via confirmed diffs.
          </p>
        </div>
      </div>

      {/* Pending Diff Proposals (CRITICAL: Never mutates plan without user clicking Apply) */}
      {pendingProposals.filter(p => !p.applied).length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-primary tracking-wider block">
            Pending AI Proposals for Review ({pendingProposals.filter(p => !p.applied).length})
          </span>
          {pendingProposals
            .filter(p => !p.applied)
            .map(proposal => (
              <div
                key={proposal.id}
                className="p-4 rounded-2xl bg-primary/5 border-2 border-primary/30 flex items-start justify-between gap-4 shadow-sm"
              >
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">{proposal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{proposal.description}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-card border border-border">
                    Diff: {proposal.diffSummary}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyProposal(proposal)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground hover:bg-primary-hover shadow min-h-touch flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Apply Proposal</span>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Messages Window */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-4 sm:p-6 shadow-sm min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>
            <div
              className={`p-4 rounded-2xl max-w-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                  : 'bg-muted text-foreground rounded-tl-none leading-relaxed'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground text-xs font-medium py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Assistant is thinking...</span>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSendMessage} className="relative flex items-center">
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder="Ask e.g. 'Propose a 10% trim from Decor to increase Catering' or 'Add a task for Muhurtham'..."
          disabled={isLoading}
          className="w-full bg-card text-foreground border border-border rounded-2xl pl-4 pr-24 py-3.5 text-sm min-h-touch focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
        />
        <div className="absolute right-2 flex items-center space-x-1">
          {VoiceSpeechManager.isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`p-2 rounded-xl min-h-touch min-w-touch flex items-center justify-center ${
                isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:bg-muted'
              }`}
              title="Voice dictation"
              aria-label="Voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-primary" />}
            </button>
          )}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40 min-h-touch min-w-touch flex items-center justify-center transition-all shadow-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
