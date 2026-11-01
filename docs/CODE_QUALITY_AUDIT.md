# Code Quality Audit & Baseline Report (Phase 1)

**Repository**: Jashn (जश्न) — GenAI Celebration & Event Planner  
**Date**: November 1, 2026  
**Auditor**: Antigravity Automated Verification Agent  
**Goal**: Elevate Code Quality score from 89 to 95+ without regressing Security (99), Efficiency (100), Testing (98), Accessibility (99), or Problem Statement Alignment (100).

---

## 1. Git State & Clean Working Tree

### `git status`
```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

### `git log --oneline -15`
```text
a1f0f9c docs: establish code quality baseline and phase 1 audit report
90c3cae fix(styles): scope security headers to exclude internal static assets to ensure CSS delivers HTTP 200
b3d137d fix(security): permit unsafe-inline in script-src CSP to enable Next.js App Router client hydration
0a21a7c fix(ui): remove blocking isHydrated check to enable immediate SSR rendering
f88cc1e feat(app): add accessible screens, netlify deployment, and submission docs
0984a64 feat(ai): implement GeminiClient, reconciliation engine, prompts with PII sanitization, and fallback suite
a751c51 feat: initial foundation, domain architecture, templates, and unit tests
7d58f6f Initial commit
```

---

## 2. Hard Baseline Command Outputs

### A. Lint (`npm run lint`)
```text
> jashn@1.0.0 lint
> next lint

✔ No ESLint warnings or errors
```
*Status*: PASS (0 warnings, 0 errors with default Next.js lint config).

### B. Typecheck (`npm run typecheck`)
```text
> jashn@1.0.0 typecheck
> tsc --noEmit
```
*Status*: PASS (Exit code 0, 0 TypeScript compiler diagnostics).

### C. Unit Tests & Coverage (`npm run test:coverage`)
```text
> jashn@1.0.0 test:coverage
> vitest run --coverage

 Test Files  10 passed (10)
      Tests  40 passed (40)
   Duration  19.04s

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |    47.6 |    67.73 |   53.77 |    47.6 |                   
 VPW/src/ai        |   66.14 |    64.38 |   66.66 |   66.14 |                   
 VPW/src/app       |       0 |        0 |       0 |       0 | 1-208             
 VPW/src/components|   10.23 |     8.45 |    2.43 |   10.23 |                   
 VPW/src/domain    |   96.05 |       80 |   94.11 |   96.05 |                   
 VPW/src/lib       |   59.88 |    55.88 |      50 |   59.88 |                   
 VPW/src/templates |     100 |    66.66 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
ERROR: Coverage for lines (47.6%) does not meet global threshold (75%)
ERROR: Coverage for functions (53.77%) does not meet global threshold (75%)
ERROR: Coverage for statements (47.6%) does not meet global threshold (75%)
ERROR: Coverage for branches (67.73%) does not meet global threshold (70%)
```
*Status*: 40/40 Unit tests pass. Coverage is 96.05% in Domain, but overall line coverage (47.6%) fails the 75% threshold in `vitest.config.ts` due to uncovered UI screen components.

### D. Production Build (`npm run build`)
```text
> jashn@1.0.0 build
> next build

  ▲ Next.js 14.2.35
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (8/8)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    45.3 kB         132 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ƒ /api/ai/chat                         0 B                0 B
├ ƒ /api/ai/ideas                        0 B                0 B
├ ƒ /api/ai/optimize                     0 B                0 B
└ ƒ /api/ai/plan                         0 B                0 B
+ First Load JS shared by all            87.2 kB
  ├ chunks/117-ee3cf2893d2ceff7.js       31.7 kB
  ├ chunks/fd9d1056-c96c49782430d626.js  53.6 kB
  └ other shared chunks (total)          1.86 kB
```
*Status*: PASS (Exit code 0, standalone optimized bundle).

### E. E2E Tests (`npm run test:e2e`)
```text
> jashn@1.0.0 test:e2e
> playwright test

Error: No tests found
```
*Status*: FAIL (Exit code 1 — Playwright is configured in `playwright.config.ts`, but `tests/e2e/` lacks `.spec.ts` files).

---

## 3. Measured Findings

### A. Top 20 Files by Line Count (`src/**/*.ts*`)
| Lines | File Path | Concern / Content |
| :---: | :--- | :--- |
| **574** | `src/components/intake/IntakeWizard.tsx` | Monolithic wizard combining 3 steps, validation, form state & markup |
| **375** | `src/templates/taskTemplates.ts` | Static event checklist templates (data file) |
| **372** | `src/components/budget/BudgetScreen.tsx` | Combines allocation sliders, what-if re-split, AI optimization diff |
| **333** | `src/lib/i18n.ts` | Localization dictionary (data file) |
| **320** | `src/components/dashboard/DashboardOverview.tsx` | Multi-widget dashboard (metrics, upcoming tasks, quick actions) |
| **285** | `src/templates/sampleEvent.ts` | Sample celebration mock dataset (data file) |
| **264** | `src/components/chat/ChatAssistant.tsx` | Speech recognition, streaming messages, tool call diff apply |
| **245** | `src/components/vendors/VendorScreen.tsx` | Vendor pipeline columns, quote entry, category filters |
| **229** | `src/domain/timeline/backScheduler.ts` | CPM topological sort, cycle detection, compression |
| **213** | `src/components/timeline/TimelineScreen.tsx` | Timeline milestone cards, filter chips, ICS export modal |
| **212** | `src/components/common/Header.tsx` | Nav header, locale picker, high-contrast toggle, storage reset |
| **200** | `src/templates/budgetTemplates.ts` | Wedding/Birthday category weight datasets (data file) |
| 197 | `src/components/ideas/IdeasScreen.tsx` | Idea cards, refinement chips, save actions |
| 188 | `src/app/page.tsx` | Root coordinator, tab switcher, hydration container |
| 174 | `src/templates/vendorTemplates.ts` | Default vendor categories & questions (data file) |
| 168 | `src/components/data/DataControlModal.tsx` | Export JSON/CSV/ICS & clear data modal |
| 151 | `src/domain/budget/proportionalSplit.ts` | Proportional split algorithm + Hare-Niemeyer integer rounding |
| 147 | `src/ai/reconciliation.ts` | AI structured output reconciliation into deterministic model |
| 140 | `src/app/api/ai/chat/route.ts` | Server-side Gemini chat API handler |
| 133 | `src/domain/validators.ts` | Zod validation schemas |

---

### B. Duplicated Code (`npx jscpd src`)
4 clones detected, 61 duplicated lines (0.82% duplication):

1. **`src/ai/fallback.ts:10-21` & `src/ai/reconciliation.ts:12-23` (12 lines)**  
   *Code*: Duplicate category metadata parsing loop.
2. **`src/ai/fallback.ts:31-51` & `src/ai/reconciliation.ts:36-56` (21 lines)**  
   *Code*: Duplicate task template mapping & lead-time calculation.
3. **`src/ai/fallback.ts:96-114` & `src/ai/reconciliation.ts:140-158` (19 lines)**  
   *Code*: Duplicate vendor category checklist generator.
4. **`src/components/dashboard/DashboardOverview.tsx:189-197` & `221-229` (9 lines)**  
   *Code*: Duplicate stat card action layout structure.

---

### C. Dead Code & Unused Dependencies (`npx knip`)

#### Unused Dependencies:
- `clsx` (`package.json:23`) — Installed but never imported.
- `tailwind-merge` (`package.json:28`) — Installed but never imported.
*(Resolution: Create `src/lib/utils.ts` with `cn()` export utilizing both to standardize dynamic CSS).*

#### Unused DevDependencies:
- `@axe-core/playwright` (`package.json:32`) — Installed for a11y testing, but no `.spec.ts` imports it.
- `axe-core` (`package.json:43`) — Unused directly in E2E.
*(Resolution: Implement `tests/a11y/a11y.spec.ts` using `@axe-core/playwright`).*

#### Unused Exports (19):
- `src/ai/clientFactory.ts:7:17` — `setGlobalGeminiClient`
- `src/ai/types.ts:19:14` — `AIBudgetWeightProposalSchema`
- `src/ai/types.ts:25:14` — `AITaskProposalSchema`
- `src/ai/types.ts:36:14` — `AIVendorAdviceSchema`
- `src/domain/timeline/backScheduler.ts:81:17` — `determinePhase`
- `src/domain/validators.ts:3:14` — `EventTypeSchema`
- `src/domain/validators.ts:4:14` — `SupportedCurrencySchema`
- `src/domain/validators.ts:6:14` — `TaskPrioritySchema`
- `src/domain/validators.ts:7:14` — `TaskPhaseSchema`
- `src/domain/validators.ts:16:14` — `VendorStatusSchema`
- `src/domain/validators.ts:17:14` — `CostTierSchema`
- `src/domain/validators.ts:52:14` — `BudgetCategorySchema`
- `src/domain/validators.ts:64:14` — `BudgetAllocationSchema`
- `src/domain/validators.ts:72:14` — `EventTaskSchema`
- `src/domain/validators.ts:89:14` — `VendorItemSchema`
- `src/domain/validators.ts:104:14` — `EventIdeaSchema`
- `src/lib/i18n.ts:327:14` — `PLAIN_LANGUAGE_MAP`
- `src/lib/rateLimiter.ts:6:14` — `TokenBucketRateLimiter`
- `src/templates/vendorTemplates.ts:12:14` — `VENDOR_TEMPLATES`

#### Unused Exported Types (7):
- `src/ai/types.ts:64:18` — `ChatFunctionCallResult`
- `src/domain/budget/budgetTracker.ts:3:18` — `OverspendAlert`
- `src/domain/timeline/backScheduler.ts:17:18` — `LeadTimeRisk`
- `src/domain/types.ts:103:18` — `PlanConstraints`
- `src/domain/types.ts:110:18` — `EventPlan`
- `src/domain/types.ts:130:13` — `ProposalType`
- `src/templates/vendorTemplates.ts:3:18` — `TemplateVendorCategory`

---

### D. Circular Dependencies (`npx madge --circular --extensions ts,tsx src`)
- Result: **0 circular dependencies** across 46 analyzed files (`√ No circular dependency found!`).

---

### E. Code Antipatterns

#### 1. Explicit `any` Types (19 instances)
1. `src/ai/mockClient.ts:44` — `(error as any).status = this.behavior.statusCode;`
2. `src/ai/realClient.ts:97` — `tools: tools.length > 0 ? [{ functionDeclarations: tools as any }] : undefined,`
3. `src/app/api/ai/chat/route.ts:127` — `type: toolName as any,`
4. `src/app/api/ai/plan/route.ts:51` — `reconcileAIOutputToPlan(rawAIOutput as any, intakeData)`
5. `src/components/budget/BudgetScreen.tsx:45` — `useState<any>(null)`
6. `src/components/budget/BudgetScreen.tsx:113` — `optimizeDiff.trims.find((t: any) => ...)`
7. `src/components/budget/BudgetScreen.tsx:361` — `optimizeDiff.trims?.map((trim: any) => ...)`
8. `src/components/chat/ChatAssistant.tsx:118` — `proposal.payload as any`
9. `src/components/chat/ChatAssistant.tsx:124` — `proposal.payload as any`
10. `src/components/chat/ChatAssistant.tsx:130` — `phase: '1_month_out' as any`
11. `src/components/chat/ChatAssistant.tsx:135` — `priority: (priority as any) || 'medium'`
12. `src/components/chat/ChatAssistant.tsx:141` — `proposal.payload as any`
13. `src/components/chat/ChatAssistant.tsx:145` — `proposal.payload as any`
14. `src/components/chat/ChatAssistant.tsx:153` — `costTier: (costTier as any) || '₹₹'`
15. `src/components/ideas/IdeasScreen.tsx:120` — `handleRefineCategory(chip.id as any)`
16. `src/lib/speech.ts:26` — `(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition`
17. `src/lib/speech.ts:38` — `recognition.onresult = (event: any) => {`
18. `src/lib/speech.ts:45` — `recognition.onerror = (event: any) => {`
19. `src/lib/storage.ts:66` — `private static recoverCorruptedPlan(corrupted: any)`

#### 2. Non-Null Assertions (`!`) (3 instances)
1. `src/domain/timeline/backScheduler.ts:110` — `const task = taskMap.get(id)!;`
2. `src/domain/timeline/backScheduler.ts:124` — `const earliest = earliestPossible.get(id)!;`
3. `src/domain/timeline/backScheduler.ts:253` — `const depDate = dates.get(depId)!;`

#### 3. Directive Hygiene
- `@ts-ignore` / `@ts-nocheck`: **0**
- `eslint-disable`: **0**
- `TODO` / `FIXME`: **0**
- `console.*`: **3** calls, all properly isolated in `src/lib/logger.ts` (lines 32, 37, 43).

---

### F. ESLint Strictness Violations (Complexity & Function Length)
Tested with rules: `complexity: ["warn", 10]`, `max-lines-per-function: ["warn", { "max": 40 }]`:
**39 Problems detected across 21 files**:

| File Path | Line | Function / Method | Issue Type | Measurement |
| :--- | :---: | :--- | :--- | :--- |
| `src/components/intake/IntakeWizard.tsx` | 32 | `IntakeWizard` | `max-lines-per-function` | **545 lines** (max 40) |
| `src/components/intake/IntakeWizard.tsx` | 32 | `IntakeWizard` | `complexity` | **Cyclomatic 24** (max 10) |
| `src/components/intake/IntakeWizard.tsx` | 83 | `handleFormSubmit` | `complexity` | **Cyclomatic 14** (max 10) |
| `src/components/intake/IntakeWizard.tsx` | 131 | `renderStepContent` | `max-lines-per-function` | **48 lines** (max 40) |
| `src/components/budget/BudgetScreen.tsx` | 29 | `BudgetScreen` | `max-lines-per-function` | **344 lines** (max 40) |
| `src/components/budget/BudgetScreen.tsx` | 63 | `handleOptimizeBudget` | `max-lines-per-function` | **42 lines** (max 40) |
| `src/components/dashboard/DashboardOverview.tsx` | 29 | `DashboardOverview` | `max-lines-per-function` | **291 lines** (max 40) |
| `src/components/chat/ChatAssistant.tsx` | 33 | `ChatAssistant` | `max-lines-per-function` | **235 lines** (max 40) |
| `src/components/chat/ChatAssistant.tsx` | 114 | `applyProposal` | `max-lines-per-function` | **49 lines** (max 40) |
| `src/components/chat/ChatAssistant.tsx` | 114 | `applyProposal` | `complexity` | **Cyclomatic 14** (max 10) |
| `src/components/vendors/VendorScreen.tsx` | 36 | `VendorScreen` | `max-lines-per-function` | **214 lines** (max 40) |
| `src/components/vendors/VendorScreen.tsx` | 36 | `VendorScreen` | `complexity` | **Cyclomatic 14** (max 10) |
| `src/components/common/Header.tsx` | 33 | `Header` | `max-lines-per-function` | **183 lines** (max 40) |
| `src/components/common/Header.tsx` | 33 | `Header` | `complexity` | **Cyclomatic 13** (max 10) |
| `src/components/timeline/TimelineScreen.tsx` | 37 | `TimelineScreen` | `max-lines-per-function` | **181 lines** (max 40) |
| `src/components/timeline/TimelineScreen.tsx` | 162 | `renderTaskCard` | `max-lines-per-function` | **56 lines** (max 40) |
| `src/components/ideas/IdeasScreen.tsx` | 25 | `IdeasScreen` | `max-lines-per-function` | **174 lines** (max 40) |
| `src/components/ideas/IdeasScreen.tsx` | 39 | `handleRefineIdeas` | `max-lines-per-function` | **46 lines** (max 40) |
| `src/components/ideas/IdeasScreen.tsx` | 161 | `renderIdeaCard` | `max-lines-per-function` | **45 lines** (max 40) |
| `src/app/page.tsx` | 20 | `HomePage` | `max-lines-per-function` | **167 lines** (max 40) |
| `src/components/data/DataControlModal.tsx` | 28 | `DataControlModal` | `max-lines-per-function` | **144 lines** (max 40) |
| `src/ai/reconciliation.ts` | 10 | `reconcileAIOutputToPlan` | `max-lines-per-function` | **131 lines** (max 40) |
| `src/domain/budget/proportionalSplit.ts` | 26 | `proportionalSplit` | `max-lines-per-function` | **120 lines** (max 40) |
| `src/domain/budget/proportionalSplit.ts` | 26 | `proportionalSplit` | `complexity` | **Cyclomatic 17** (max 10) |
| `src/ai/fallback.ts` | 9 | `generateDeterministicFallbackPlan` | `max-lines-per-function` | **95 lines** (max 40) |
| `src/domain/timeline/backScheduler.ts` | 154 | `scheduleTimeline` | `max-lines-per-function` | **87 lines** (max 40) |
| `src/domain/timeline/backScheduler.ts` | 154 | `scheduleTimeline` | `complexity` | **Cyclomatic 20** (max 10) |
| `src/components/common/Modal.tsx` | 14 | `Modal` | `max-lines-per-function` | **77 lines** (max 40) |
| `src/lib/apiSecurity.ts` | 20 | `parseAndValidateJsonBody` | `max-lines-per-function` | **71 lines** (max 40) |
| `src/app/api/ai/chat/route.ts` | 82 | `POST` | `max-lines-per-function` | **61 lines** (max 40) |
| `src/app/api/ai/ideas/route.ts` | 24 | `POST` | `max-lines-per-function` | **61 lines** (max 40) |
| `src/domain/budget/budgetTracker.ts` | 27 | `calculateBudgetSummary` | `max-lines-per-function` | **53 lines** (max 40) |
| `src/ai/clientFactory.ts` | 11 | `getGeminiClient` | `max-lines-per-function` | **53 lines** (max 40) |
| `src/domain/timeline/backScheduler.ts` | 94 | `resolveDependenciesAndDetectCycles` | `max-lines-per-function` | **45 lines** (max 40) |
| `src/domain/timeline/backScheduler.ts` | 94 | `resolveDependenciesAndDetectCycles` | `complexity` | **Cyclomatic 17** (max 10) |
| `src/app/api/ai/plan/route.ts` | 14 | `POST` | `max-lines-per-function` | **46 lines** (max 40) |
| `src/lib/speech.ts` | 14 | `startListening` | `max-lines-per-function` | **44 lines** (max 40) |
| `src/domain/timeline/icsExporter.ts` | 39 | `exportToICS` | `max-lines-per-function` | **44 lines** (max 40) |
| `src/app/api/ai/optimize/route.ts` | 39 | `POST` | `max-lines-per-function` | **43 lines** (max 40) |

---

## 4. Ranked Remediation Plan (Impact Ordering)

Ranked by direct influence on Code Quality grading, maintainability, and structural soundness:

| Priority | Remediation Target | Exact Files Affected | Quality Impact |
| :---: | :--- | :--- | :--- |
| **P1** | **Strict Tooling & Layering Enforcement (Step 2)** | `.eslintrc.json`, `tsconfig.json` | **Highest**: Transforms subjective code quality claims into enforceable automated gates. Enforces zero `any`, zero `!`, strict typing, boundary layering (`domain` cannot import UI), complexity ≤ 10, lines ≤ 200. |
| **P2** | **Component & Function Decomposition (Step 3)** | `IntakeWizard.tsx`, `BudgetScreen.tsx`, `ChatAssistant.tsx`, `DashboardOverview.tsx`, `VendorScreen.tsx`, `Header.tsx` | **Highest**: Eliminates 11 oversized files and 39 complexity/length violations. Separates business state/orchestration hooks from pure UI views. |
| **P3** | **Type Safety & `any` Elimination (Step 3)** | `ChatAssistant.tsx`, `BudgetScreen.tsx`, `speech.ts`, `apiSecurity.ts`, `mockClient.ts`, `backScheduler.ts` | **High**: Replaces all 19 `any` types with typed discriminated unions (e.g. `ProposalPayload`) and Web Speech API interfaces. Eliminates 3 `!` assertions. |
| **P4** | **Duplication Elimination (Step 3)** | `src/ai/fallback.ts`, `src/ai/reconciliation.ts`, `src/ai/templateHelpers.ts` | **Medium-High**: Merges 4 detected code clones into pure domain/AI template helpers. Drops duplication to 0.0%. |
| **P5** | **Dead Code & Dependency Hygiene (Step 3 & 4)** | `package.json`, `src/lib/utils.ts` | **Medium**: Integrates `clsx` and `tailwind-merge` into `src/lib/utils.ts` (`cn`). Prunes unused exports or marks them as public contract exports. |
| **P6** | **Automated E2E & A11y Suite (Step 4)** | `tests/e2e/smoke.spec.ts`, `tests/a11y/a11y.spec.ts` | **High**: Turns `npm run test:e2e` from failing to green. Automates WCAG 2.2 AA zero-violation verification via Playwright + Axe. |
| **P7** | **Husky, Lint-Staged & CI Pipeline Gates (Step 4)** | `.husky/`, `.github/workflows/ci.yml`, `package.json` | **High**: Blocks regressions at pre-commit and CI levels (`--max-warnings 0`, format check, typecheck, coverage threshold). |
| **P8** | **Documentation Accuracy & Traceability (Step 5)** | `README.md`, `ARCHITECTURE.md`, `docs/SUBMISSION.md` | **Medium-High**: Fixes screen count (6 screens), updates real test counts, adds project tree, documents exact quality gate rules, and adds JSDoc explaining *WHY*. |
