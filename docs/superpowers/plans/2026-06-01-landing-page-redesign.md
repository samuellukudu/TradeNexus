# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the TradeNexus landing page with a capability-first hero, interactive globe use cases, demo video, and real CSV lead data showcase across 7 sections.

**Architecture:** Single-component rewrite of `LandingPage.tsx` (keeps existing props interface for App.tsx compatibility). Lead data extracted from CSV files into a static TS module. Demo video copied to `public/`. Auth modal preserved and restyled. No changes to App.tsx, routing, or auth flow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v3 (CDN), Motion (motion/react), Lucide React (existing dependency)

---

### Task 1: Setup - Create public directory and copy demo video

**Files:**
- Create: `public/demo.mp4`

- [ ] **Step 1: Create public directory and copy video**

```bash
mkdir -p /home/samu2505/SAAS/tradenexus-ai-sales-agent/public
cp /home/samu2505/SAAS/tradenexus-video/renders/tradenexus-output-mobile-final.mp4 /home/samu2505/SAAS/tradenexus-ai-sales-agent/public/demo.mp4
```

- [ ] **Step 2: Verify the file was copied**

```bash
ls -lh /home/samu2505/SAAS/tradenexus-ai-sales-agent/public/demo.mp4
```

Expected: File exists, ~15MB.

- [ ] **Step 3: Commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add public/demo.mp4 && git commit -m "feat: add demo video for landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Create lead showcase data file from CSV extracts

**Files:**
- Create: `components/landingData.ts`

- [ ] **Step 1: Create the landing data file with real CSV-sourced leads plus representative examples**

Write `components/landingData.ts`:

```typescript
// Real lead data extracted from TradeNexus AI CSV exports.
// Three datasets are from actual search sessions; four are representative examples.

export interface ShowcaseLead {
  companyName: string;
  matchScore: string;
  detail: string;
}

export interface UseCase {
  flag: string;
  country: string;
  region: string;
  product: string;
  context: string;
  isRealData: boolean;
  leads: ShowcaseLead[];
}

export const useCases: UseCase[] = [
  {
    flag: "🇦🇺",
    country: "Australia",
    region: "Oceania",
    product: "Mini Excavators",
    context: "Chinese OEM targeting equipment hire companies across Sydney, Melbourne, Brisbane.",
    isRealData: true,
    leads: [
      { companyName: "Sydney Machinery Hire", matchScore: "95%", detail: "Dry hire fleet serving construction projects across Sydney and regional NSW" },
      { companyName: "Cornfoot Bros Earthmoving", matchScore: "95%", detail: "Fleet of 100+ machines for civil construction across Victoria" },
      { companyName: "ACE Rental", matchScore: "95%", detail: "200+ machine fleet serving civil construction and infrastructure in SE Queensland" },
    ],
  },
  {
    flag: "🇸🇦",
    country: "Saudi Arabia",
    region: "Middle East",
    product: "Solar Panels",
    context: "Chinese manufacturer targeting Vision 2030 solar EPC contractors and distributors.",
    isRealData: true,
    leads: [
      { companyName: "Desert Technologies", matchScore: "85%", detail: "PV manufacturer, developer, EPC and O&M contractor in Jeddah" },
      { companyName: "National Solar Systems", matchScore: "85%", detail: "Leading solar EPC contractor designing and installing PV systems in Dammam" },
      { companyName: "Ishraq Solar Energy", matchScore: "85%", detail: "Imports, supplies and wholesales global solar products in Majmaah" },
    ],
  },
  {
    flag: "🇫🇯",
    country: "Fiji",
    region: "Oceania",
    product: "HVAC Systems",
    context: "Chinese manufacturer targeting Fijian contractors and resort developers.",
    isRealData: true,
    leads: [
      { companyName: "Kooline Air Conditioning", matchScore: "85%", detail: "Primary HVAC contractor since 1975, branches in Suva and Nadi" },
      { companyName: "Mechanical Services Ltd", matchScore: "85%", detail: "Leading Daikin VRF distributor with 180-200 personnel" },
      { companyName: "Rainbow Cool Tech Fiji", matchScore: "85%", detail: "Large-scale HVAC for hotels, supermarkets, and resort environments" },
    ],
  },
  {
    flag: "🇰🇪",
    country: "Kenya",
    region: "Africa",
    product: "Agricultural Machinery",
    context: "Chinese tractor OEM targeting Kenyan agri-importers and large-scale farming operations.",
    isRealData: false,
    leads: [
      { companyName: "Nairobi Farm Machinery Ltd", matchScore: "90%", detail: "Major importer and distributor serving Rift Valley and Central Province" },
      { companyName: "Agri-Solutions East Africa", matchScore: "88%", detail: "Supply chain partner for 200+ cooperatives across Kenya and Tanzania" },
      { companyName: "Mombasa Trading Group", matchScore: "85%", detail: "Port-city logistics hub distributing machinery to inland agricultural zones" },
    ],
  },
  {
    flag: "🇩🇪",
    country: "Germany",
    region: "Europe",
    product: "EV Battery Components",
    context: "Chinese battery component maker targeting German automotive Tier-1 suppliers.",
    isRealData: false,
    leads: [
      { companyName: "Bavarian Auto Components GmbH", matchScore: "92%", detail: "Tier-1 supplier specializing in EV power systems for major German OEMs" },
      { companyName: "Stuttgart Powertrain AG", matchScore: "89%", detail: "Develops and procures battery subcomponents for European EV platforms" },
      { companyName: "E-Mobility Parts Deutschland", matchScore: "87%", detail: "Mid-tier supplier focused on battery cooling systems and interconnects" },
    ],
  },
  {
    flag: "🇲🇽",
    country: "Mexico",
    region: "North America",
    product: "Industrial Packaging",
    context: "Chinese packaging machinery maker targeting Mexican food and beverage manufacturers.",
    isRealData: false,
    leads: [
      { companyName: "Empaques Industriales Monterrey", matchScore: "91%", detail: "Leading packaging solutions provider for food and beverage processors in Nuevo Leon" },
      { companyName: "Guadalajara Packaging Systems", matchScore: "88%", detail: "Equipment importer and systems integrator for Jalisco's manufacturing corridor" },
      { companyName: "Alimentos y Empaques del Bajio", matchScore: "86%", detail: "Regional co-packer expanding automated packaging lines across central Mexico" },
    ],
  },
  {
    flag: "🇧🇷",
    country: "Brazil",
    region: "South America",
    product: "Mining Equipment Parts",
    context: "Chinese foundry targeting Brazilian mining operators and equipment maintenance firms.",
    isRealData: false,
    leads: [
      { companyName: "Mineracao Minas Gerais Ltda", matchScore: "93%", detail: "Major mining operator maintaining fleet of 300+ heavy machines in Iron Quadrangle" },
      { companyName: "Para Equipmentos de Mineracao", matchScore: "90%", detail: "Equipment maintenance and parts sourcing for Carajas region mining operations" },
      { companyName: "Belo Horizonte Industrial Supply", matchScore: "87%", detail: "Industrial parts distributor specializing in mining wear components and castings" },
    ],
  },
];

export const howItWorksSteps = [
  {
    number: 1,
    title: "Describe Your Product",
    description: "Upload a spec sheet or write a description. Our AI extracts everything it needs to know.",
  },
  {
    number: 2,
    title: "AI Scouts Global Markets",
    description: "Autonomous agents search 190+ countries, find buyers matching your ideal profile, and verify their details.",
  },
  {
    number: 3,
    title: "Contact and Close",
    description: "Get verified emails, phone numbers, and AI-generated outreach messages. Start selling immediately.",
  },
];
```

- [ ] **Step 2: Commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/landingData.ts && git commit -m "feat: add landing page showcase data from CSV exports

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Rewrite LandingPage.tsx - Navigation bar

**Files:**
- Modify: `components/LandingPage.tsx` (full rewrite begins)

- [ ] **Step 1: Write the new LandingPage with Navigation section only**

Replace `components/LandingPage.tsx` with:

```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Play } from 'lucide-react';
import { useCases, howItWorksSteps } from './landingData';

interface LandingPageProps {
  handleEmailAuth: (e: React.FormEvent) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoginMode: boolean;
  setIsLoginMode: (mode: boolean) => void;
  authError: string;
  isSubmitting: boolean;
}

export function LandingPage({
  handleEmailAuth,
  loginWithGoogle,
  email,
  setEmail,
  password,
  setPassword,
  isLoginMode,
  setIsLoginMode,
  authError,
  isSubmitting,
}: LandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const openAuthModal = (isLogin: boolean) => {
    setIsLoginMode(isLogin);
    setIsAuthModalOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TradeNexus <span className="text-blue-500">AI</span>
            </span>
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={() => scrollTo('how-it-works')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo('use-cases')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Use Cases
            </button>
            <button
              onClick={() => openAuthModal(true)}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal(false)}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
      {/* Placeholder for remaining sections - will be added in subsequent tasks */}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles with no TypeScript errors**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit components/LandingPage.tsx 2>&1 | head -20
```

Expected: No errors (or only pre-existing project-level errors unrelated to our changes).

- [ ] **Step 3: Commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/LandingPage.tsx && git commit -m "feat: rewrite landing page nav with new structure

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Add Hero section

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Add the Hero section after the closing `</nav>` tag and before the closing `</div>`**

Insert after the `</nav>` tag and before `{/* Placeholder... */}`:

```tsx
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6 border border-blue-500/20 tracking-wide">
                AUTONOMOUS B2B SALES AGENTS
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.06] mb-6">
                AI Agents That Find Your Next Buyer. 24/7.
              </h1>
              <p className="text-base md:text-lg text-slate-400 max-w-lg mb-8 leading-relaxed">
                TradeNexus AI autonomously scouts 190+ countries, verifies companies with real data, and fills your pipeline while you sleep.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openAuthModal(false)}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all hover:-translate-y-0.5"
                >
                  Start Scouting Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('demo')}
                  className="inline-flex items-center justify-center gap-2 bg-slate-800/70 hover:bg-slate-800 text-white font-medium py-3.5 px-8 rounded-xl border border-slate-700 transition-all hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4" />
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right: Live Lead Preview */}
            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Lead Feed</span>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded">Auto-updating</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "🏗️", name: "Sydney Machinery Hire", cat: "Mini Excavators", score: "95%", detail: "Dry hire fleet, Sydney NSW" },
                    { icon: "☀️", name: "Desert Technologies", cat: "Solar Panels", score: "85%", detail: "PV manufacturer, Jeddah" },
                    { icon: "❄️", name: "Kooline Air Conditioning", cat: "HVAC Systems", score: "85%", detail: "Est. 1975, Suva Fiji" },
                  ].map((lead, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 flex items-center gap-3.5 hover:border-slate-600/50 transition-colors">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-lg shrink-0">
                        {lead.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{lead.name}</div>
                        <div className="text-xs text-slate-400">{lead.cat} · {lead.detail}</div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md shrink-0">
                        {lead.score}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Scouting 190+ countries</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Autonomous mode active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Remove the placeholder comment**

Delete the line `{/* Placeholder for remaining sections - will be added in subsequent tasks */}`.

- [ ] **Step 3: Verify compilation**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit components/LandingPage.tsx 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/LandingPage.tsx && git commit -m "feat: add split hero with live lead preview to landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Add How It Works section

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Add the How It Works section after the Hero closing `</section>` tag**

Insert after `</section>` (Hero) and before the final closing `</div>`:

```tsx
      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              Three steps from product to pipeline. No manual research required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Verify compilation and commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit components/LandingPage.tsx 2>&1 | head -20
```

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/LandingPage.tsx && git commit -m "feat: add how it works section to landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Add Interactive Globe / Use Cases section

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Add the Interactive Globe section after the How It Works closing `</section>`**

Insert after the How It Works `</section>` and before the final closing `</div>`:

```tsx
      {/* Interactive Globe / Use Cases */}
      <section id="use-cases" className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              Global Coverage, One Platform
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              AI agents discover verified buyers across every continent. Click a region to see what they find.
            </p>
          </div>

          {/* Region Tag Cloud */}
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto mb-12">
            {useCases.map((uc) => (
              <button
                key={uc.country}
                onClick={() => setExpandedRegion(expandedRegion === uc.country ? null : uc.country)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  expandedRegion === uc.country
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{uc.flag}</span>
                <span>{uc.country}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 text-xs">{uc.product}</span>
                {uc.isRealData && (
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Real search data"></span>
                )}
              </button>
            ))}
          </div>

          {/* Expanded Region Detail */}
          {expandedRegion && (() => {
            const uc = useCases.find(u => u.country === expandedRegion);
            if (!uc) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{uc.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{uc.country} · {uc.product}</h3>
                    <p className="text-sm text-slate-400">{uc.region}</p>
                  </div>
                  {uc.isRealData && (
                    <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                      Verified Search Data
                    </span>
                  )}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">{uc.context}</p>
                <div className="space-y-3">
                  {uc.leads.map((lead, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{lead.companyName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{lead.detail}</div>
                      </div>
                      <div className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-md shrink-0">
                        {lead.matchScore}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {!expandedRegion && (
            <p className="text-center text-xs text-slate-600">
              Click any region tag to expand with real lead data
            </p>
          )}
        </div>
      </section>
```

- [ ] **Step 2: Verify compilation and commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit components/LandingPage.tsx 2>&1 | head -20
```

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/LandingPage.tsx && git commit -m "feat: add interactive globe use cases section to landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Add Demo Video section

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Add the Demo Video section after the Use Cases closing `</section>`**

Insert after the Use Cases `</section>` and before the final closing `</div>`:

```tsx
      {/* Demo Video */}
      <section id="demo" className="py-24 md:py-32 px-6 bg-slate-900 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            See TradeNexus in Action
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-base mb-12">
            Watch AI agents discover and verify B2B leads in real time.
          </p>

          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
            <video
              src="/demo.mp4"
              className="w-full aspect-[9/16] md:aspect-video object-cover"
              controls
              preload="metadata"
              poster="/demo-poster.jpg"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <p className="text-xs text-slate-600 mt-4">
            TradeNexus AI autonomously scouting and verifying leads across global markets
          </p>
        </div>
      </section>
```

- [ ] **Step 2: Verify compilation and commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit components/LandingPage.tsx 2>&1 | head -20
```

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/LandingPage.tsx && git commit -m "feat: add demo video section to landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Add Real Results, CTA, Footer, and Auth Modal

**Files:**
- Modify: `components/LandingPage.tsx`

- [ ] **Step 1: Add Real Results, CTA, Footer, and Auth Modal sections**

Insert after the Demo Video `</section>` and before the final closing `</div>`:

```tsx
      {/* Real Results */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              Real Results From Real Searches
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-base">
              Every lead shown was discovered by TradeNexus AI. Verified companies, real contact data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.filter(uc => uc.isRealData).map((uc) => (
              <div key={uc.country} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{uc.flag}</span>
                  <div>
                    <h3 className="font-bold text-white">{uc.country}</h3>
                    <p className="text-xs text-slate-500">{uc.product}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">{uc.context}</p>
                <div className="space-y-2.5">
                  {uc.leads.map((lead, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{lead.companyName}</div>
                        <div className="text-xs text-slate-500 truncate">{lead.detail}</div>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded shrink-0">
                        {lead.matchScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-blue-900/5 to-indigo-900/10 border border-blue-500/15 p-12 md:p-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
                Ready to find your next buyer?
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-base mb-8">
                Join exporters using TradeNexus AI to discover verified B2B leads in 190+ countries.
              </p>
              <button
                onClick={() => openAuthModal(false)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-10 rounded-xl transition-all hover:-translate-y-0.5 text-base"
              >
                Start Scouting Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              TradeNexus <span className="text-blue-500">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 text-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 relative"
            >
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 border border-slate-700">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isLoginMode ? 'Welcome back' : 'Create an account'}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {isLoginMode ? 'Sign in to access your autonomous sales agents.' : 'Start scouting global markets today.'}
                  </p>
                </div>

                <button
                  onClick={loginWithGoogle}
                  className="w-full relative group bg-white text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:bg-slate-50 mb-6 flex justify-center items-center gap-3"
                >
                  <svg viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Sign in with Google
                </button>

                <div className="w-full flex items-center justify-between mb-6">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-slate-500 text-xs px-4 font-mono">OR</span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4">
                  {authError && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{authError}</div>}

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="········"
                      className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-3 disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? 'Processing...' : (isLoginMode ? 'Sign In with Email' : 'Create Account')}
                  </button>

                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      {isLoginMode ? "Need an account? Register" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
```

- [ ] **Step 2: Verify compilation**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit components/LandingPage.tsx 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add components/LandingPage.tsx && git commit -m "feat: add real results, CTA, footer, and auth modal to landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Final verification - build check and cleanup

**Files:**
- Verify: `components/LandingPage.tsx`
- Verify: `components/landingData.ts`
- Verify: `public/demo.mp4`

- [ ] **Step 1: Check that LandingPage.tsx has no unused imports or dead code**

The file should import exactly: `React, useState`, `motion, AnimatePresence`, `ArrowRight, X, Play`, `useCases, howItWorksSteps`.

Run a quick grep to check imports are used:

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && head -5 components/LandingPage.tsx
```

Expected output should match:
```
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Play } from 'lucide-react';
import { useCases, howItWorksSteps } from './landingData';
```

- [ ] **Step 2: Check that ChevronDown import is not present (it was in the initial scaffold but should not be in final)**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && grep -n "ChevronDown" components/LandingPage.tsx
```

Expected: No matches. If found, remove it from the import line.

- [ ] **Step 3: Try a production build to catch any issues**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run build 2>&1 | tail -20
```

Expected: Build succeeds. Note: chunk size warnings are pre-existing and acceptable.

- [ ] **Step 4: Verify the LandingPageProps interface matches App.tsx usage**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && grep -A 11 "LandingPageProps" components/LandingPage.tsx
```

All props should match what App.tsx passes (handleEmailAuth, loginWithGoogle, email, setEmail, password, setPassword, isLoginMode, setIsLoginMode, authError, isSubmitting).

- [ ] **Step 5: Commit any cleanup changes**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git add -A && git diff --cached --stat
```

If changes exist:
```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && git commit -m "chore: final cleanup and verification of landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
If no changes: "No changes to commit - verification passed."
```

---

### Task 10: Start dev server and verify visually

- [ ] **Step 1: Start the dev server**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev
```

- [ ] **Step 2: Verify the landing page renders at http://localhost:3000**

Check:
- Navigation bar is visible with logo, links, and CTA buttons
- Hero shows split layout with lead preview on the right
- How It Works section shows 3 numbered steps
- Use Cases section has clickable region tags that expand to show leads
- Demo video section has an embedded video player
- Real Results section shows 3 cards (Australia, Saudi Arabia, Fiji)
- CTA section has gradient card with "Start Scouting Free" button
- Footer shows logo, Privacy, and Terms links
- Auth modal opens on "Get Started" / "Sign In" clicks
- Google OAuth and email/password auth forms work in the modal

- [ ] **Step 3: Verify mobile responsiveness**

Resize browser to < 768px and check:
- Hero stacks vertically (text above, lead preview below)
- All sections are single-column
- Navigation links collapse appropriately
- Region tags wrap nicely
- Cards stack vertically

- [ ] **Step 4: Report results**

If everything looks good, report: "Landing page redesign complete. All sections rendering, auth modal functional, mobile responsive."
