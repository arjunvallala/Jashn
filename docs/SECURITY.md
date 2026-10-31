# Jashn Security Policy & Threat Model

## 1. Threat Model

### Assets
1. **Gemini API Key**: Cloud credentials granting model access and billing authorization.
2. **User Event Data**: Guest counts, budget figures, dates, locations, vendor quotes, and personal preferences.
3. **Application Availability & Compute**: Server capacity and Google AI quota limits.
4. **Client Integrity**: Browser runtime environment of guests and planners.

### Threats & Mitigations

| Threat | Risk Level | Mitigation in Jashn |
| :--- | :--- | :--- |
| **API Key Exposure** | Critical | Server-side only via environment variable (`GEMINI_API_KEY`). Never bundled into client builds. Gitignored `.env`, `.env.example` provides template only. |
| **Prompt Injection** | High | System prompts separated from user inputs. Free text bounded in XML delimiters (`<user_data>`) with explicit instructions to ignore nested overrides. Schema validation discards unmodeled fields. |
| **Data Leak / Privacy Breach** | High | Local-first architecture: all event data stored exclusively in the user's browser (`localStorage`). No user database, no authentication accounts, zero server-side storage of personal information. |
| **AI Resource Exhaustion / DoS** | High | Token-bucket rate limiter per IP (20 req/min). Strict 32KB payload limits on incoming API requests with Zod schema verification and bounded string lengths. |
| **XSS & Code Injection** | High | Strict Content Security Policy (CSP), `frame-ancestors 'none'`, no `dangerouslySetInnerHTML` anywhere in the app. AI outputs rendered strictly via safe escaped components. |
| **Vendor Hallucination & Fraud** | Medium | Explicit domain rules forbidding synthetic vendor contact info. AI provides evaluation rubrics and question checklists only. Disclaimer rendered on vendor views. |
| **Upstream Error Disclosure** | Medium | Centralized error handler masks stack traces and upstream vendor responses, returning typed error messages (`InternalServerError`, `RateLimitExceeded`). |

### Residual Risks
- Compromised user device could access `localStorage`. Users can execute instant zero-trace wiping using the "Delete all my data" button.
- IP spoofing behind certain multi-hop reverse proxies: mitigated by standard `x-forwarded-for` leftmost untrusted IP extraction.
