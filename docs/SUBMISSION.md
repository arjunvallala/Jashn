# Jashn (जश्न) - Hackathon Challenge 5 Submission

> **Jashn** is a production-grade, privacy-first, accessible GenAI celebration and event planner web app designed for weddings, milestone birthdays, and community festivals. Built for Google Hackathon Challenge 5.

---

## 1. Features Description

### Core Philosophy: Deterministic Core + Qualitative AI
LLMs struggle with precise arithmetic and strict calendar scheduling. **Jashn** solves this by strictly separating responsibilities:
- **The Deterministic Core (Domain Layer)** owns all mathematical invariants, integer paise accounting, Hare-Niemeyer largest-remainder budget allocations, Critical Path Method (CPM) dependency graphs, lead-time feasibility checks, and ICS generation.
- **The GenAI Layer (Gemini)** proposes qualitative domain content, cultural nuances, category weighting rationales, negotiation questions, and personalized ideas.

### Key Capabilities
1. **Intake Wizard**: Accessible multi-step wizard with step progression, keyboard navigation, and live screen reader updates. Collects celebration type, event date, guest count, integer budget, style/vibe, and cultural/accessibility constraints with zero PII.
2. **Budget Engine & Tracker**:
   - Zero floating-point arithmetic: 100% integer minor units (paise).
   - Hare-Niemeyer largest-remainder normalization guarantees that category allocations sum *exactly* to the target budget without off-by-one or rounding drift.
   - Real-time what-if simulation (re-split on guest count or budget change) and contingency reserve protection (5-10%).
   - Overspend alerts with triple-redundant indicators (text, icon, and WCAG-compliant color).
   - AI Budget Optimization: Proposes cost-cutting actions without mutating the plan until explicitly applied.
3. **Timeline & Critical Path Engine**:
   - Back-scheduling algorithm calculating start dates from lead time offsets and inter-task dependencies.
   - Cycle detection and automatic lead-time compression with explicit risk warnings for compressed lead times.
   - Phase filtering (12 months out, 1 month out, week of, day-of run-of-show).
   - RFC 5545 compliant `.ics` calendar export with proper UID and CRLF line wrapping.
4. **Vendor Checklists & Due Diligence**:
   - Per-category checklists with pipeline status tracking (To Contact → Quoted → Negotiating → Booked → Paid).
   - Side-by-side quote comparison against category budget caps.
   - AI generates inquiry draft messages, interview questions, and critical contract red flags.
   - **Strict Grounding Rule**: The AI never fabricates fake vendor names, phone numbers, or ratings.
5. **Personalized Creative Ideas**:
   - Curated ideas across decor, entertainment, food/drink, and guest experience with cost tiers (₹ / ₹₹ / ₹₹₹).
   - Interactive refinement chips ("Make it cheaper", "More traditional", "More modern", "More accessible").
   - Pinning and saving ideas to local plan state.
6. **AI Planning Assistant (Chat)**:
   - Function calling with proposal-only safety: AI tools propose diffs (e.g., `propose_budget_change`, `add_task`), and the plan is mutated *only* when the user explicitly reviews and accepts the change.
   - Multi-turn compact context to prevent token bloat.
7. **Local-First Data Privacy & Export**:
   - Schema-versioned `localStorage` with Zod validation on boot. No accounts, no database, no remote data leaks.
   - Full JSON/CSV/ICS data export and instant "Delete all my data" functionality.
8. **Resilience & Offline Fallback**:
   - Automatic single-retry with error feedback on malformed AI output.
   - Seamless, instant fallback to deterministic template plans if offline or if the API key is not configured.

---

## 2. GenAI Services Used

- **Model**: `gemini-2.5-flash` (configurable via `GEMINI_MODEL` environment variable).
- **SDK**: Official `@google/genai` SDK on server-side Next.js App Router API endpoints.
- **Structured Outputs**: Strict JSON schemas (`responseMimeType: "application/json"`, `responseSchema`) validated via `zod`.
- **Security & Privacy Guardrails**:
  - Client inputs are stripped of PII (names, phone numbers, email addresses) before prompt interpolation.
  - User inputs are encapsulated in `<untrusted_user_data>` delimiters with system prompt instructions to ignore instructions inside user content.
  - In-memory SHA-256 caching with TTL to eliminate redundant API calls and prevent token waste.
  - Per-IP rate limiting (token bucket) on all `/api/ai/*` routes.

---

## 3. Demo Video Script (2 Minutes)

| Timestamp | Shot / Visual | Voiceover / Action |
| :--- | :--- | :--- |
| **0:00 - 0:15** | Homepage / Splash hero with high contrast, dark/light toggle, and clean typography. | *"Planning celebrations shouldn't mean drowning in spreadsheets or stressing over math. Meet Jashn—an AI celebration planner that pairs the intelligence of Google Gemini with a deterministic, mathematically bulletproof core."* |
| **0:15 - 0:35** | Step-by-step Intake Wizard: choosing "Traditional South Indian Wedding", Bengaluru, 350 guests, ₹15,00,000 budget, dietary constraints. | *"Our intake wizard collects celebration details without asking for personal identifiers. Zero personal info is sent to the cloud. Notice keyboard accessibility and instant validation."* |
| **0:35 - 0:55** | Budget Tracker screen: Hare-Niemeyer allocation, slider adjustment, what-if re-split. | *"Behind the scenes, Jashn allocates funds using integer paise and the Hare-Niemeyer largest-remainder method—guaranteeing the split sums exactly to your total. No rounding errors. When costs fluctuate, what-if simulations instantly recalculate."* |
| **0:55 - 1:15** | Timeline & Back-scheduler: calendar view, lead-time compression warning, ICS export. | *"Timelines are scheduled backwards from the event date. If time is short, Jashn detects compressed lead times and highlights the critical path. You can export an RFC 5545 compliant ICS file straight to Google Calendar or Apple Calendar."* |
| **1:15 - 1:35** | Vendor Checklists & Ideas Screen with refinement chips. | *"In the vendor hub, compare quotes against category budgets. Gemini generates contract red flags and inquiry messages without ever hallucinating fake vendors. Filter ideas with one click to 'Make it cheaper' or 'More accessible'."* |
| **1:35 - 1:50** | Chat Assistant: propose task diff, user reviews and clicks "Apply". | *"The AI chat assistant proposes plan changes through structured diffs. Nothing modifies your plan until you explicitly review and approve it."* |
| **1:50 - 2:00** | Data export, delete all data, Netlify deployment badge. | *"Local-first, accessible, resilient offline, and deployed in seconds to Netlify. Jashn: celebrate with confidence."* |

---

## 4. LinkedIn Post Draft (<= 150 words)

> Excited to unveil **Jashn (जश्न)**, an open-source GenAI celebration & event planner built for the Google Hackathon Challenge 5! 🎉
>
> Most AI planners fail because LLMs struggle with precise math and scheduling. Jashn solves this with a **deterministic core + qualitative AI** architecture:
> • Integer paise accounting & Hare-Niemeyer largest-remainder budget allocations (zero rounding errors)
> • Critical Path Method (CPM) back-scheduling with lead-time feasibility guards & RFC 5545 .ics export
> • Grounded vendor diligence—contract red flags & interview drafts without hallucinating fake businesses
> • Proposal-only AI chat diffs—you stay in full control
> • 100% local-first privacy, WCAG 2.2 AA accessibility, and offline resilience
>
> Powered by Google Gemini 2.5 Flash & Next.js, deployed on Netlify.
>
> 💻 GitHub: https://github.com/arjunvallala/Jashn
>
> #GoogleAI #Gemini #WebDevelopment #NextJS #TypeScript #Accessibility #OpenSource

---

## 5. Submission Checklist Verification

- [x] **Code Quality**: Strict TypeScript (`noUncheckedIndexedAccess`), modular domain architecture with zero upward dependencies.
- [x] **Security**: Server-only `@google/genai` SDK, PII sanitization, untrusted data wrapping, rate limiting, and security headers.
- [x] **Efficiency**: In-memory SHA-256 caching, single batched plan generation, memoized calculations.
- [x] **Testing**: Extensive unit, property-based (`fast-check`), and contract test suites covering all domain invariants.
- [x] **Accessibility**: WCAG 2.2 AA compliant, keyboard operable, high contrast, focus traps, and screen reader announcements.
- [x] **Netlify Deployment Ready**: Configured with `netlify.toml` and `@netlify/plugin-nextjs`.
