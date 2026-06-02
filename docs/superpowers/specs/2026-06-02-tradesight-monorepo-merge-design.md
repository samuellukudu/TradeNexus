# Tradesight Monorepo Merge Design

**Date:** 2026-06-02
**Status:** Draft

## Overview

Merge `un-comtrade-viewer` into `tradenexus-ai-sales-agent` as a side application accessible at `/tradesight` under the `tradenexushub.com` domain. The merge follows tradenexus's existing architecture: browser-direct API calls, no Express server dependency, pure Firebase Hosting deployment.

## Architecture

### Directory Structure

```
tradenexus-ai-sales-agent/
├── index.tsx              ← path router: /tradesight → TradesightApp, else → App
├── index.html             ← shared shell (unchanged Tailwind CDN config)
├── index.css              ← tradenexus styles (unchanged)
├── App.tsx                ← tradenexus main app (unchanged)
├── components/            ← tradenexus components (unchanged)
├── services/              ← tradenexus services (unchanged)
│   ├── geminiService.ts
│   ├── browserGeminiService.ts
│   └── ...
├── server/                ← tradenexus server (unchanged, not used in deployed mode)
├── types.ts               ← tradenexus types (unchanged)
├── tradesight/
│   ├── App.tsx            ← main app shell (was un-comtrade-viewer App.tsx)
│   ├── LandingPage.tsx    ← landing/search page (was un-comtrade-viewer LandingPage.tsx)
│   ├── index.css          ← tradesight-specific styles
│   ├── types.ts           ← tradesight-specific types
│   ├── services/
│   │   ├── comtradeAPI.ts     ← rewritten: direct UN Comtrade calls (no proxy)
│   │   ├── worldBankAPI.ts    ← unchanged: already browser-direct
│   │   └── geminiService.ts   ← new: browser-direct Gemini, follows browserGeminiService pattern
│   └── lib/
│       ├── clientCache.ts     ← browser-side request cache
│       ├── translations.ts    ← i18n strings
│       └── bm25.ts            ← text search utility
```

### Client-Side Routing

`index.tsx` checks `window.location.pathname`:

```typescript
if (window.location.pathname.startsWith('/tradesight')) {
  root.render(<TradesightApp />);
} else {
  root.render(<App />);
}
```

No react-router needed. Firebase Hosting's catch-all rewrite (`**` → `/index.html`) ensures all `/tradesight/*` client-side routes resolve to the SPA.

### API Pattern: Browser-Direct

Follows tradenexus's deployed pattern exactly. All API calls go directly from the browser:

| Data Source | Pattern |
|---|---|
| UN Comtrade API | `fetch("https://comtradeapi.un.org/public/v1/...")` — public, no key |
| UN Comtrade references | `fetch("https://comtradeapi.un.org/files/v1/app/reference/...")` — public |
| World Bank API | `fetch("https://api.worldbank.org/v2/...")` — public, already direct |
| Gemini AI | `new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })` — follows browserGeminiService.ts |

The un-comtrade-viewer Express server (`server.ts`) is removed entirely. Its rate-limiting queue, retry logic, and caching already live in `comtradeAPI.ts` and `clientCache.ts` on the client side.

### Build

Single `vite build` produces one `dist/`. No separate build step. Tradesight is just another directory in the source tree.

### Dependencies

Merged into tradenexus's `package.json`:

**Already present (no change):** `@google/genai`, `react`, `react-dom`, `lucide-react`, `motion`, `vite`, `typescript`

**Add:** `recharts` (trade charts), `rc-slider` (year range slider)

**Skip:** `@tailwindcss/vite` (tradenexus uses Tailwind CDN), `dotenv`, `express`, `tsx` (no server needed), `@vitejs/plugin-react` (already present)

### Styling

Tradesight switches from build-step Tailwind (`@tailwindcss/vite`) to CDN Tailwind (matching tradenexus). Custom styles live in `tradesight/index.css`. If tradesight needs theme colors beyond tradenexus's existing tailwind config, they're added to the shared `tailwind.config` block in `index.html`.

### Cross-Navigation

- tradenexus nav: link to `/tradesight`
- tradesight nav: link back to `/`

No shared auth or state between the two apps. Tradesight is publicly accessible.

### What Gets Removed

The `un-comtrade-viewer/` directory is obsolete after merge:
- `server.ts` — Express server, replaced by browser-direct calls
- `package.json` / `package-lock.json` — dependencies merged into tradenexus
- `tsconfig.json` / `vite.config.ts` — build config replaced by tradenexus
- `.env.example` / `.gitignore` — replaced by tradenexus equivalents
- `node_modules/` — comes from tradenexus install

### What Stays Unchanged

- Firebase Hosting config (`firebase.json`) — catch-all rewrite already handles `/tradesight/*`
- Dockerfile — one build, one image
- tradenexus `.env` / `.env.example` — `VITE_GEMINI_API_KEY` already present
- tradenexus `server/` directory — untouched (exists for local dev with Express, unused in deployed mode)

### Out of Scope

- Shared auth between tradenexus and tradesight
- Shared state or cross-app data flow
- i18n for tradesight (use existing translations.ts as-is)
