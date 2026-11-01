# Code Quality Audit & Baseline Report

**Project**: Jashn (जश्न) — GenAI Celebration & Event Planner  
**Date**: November 1, 2026  
**Status**: Phase 1 Audit Complete (Baseline Established)  
**Objective**: Elevate Code Quality score from 89 to 95+ while preserving Security (99), Efficiency (100), Testing (98), Accessibility (99), and Problem Statement Alignment (100).

---

## 1. Baseline Measurements

All measurements captured on clean `main` branch before any refactoring:

| Metric | Baseline Value | Tool / Command | Status |
| :--- | :--- | :--- | :--- |
| **ESLint Warnings & Errors** | 0 warnings, 0 errors | `npm run lint` | Pass |
| **TypeScript Typecheck** | 0 errors | `npm run typecheck` (`tsc --noEmit`) | Pass |
| **Unit Tests Passing** | 40 / 40 passing (10 suites) | `npm test` (`vitest run`) | Pass |
| **Code Coverage (Lines)** | 47.60% (Domain: 96.2%, AI: 66.4%, Components: 0%) | `npm run test:coverage` | Needs UI coverage |
| **Circular Dependencies** | 0 circular dependencies | `npx madge --circular --extensions ts,tsx src` | Pass |
| **Code Duplication** | 4 clones, 61 lines (0.82%) | `npx jscpd src` | Target 0% |
| **Explicit `any` Casts** | 19 occurrences | AST / regex scan | Target 0 |
| **Non-Null Assertions (`!`)** | 3 occurrences | AST / regex scan | Target 0 |
| `@ts-ignore` / `@ts-nocheck` | 0 occurrences | AST / regex scan | Zero (clean) |
| `eslint-disable` Directives | 0 occurrences | AST / regex scan | Zero (clean) |
| `console.log` Calls | 3 occurrences (strictly in `logger.ts`) | AST / regex scan | Well-isolated |
| TODO / FIXME Comments | 0 occurrences | Search scan | Zero (clean) |
| **Oversized Files (> 200 lines)**| 14 files | Line counter | Target < 250 for code |
| **Long Functions (> 40 lines)** | 21 functions | Complexity scan | Target modularity |
| **Unused Dependencies** | 2 dependencies (`clsx`, `tailwind-merge`), 2 devDeps | `npx depcheck` | Clean up / utilize |
| **E2E / A11y Suite Status** | Missing test spec files in `tests/` | `npx playwright test` | Add specs |
| **Production Build** | Clean build (87.2 kB First Load JS) | `npm run build` | Pass |

---

## 2. Detailed Findings by Category

### A. Code Duplication (jscpd: 4 clones, 61 lines)
1. **Fallback vs Reconciliation Event Category Extraction**:
   - `src/ai/fallback.ts:10-21` & `src/ai/reconciliation.ts:12-23` (12 lines): Identical helper parsing category metadata.
2. **Deterministic Task Parsing**:
   - `src/ai/fallback.ts:31-51` & `src/ai/reconciliation.ts:36-56` (21 lines): Identical task template mapping logic.
3. **Vendor Checklist Normalization**:
   - `src/ai/fallback.ts:96-114` & `src/ai/reconciliation.ts:140-158` (19 lines): Duplicate checklist generator loop.
4. **Dashboard Stat Card Layout**:
   - `src/components/dashboard/DashboardOverview.tsx:189-197` & `221-229` (9 lines): Duplicate quick-action card markup.

### B. Type Safety & Antipatterns

#### 1. Explicit `any` Types (19 instances)
- `src/ai/mockClient.ts:44` — Loose mock payload cast.
- `src/ai/realClient.ts:97` — GoogleGenAI response payload cast.
- `src/app/api/chat/route.ts:127` — Chat payload args unparsed cast.
- `src/components/budget/BudgetScreen.tsx:45, 113, 361` — Loose category and event handler parameters.
- `src/components/chat/ChatAssistant.tsx:118, 124, 130, 135, 141, 145, 153` — Tool call proposal payloads typed as `any` instead of discriminated unions.
- `src/components/ideas/IdeasScreen.tsx:120` — Generic idea card callback type.
- `src/lib/speech.ts:26, 38, 45` — Browser Web Speech API event types typed as `any`.
- `src/lib/storage.ts:66` — Catch block unknown error cast.

#### 2. Non-Null Assertions (`!`) (3 instances)
- `src/domain/timeline/backScheduler.ts:110` — `taskMap.get(id)!`
- `src/domain/timeline/backScheduler.ts:124` — `earliestPossible.get(id)!`
- `src/domain/timeline/backScheduler.ts:253` — `dates.get(depId)!`
*Resolution*: Replace with defensive `Map.get()` checks throwing descriptive domain errors if invariant fails.

---

### C. Structure & Modularity (Oversized Files & Functions)

#### Top Files Exceeding 200 Lines
1. `src/components/intake/IntakeWizard.tsx` (615 lines) — Monolithic component combining Step 1 (Basics), Step 2 (Budget/Style), Step 3 (Cultural/Accessibility constraints), validation state, and presentation.
2. `src/components/budget/BudgetScreen.tsx` (403 lines) — Combines category slider, what-if re-split calculator, overspend alerts, and proposal modal in a single file.
3. `src/templates/taskTemplates.ts` (378 lines) — Static dataset (acceptable for data, but can be cleanly categorized).
4. `src/components/dashboard/DashboardOverview.tsx` (354 lines) — Overview metrics, budget summary, upcoming timeline cards, and vendor status widgets in one file.
5. `src/lib/i18n.ts` (337 lines) — Static translation dictionary.
6. `src/components/chat/ChatAssistant.tsx` (310 lines) — Chat state, speech recognition, tool proposal rendering, and diff application logic.
7. `src/domain/timeline/backScheduler.ts` (260 lines) — Topological sort, CPM calculation, and lead-time compression.

#### Top Long Functions (> 40 lines)
1. `src/app/page.tsx:HomePage` (188 lines) — Root state management, tab routing, storage hydration, and export handlers.
2. `src/ai/reconciliation.ts:reconcileAIOutputToPlan` (152 lines) — Complex AI schema reconciliation.
3. `src/domain/budget/budgetSplit.ts:proportionalSplit` (145 lines) — Proportional allocation with Hare-Niemeyer rounding.
4. `src/ai/fallback.ts:generateDeterministicFallbackPlan` (109 lines) — Plan synthesis from static templates.
5. `src/domain/timeline/backScheduler.ts:scheduleTimeline` (108 lines) — Main timeline scheduling orchestration.

---

### D. Layering & Clean Architecture
- **Domain Layer**: Clean. Domain code in `src/domain/` does NOT import from UI components or Next.js framework APIs.
- **Templates Layer**: Clean. Decoupled pure data definitions.
- **UI Components**: Components directly import large helper modules without custom hooks.
  - *Recommendation*: Extract UI hooks (`usePlanStorage`, `useSpeechRecognition`, `useBudgetCalculator`) to cleanly separate presentation from business orchestration.

---

### E. Dependencies & Tooling Gates
- `clsx` and `tailwind-merge` are listed in `package.json` dependencies but never imported in source code.
  - *Action*: Introduce `src/lib/utils.ts` with standard `cn(...inputs)` helper combining `clsx` and `tailwind-merge` to standardize dynamic class names throughout all UI components.
- `axe-core` and `@axe-core/playwright` are installed in `devDependencies`, but `tests/e2e` and `tests/a11y` have no test spec files.
  - *Action*: Add end-to-end smoke test (`tests/e2e/smoke.spec.ts`) and automated accessibility test (`tests/a11y/a11y.spec.ts`) to make `npm run test:e2e` functional and enforce 0 accessibility violations.

---

## 3. Ranked Remediation Plan (Phase 2 Roadmap)

Ranked by impact on maintainability, readability, and structural cleanliness:

| Rank | Priority Area | Target Scope | Impact |
| :---: | :--- | :--- | :--- |
| **1** | **Type Safety & `any` Elimination** | Eliminate all 19 `any` types and 3 non-null assertions (`!`). Use discriminated unions for AI proposals and Web Speech API. | High — guarantees type soundness and prevents runtime crashes |
| **2** | **Component Modularization** | Break down `IntakeWizard.tsx` (615L) into discrete step components (`StepBasics`, `StepBudget`, `StepConstraints`); extract `cn()` utility. | High — dramatically improves readability and testability |
| **3** | **Duplication Elimination** | Extract common template mapping between `src/ai/fallback.ts` and `src/ai/reconciliation.ts` into shared `src/ai/templateHelpers.ts`. | Medium-High — eliminates all 4 detected code clones |
| **4** | **Hook & State Separation** | Extract `usePlanStorage` and `useSpeech` custom hooks from `page.tsx` and `ChatAssistant.tsx`. | Medium — cleans up monolithic screen controllers |
| **5** | **Automated Testing Gates** | Add Playwright E2E smoke tests and Axe accessibility assertions to activate `test:e2e` and `test:a11y`. | Medium-High — ensures automated protection against regressions |
| **6** | **Constants & Magic Values** | Extract magic numbers (contingency rates, default days, step counts) into domain constants (`src/domain/constants.ts`). | Medium — cleans up domain logic clarity |
| **7** | **Documentation & JSDoc** | Add comprehensive JSDoc to public domain APIs explaining invariants and mathematical contracts. | Medium — enhances codebase transparency |
