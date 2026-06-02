# TradeNexus Brand Mark Design

**Date:** 2026-06-02
**Status:** Approved
**Topic:** Logo, favicon, and app icon for the TradeNexus AI Sales Agent

## Problem

The app currently has no favicon or brand mark. The browser shows a default grey globe icon. In the app's nav rail, the logo is a plain blue circle (`bg-primary-500/90`) with no symbol inside. TradeNexus needs a distinctive visual identity that works across all sizes and contexts.

## Design

### The Mark: Orbital Bridge

The mark represents two worlds (supplier + buyer) connected through a central nexus — TradeNexus as the platform that bridges global trade.

**Symbolism:**
- **Outer ring** — the global market, the world of opportunity
- **Twin orbital arcs** — supplier and buyer, two sides of every trade relationship
- **Center node (white core on blue)** — the nexus where connections happen and deals are made
- **Left anchor point (blue)** — East / supplier side
- **Right anchor point (lighter blue)** — West / buyer side

**Variant: Bold.** Heavier inner arcs (3.5px stroke at 52×52 viewBox), solid blue center node with white core. Chosen over Balanced and Refined for stronger presence at tiny favicon sizes.

### SVG Source (Primary Mark)

```svg
<svg width="40" height="40" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Outer ring -->
  <circle cx="26" cy="26" r="20" stroke="#3b82f6" stroke-width="2.5" fill="none"/>
  <!-- Upper orbital arc -->
  <path d="M14 26 A12 12 0 0 1 38 26" stroke="#3b82f6" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Lower orbital arc -->
  <path d="M14 26 A12 12 0 0 0 38 26" stroke="#60a5fa" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Left anchor (supplier/east) -->
  <circle cx="14" cy="26" r="4" fill="#3b82f6"/>
  <circle cx="14" cy="26" r="2" fill="white"/>
  <!-- Right anchor (buyer/west) -->
  <circle cx="38" cy="26" r="4" fill="#60a5fa"/>
  <circle cx="38" cy="26" r="2" fill="white"/>
  <!-- Center nexus -->
  <circle cx="26" cy="26" r="5" fill="#3b82f6"/>
  <circle cx="26" cy="26" r="2.5" fill="white"/>
</svg>
```

### Lockup

**Primary: Horizontal.** Icon on the left, "TradeNexus" wordmark on the right, vertically centered. This is the default lockup for the nav bar, page headers, and general branding.

- Icon size: 36–40px
- Gap between icon and text: 14px
- Wordmark: System UI font, weight 800, letter-spacing -0.5px, white (#ffffff)

**Secondary lockups** (context-dependent):
- **Icon-only** — favicon (16×16, 32×32), nav rail button, PWA icon
- **Stacked** — icon above, wordmark below — for landing page hero, social media avatars

### Typography

**System UI** (`system-ui, -apple-system, sans-serif`). Matches the existing app's font stack. No additional font loading required.

- Weight: 800 (Extra Bold)
- Letter-spacing: -0.5px
- Color: #ffffff (white)

### Colors

Uses the app's existing blue palette from the Tailwind config:

| Role | Hex | Tailwind |
|------|-----|----------|
| Primary blue | `#3b82f6` | `primary-500` |
| Accent blue | `#60a5fa` | Lighter blue for depth |
| White highlights | `#ffffff` | Center dots and node cores |
| Background | `#0f172a` | `slate-900` (app's dark bg) |

No new colors introduced. The mark renders correctly on both dark backgrounds (app default) and light backgrounds (landing page, docs).

### Size Variants

| Context | Size | Notes |
|---------|------|-------|
| Favicon | 16×16, 32×32 | Stroke widths scaled up proportionally for legibility |
| Nav rail icon | 36×36 | Replaces the current `bg-primary-500/90` plain circle |
| App icon / PWA | 192×192, 512×512 | Mark centered on dark rounded rectangle |
| OG image | 1200×630 | Full horizontal lockup, large |

## Assets to Produce

1. **`public/favicon.svg`** — SVG favicon (modern browsers)
2. **`public/favicon.ico`** — Multi-size ICO fallback (16, 32, 48px)
3. **`public/icon-192.png`** — PWA icon 192×192
4. **`public/icon-512.png`** — PWA icon 512×512
5. **`public/apple-touch-icon.png`** — Apple touch icon 180×180
6. **`public/logo.svg`** — Full horizontal lockup SVG (icon + wordmark)
7. **`index.html`** — Add `<link rel="icon">` and other meta tags
8. **`App.tsx`** — Replace plain blue circle in nav rail with the SVG mark

## Non-Goals

- No landing page hero redesign (the LandingPage redesign is a separate spec)
- No color palette changes to the existing app
- No typography changes to the existing app
- No animated logo variants (can be explored later)

## Risks / Open Questions

- The mark uses two shades of blue (primary + accent). At 16×16, the distinction is subtle but the mark remains readable because the overall silhouette (circle + arcs) is distinctive.
- If the app ever supports a light theme, the white elements will still work on the dark mark background, but the wordmark would need to switch to dark text.
