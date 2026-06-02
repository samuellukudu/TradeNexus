# i18n Language Toggle (English / Chinese) — Design Spec

**Date:** 2026-06-02
**Status:** Approved

## Overview

Add English ↔ Chinese language switching to TradeNexus AI Sales Agent. Chinese suppliers (initial clients) can toggle the UI between English and Chinese. AI-generated content (lead summaries, market reports, chat messages) stays in English since it comes from the Gemini API.

## Design Decisions

| Decision | Choice |
|---|---|
| Scope | UI shell + landing page + dashboard (AI content stays English) |
| Translation storage | TypeScript dictionary files (`en.ts`, `zh.ts`) — flat key-value objects |
| Consumption | React Context + `useLanguage()` hook |
| Toggle style | Segmented pill: `EN | 中文` with blue highlight on active |
| Toggle placement | Top nav bar — both landing page and authenticated app |
| Font | System default (no extra font loading for CJK) |
| Persistence | localStorage (`tradenexus-lang`) with `navigator.language` fallback |

## File Structure

```
i18n/
  index.tsx      # LanguageProvider, useLanguage hook, types
  en.ts          # English translations (flat key-value object)
  zh.ts          # Chinese translations (flat key-value object)
```

## Translation Files

Flat key-value objects with a dot-separated prefix convention. `en.ts` defines the canonical `Translations` type. `zh.ts` is typed as `Record<keyof typeof en, string>` so TypeScript enforces that every English key has a Chinese counterpart.

```ts
// en.ts
export const en = {
  // Nav & global
  'nav.dashboard': 'Dashboard',
  'nav.operations': 'Operations',
  'nav.signIn': 'Sign In',
  'nav.signOut': 'Sign Out',
  'nav.profile': 'Profile',

  // Landing page
  'landing.hero.title': 'AI-Powered B2B Sales Agent',
  'landing.hero.subtitle': 'Find buyers in 190+ countries...',
  'landing.howItWorks.title': 'How It Works',
  // ... (all landing page strings)

  // Auth
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.login': 'Log In',
  'auth.register': 'Create Account',
  'auth.error.default': 'Authentication failed',
  // ...

  // Dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.totalLeads': 'Total Leads',
  'dashboard.activeNegotiations': 'Active Negotiations',
  'dashboard.conversionRate': 'Conversion Rate',
  'dashboard.filter.allSessions': 'All Sessions',
  'dashboard.filter.allRegions': 'All Regions',
  // ...

  // App shell
  'app.newSearch': '+ New Search',
  'app.deployScout': 'Deploy Scout',
  'app.startSearch': 'Start Search',
  'app.productName': 'Product Name',
  'app.productDescription': 'Product Description',
  // ...
};
```

## Context & Hook API

```ts
// i18n/index.tsx
type Language = 'en' | 'zh';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

function LanguageProvider({ children }) { ... }
function useLanguage(): LanguageContextValue { ... }
```

- `LanguageProvider` wraps the app root in `index.tsx`
- Initial language detection: localStorage → `navigator.language` (if starts with `zh`) → `'en'`
- `t(key)` returns the key itself as fallback if a translation is missing — no crashes, English text shows
- Language change updates localStorage and `document.documentElement.lang`

## LanguageToggle Component

Segmented pill toggle placed in both nav bars:

```
[ EN | 中文 ]
```

- Uses `useLanguage()` for current language and `setLanguage()`
- Active segment gets `bg-blue-600 text-white`, inactive gets `bg-slate-800 text-slate-400`
- Rounded-full pill with 1px slate border
- Instant switch — no dropdown needed for only 2 languages

## What Gets Translated

| Component | Translate | Don't Translate |
|---|---|---|
| **LandingPage** | Nav links, hero text, CTAs, "How It Works" steps, use case captions, auth modal (all fields, buttons, errors) | Lead showcase data (company names, descriptions — real data) |
| **App.tsx** (shell) | Nav labels, sidebar buttons, form labels, buttons, status badges, terminal intro logs | Country/continent names (proper nouns), AI-generated agent action text |
| **Dashboard** | Metric labels, filter dropdowns, activity feed labels, autopilot toggle, delete confirmation | Session names, lead company names, activity log messages |
| **LeadCard** | Status badge labels, confidence score label, territory vector label | Lead company names, summaries, contact info |
| **InteractionViewer** | Tab labels (AI Chat, Activity Log, Company Dossier), action buttons, status change labels | All AI-generated content (chat messages, lead summaries, competitor analysis, outreach drafts) |
| **MarketReportModal** | Section headers, export button, chart axis labels | All report content (AI-generated) |
| **SupplierProfileView** | Form labels, save button | Company data entered by user |
| **Terminal** | Initial 4 boot messages | All runtime log output (AI-generated) |
| **PrivacyPolicy** | All static text | — |
| **TermsOfService** | All static text | — |

### Edge Cases

- **`landingData.ts`** — `howItWorksSteps` titles/descriptions are looked up via `t()` at render time. `useCases` arrays (company names, descriptions) stay in English.
- **Country/company size arrays** — stay in English (proper nouns, used in prompts to Gemini).
- **Firestore data** — never translated, only UI wrappers around it.
- **AI runtime strings** — terminal logs, agent actions, chat messages all pass through untranslated. The `t()` fallback behavior (returning the key) means if a string accidentally gets passed to `t()`, it just displays as-is.
- **html2canvas PDF export** — MarketReportModal exports use the currently active language for UI chrome in the captured DOM.

## Technical Details

- **No new dependencies** — the existing codebase has everything needed
- **Font:** System CJK fallback via Tailwind `font-sans` — no web font loading
- **No RTL:** Neither language is right-to-left, no layout direction changes
- **TypeScript enforcement:** `zh.ts` typed as `Record<keyof typeof en, string>` — missing keys are compile errors
- **`<html lang>` attribute:** Updated to `"en"` or `"zh"` on language change for accessibility/SEO
