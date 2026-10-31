# Jashn Architecture

Jashn is built with strict layered architecture and unidirectional data flow. Framework or IO code must never leak into the domain core.

```
                    ┌─────────────────────────┐
                    │      Next.js Pages      │
                    │   (App Router & UI)     │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────┐                     ┌───────────────────┐
│     API Routes        │                     │   Client State    │
│  (/api/ai/plan, etc)  │                     │  (Local Storage)  │
└───────────┬───────────┘                     └─────────┬─────────┘
            │                                           │
            ▼                                           │
┌───────────────────────┐                               │
│       ai/ Layer       │                               │
│  - Gemini Client      │                               │
│  - Prompts & Delims   │                               │
│  - Parsers & Fallback │                               │
└───────────┬───────────┘                               │
            │                                           │
            ▼                                           ▼
┌─────────────────────────────────────────────────────────┐
│                     domain/ Layer                       │
│  - Money (Integer Paise Engine)                         │
│  - Proportional Allocation (Largest-Remainder)          │
│  - Timeline & Critical Path (DAG Topo Sort)             │
│  - Vendor Pipeline & Validation                         │
│  - Zod Schemas & Invariant Verification                 │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌───────────────────────────┴─────────────────────────────┐
│                    templates/ Layer                     │
│  - Pre-seeded tasks, day offsets, & category bounds     │
└─────────────────────────────────────────────────────────┘
```

## Architectural Layers

### 1. `src/domain/`
Pure TypeScript, zero framework or network dependencies.
- **Money**: Represents currency as integer minor units (`paise`).
- **Budget Engine**: Implements the largest-remainder method (Hare-Niemeyer) guaranteeing that category distributions sum exactly to total budget down to the last paisa. Enforces min/max category boundaries and protects contingency reserves.
- **Timeline Engine**: Implements directed acyclic graph (DAG) dependency resolution, topological sorting, lead time feasibility detection, risk alerts, and RFC 5545 ICS generation.
- **Vendor Engine**: Manages pipeline stages, status transitions, quote comparisons against allocations, and validation.
- **Validators**: Strict Zod schemas enforcing runtime invariants.

### 2. `src/templates/`
Deterministic baseline data structures for wedding, birthday, and community celebrations. Includes category percentage ranges, standard task sequences, day-offset milestones, and vendor checklists.

### 3. `src/ai/`
- **Gemini Client Interface**: Abstract client interface (`GeminiClient`) with concrete `RealGeminiClient` (using `@google/genai`) and `MockGeminiClient` for deterministic testing.
- **Prompts**: Modular prompts isolating user-supplied data with strict XML-style delimiters (`<user_data>`) to prevent prompt injection.
- **Reconciliation Engine**: Takes qualitative suggestions and candidate tasks from Gemini and transforms them into domain-valid entities with verified dates, non-cyclical dependencies, and exact budget bounds.
- **Resilience**: Automatic retry on schema violation with repair instructions; transparent fallback to template baselines if AI is unavailable.

### 4. `src/lib/`
Utilities including client-side localStorage persistence with schema versioning, i18n translation maps (English, Hindi, Telugu), in-memory rate limiting (token bucket), and audit-compliant redacted logging.

### 5. `src/components/` & `src/app/`
Accessible UI primitives (WCAG 2.2 AA compliant), supporting light, dark, and high-contrast modes, screen-reader live regions, keyboard navigation, and responsive touch targets >= 44px.
