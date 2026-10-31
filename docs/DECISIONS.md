# Architectural & Design Decisions

This log records non-trivial architectural, algorithmic, and design choices made during the development of Jashn.

## ADR 001: Integer Minor Currency Units (Paise)
- **Context**: Financial calculations in event planning (splitting lakhs into vendors, contingency reserves, quote comparisons) suffer from IEEE 754 floating-point rounding errors (e.g. `0.1 + 0.2 !== 0.3`).
- **Decision**: All monetary calculations in `domain/` use 64-bit integer minor currency units (paise: 1 INR = 100 paise).
- **Consequences**: Zero floating point drift. Formatting as rupees occurs exclusively at the UI boundary.

## ADR 002: Deterministic Largest-Remainder Proportional Allocation
- **Context**: When GenAI returns fractional or percentage weights for categories, multiplying weights by the total budget produces fractions of paise that sum to slightly more or less than the total.
- **Decision**: Implement the Hare-Niemeyer (largest remainder) method in `src/domain/budget/proportionalSplit.ts`. The integer floor is taken first, and remaining single paise are allocated sequentially to categories with the highest decimal remainders.
- **Consequences**: The sum of allocated category budgets is mathematically guaranteed to equal the total budget exactly.

## ADR 003: Separation of Qualitative AI Proposals and Deterministic Invariants
- **Context**: LLMs cannot reliably perform calendar arithmetic, leap year validation, dependency topological sorting, or strict ledger balancing.
- **Decision**: AI produces qualitative recommendations (category weights, cultural customs, vendor negotiation tips, task ideas). The domain engine validates, computes dates, checks lead times, dedupes, resolves DAG dependencies, and assigns budget numbers.
- **Consequences**: Guaranteed consistency, testability, and deterministic offline fallback if AI fails or times out.

## ADR 004: Local-First Storage with Schema Migration and Zod Boundary
- **Context**: Users planning celebrations should not need an account or surrender private details to a remote database. Remote databases introduce compliance risk and breach surface.
- **Decision**: Store all event state in `localStorage` under versioned schemas (`SCHEMA_VERSION = 1`). On hydration, all data is validated through Zod. Corrupted records trigger safe recovery.
- **Consequences**: Zero cloud storage costs, zero user privacy liability, works fully offline.

## ADR 005: Server-Side SDK Isolation for Google GenAI
- **Context**: Exposing API keys in client bundles creates critical security vulnerabilities.
- **Decision**: Use `@google/genai` exclusively in Next.js Server Route Handlers behind `/api/ai/*`. Validate all inputs with Zod, enforce token-bucket rate limiting per IP, and sanitize AI outputs before returning to the browser.
- **Consequences**: API key never touches the browser.

## ADR 006: Gemini Model Resolution Strategy
- **Context**: Google AI model families update continuously.
- **Decision**: Default to `gemini-2.5-flash` with dynamic override via `process.env.GEMINI_MODEL`.
