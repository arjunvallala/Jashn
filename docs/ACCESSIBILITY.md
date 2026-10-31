# Accessibility Statement (WCAG 2.2 AA)

Jashn is committed to providing an inclusive, fully accessible event planning experience. Accessibility is treated as a first-class engineering requirement across all celebration flows.

## Conformance Standard
Jashn targets **WCAG 2.2 Level AA** compliance across desktop and mobile form factors.

## Implemented Accessibility Features

### 1. Structure & Navigation
- **Semantic HTML5**: Native elements (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`) provide clear landmarks.
- **Single `<h1>`**: Every screen has exactly one primary heading with logical descending heading hierarchy (`<h2>`, `<h3>`).
- **Skip to Content**: Skip link at top of document allowing keyboard users to bypass navigation.
- **Focus Indicators**: 2px high-visibility focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`) on all interactive controls.

### 2. Keyboard & Touch Operation
- **100% Keyboard Operable**: All interactive controls, including timeline calendar dates, vendor stages, and wizard steps, are operable via Tab, Shift+Tab, Enter, Space, and Arrow keys.
- **No Required Drag-and-Drop**: Status changes, priority shifts, and phase adjustments use explicit button and dropdown controls.
- **Touch Target Sizing**: All buttons, links, and touch targets enforce a minimum bounding box of 44x44px.
- **Dialog Focus Management**: Modal dialogs trap focus, maintain background `aria-hidden`, and close cleanly on `Escape`.

### 3. Visual & Cognitive Accessibility
- **Color Contrast**: All text satisfies a minimum contrast ratio of 4.5:1 against its background. Interactive UI components satisfy at least 3:1.
- **Multi-Modal Alerts**: Statuses and budget overspends use icons, explicit text labels, and color together—never color alone.
- **Themes**: System includes standard Light, Dark, and a dedicated **High-Contrast Mode** enforcing black/white borders and distinct contrast dividers.
- **Plain-Language Mode**: Optional toggle that simplifies complex budgeting terms and jargon for broader cognitive accessibility.
- **Reduced Motion**: All animations and transitions respect `prefers-reduced-motion: reduce`.
- **Zoom & Reflow**: Layout reflows gracefully up to 200% zoom at 320px screen width without horizontal scrollbars.

### 4. Assistive Technology & Multilingual Support
- **Dynamic Announcements**: Intake wizard step changes, async generation statuses, and errors announce immediately through `aria-live="polite"` regions.
- **Form Association**: All form controls are explicitly tied to `<label>` elements and communicate validation errors via `aria-describedby` and `aria-invalid`.
- **Multilingual UI**: Native support for English (`en`), Hindi (`hi`), and Telugu (`te`) with accurate document and element `lang` attributes.
- **Voice Input & Screen Speech**: Voice transcription powered by Web Speech API for hands-free intake, plus built-in Text-to-Speech (TTS) to read the event schedule and budget aloud.

## Known Limitations & Roadmap
1. **Screen Reader Pronunciation of Regional Terms**: Certain regional celebration names (e.g., Sangeet, Mehendi) may be phonetically mispronounced by screen reader engines lacking Hindi or Telugu voice synthesizers installed.
2. **Web Speech API Browser Support**: Web Speech API is natively supported in Chromium browsers; Safari and Firefox users are presented with a graceful fallback to standard keyboard input.
