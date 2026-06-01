# Landing Page Redesign

**Date:** 2026-06-01
**Status:** Draft
**Product:** TradeNexus AI Sales Agent

## Design Read

B2B SaaS landing for Chinese manufacturers/exporters targeting global buyers, with a capability-first dark tech language, leaning toward Tailwind + Geist + restrained scroll-driven motion.

**Dials:** DESIGN_VARIANCE 7 / MOTION_INTENSITY 6 / VISUAL_DENSITY 4

## Problem

The current landing page ([LandingPage.tsx](../components/LandingPage.tsx)) is thin and unconvincing:

- Hero is vague ("The AI Engine for Global Suppliers") and doesn't explain the concrete pain point
- Zero screenshots, video, or product visuals — no trust built
- No real data examples despite having verified CSV lead data from 3 regions
- Benefits section is generic feature bullets, not specific use cases
- Only 3 sections total (hero, benefits, CTA) — feels like a template

## Assets Available

- **Real lead data:** Fiji HVAC (13 leads), Australia mini excavators (14 leads), Saudi Arabia solar (10 leads) — CSV files with company names, contact info, confidence scores, match reasoning
- **Demo videos:** Multiple rendered MP4 files in `tradenexus-video/renders/` showing the product UI in action
- **UI templates:** HTML composition templates in `tradenexus-video/compositions/`

## Design Decisions

### Hero Messaging: Capability-First

Lead with what the AI can do, then prove it with data. "AI Agents That Find Your Next Buyer. 24/7." communicates autonomous scale. Subtext explains the concrete capability: scouts 190+ countries, verifies companies, fills pipeline automatically.

### Page Structure: Screenshots + Video Section

Clean split hero (text left, live lead preview right). Dedicated "See It In Action" section below with embedded demo video. Avoids video-in-hero performance issues while still showcasing the product visually.

### Use Cases: Global Coverage

7 use cases across 6 continents with 7 different product categories. Three powered by real CSV data, four as representative examples demonstrating platform breadth:

| Country | Region | Product | Data Source |
|---------|--------|---------|-------------|
| Fiji | Oceania | HVAC Systems | Real CSV |
| Australia | Oceania | Mini Excavators | Real CSV |
| Saudi Arabia | Middle East | Solar Panels | Real CSV |
| Kenya | Africa | Agricultural Machinery | Representative |
| Germany | Europe | EV Battery Components | Representative |
| Mexico | North America | Industrial Packaging | Representative |
| Brazil | South America | Mining Equipment Parts | Representative |

No lead counts shown anywhere — lead quality, not quantity.

### Use Case Display: Interactive Globe / Tag Cloud

Clickable region tags arranged as an interactive cloud. Each tag shows flag + country + product category. Clicking expands to show real lead names. More engaging than a static card grid.

## Page Structure (7 Sections)

### 1. Navigation
- Fixed top bar, backdrop-blur, border-b
- Logo (pulsing dot + "TradeNexus AI")
- Links: How It Works, Use Cases
- CTA: "Get Started" (pill button, blue)

### 2. Hero (Split Layout)
- **Left:** Eyebrow badge ("AUTONOMOUS B2B SALES AGENTS"), headline ("AI Agents That Find Your Next Buyer. 24/7."), subtext (max 20 words), two CTAs (primary: "Start Scouting Free", secondary: "Watch Demo")
- **Right:** Live lead preview card — a mini dashboard showing 3 real verified leads with company name, product category, confidence %, and "Verified" badge
- Font: Geist or system sans, `text-5xl`/`text-6xl` headline
- No scroll cues, no trust strips in hero

### 3. How It Works
- 3-step horizontal flow: Describe Product → AI Scouts → Contact & Close
- Centered headline + subtext
- Each step: numbered circle icon, title, one-line description
- Clean, scannable, no icons overload

### 4. Interactive Globe / Use Cases
- Centered headline: "Global Coverage, One Platform"
- Large globe visual or tag cloud with 7 region tags
- Tags: flag emoji + country + product category
- Click interaction: expands to show 2-3 real lead names per region
- 3 tags backed by real data marked subtly differently

### 5. Demo Video
- Centered headline: "See TradeNexus in Action"
- Embedded video player with play button overlay
- Dark container with border, rounded
- Uses existing rendered MP4 from `tradenexus-video/renders/`

### 6. Real Results
- Centered headline: "Real Results From Real Searches"
- 3-column grid (1-col mobile) — Australia, Saudi Arabia, Fiji
- Each card: flag, country, product, context description, 3 sample lead names with match scores
- Data sourced directly from CSV files

### 7. CTA
- Single focused conversion section
- Gradient-accented card container
- Headline: "Ready to find your next buyer?"
- Subtext about joining exporters using TradeNexus
- One button: "Start Scouting Free"

### 8. Footer
- Minimal: logo, Privacy link, Terms link
- No version footers, no locale strips, no decoration

## Visual Design Rules (from taste skill)

### Color
- One accent: blue (`#2563eb` / `#3b82f6`)
- Neutral base: slate-950 background, slate-900/800 surfaces
- No purple glow, no gradient text on headlines
- One palette, consistent across all sections

### Typography
- Sans font: System sans-serif stack (`ui-sans-serif, system-ui, -apple-system, ...`) — Geist would be ideal but we use Tailwind CDN (no `next/font`), so system stack is the correct default
- Mono font: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas` (already configured in Tailwind config)
- No Inter as default
- No serif injection in headlines
- No em-dashes anywhere

### Layout Discipline
- Each section uses a distinct layout family (split, 3-column, centered, grid, card)
- No 3+ consecutive image-text zigzags
- No "left headline + right explainer" section headers — stack vertically
- Hero: max 4 text elements, max `pt-24` at desktop, fits viewport

### Motion
- Entry transitions on hero (Motion `whileInView`)
- Scroll-reveal stagger on feature cards
- Globe/tag section: hover scale + click expand (CSS transitions)
- No `window.addEventListener('scroll')` — use Motion or CSS only
- `prefers-reduced-motion` respected throughout

### What's Banned
- Em-dashes (anywhere)
- Fake-precise numbers (no "92%", "4.1x" without real data)
- Version labels in hero (no "v1.0", "BETA")
- Section-numbering eyebrows (no "01 / How It Works")
- Scroll cues (no "Scroll to explore")
- Decorative dots (except the logo pulse)
- Div-based fake screenshots (use real data in the preview card)
- Duplicate CTA intent (one label: "Start Scouting Free")

## Implementation Scope

### What Changes
- **Rewrite [LandingPage.tsx](../components/LandingPage.tsx)** — full replacement with new sections
- **No changes** to `App.tsx`, auth flow, routing, or any other component
- **Add video file** — copy `tradenexus-video/renders/tradenexus-output-mobile-final.mp4` (15MB, polished UI demo) to `public/demo.mp4` for the demo video section
- **Import lead data** — reference CSV data as static TS objects for the use case cards. Three real datasets (Fiji HVAC, Australia excavators, Saudi Arabia solar) plus four representative examples for remaining continents.

### What Stays
- Tailwind CDN config in `index.html` (v3, already configured)
- Auth modal (login/register with Google + email) — keep as-is, just restyle to match
- Motion library already imported (`motion/react`)
- Lucide icons already in use (acceptable per existing dependency)

## Success Criteria

- Hero clearly communicates what TradeNexus does in under 5 seconds
- Demo video is visible and playable
- Real lead data is showcased with specific company names
- Page works on mobile (single column, readable)
- Auth modal still functions correctly
- No broken existing functionality (privacy/terms pages, auth flow)
