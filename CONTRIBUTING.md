# Contributing to Jashn

Thank you for contributing to Jashn! We welcome issues, PRs, and suggestions.

## Development Workflow
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Quality Gates
Before submitting code, ensure all local checks pass:
- `npm run typecheck`
- `npm run lint`
- `npm run test:coverage` (90% domain/ai, 75% overall)
- `npm run build`

## Architecture Rules
- Strictly follow layer boundaries: `domain/` must have zero external framework or IO dependencies.
- No floating-point arithmetic for currency; all monetary amounts must be integer paise.
- All AI responses must pass through Zod schemas and domain reconciliation before touching the plan state.
- No PII is sent to external AI services.
