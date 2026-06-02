# Tradesight Monorepo Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge un-comtrade-viewer into tradenexus-ai-sales-agent as a side app at `/tradesight`, following tradenexus's browser-direct API pattern.

**Architecture:** Single Vite SPA with a path router in index.tsx. Tradesight lives in `tradesight/` directory. All API calls go browser-direct (UN Comtrade, World Bank, Gemini) — no Express proxy needed. One `vite build`, one `dist/`, pure Firebase Hosting deploy.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind CSS (CDN), recharts, rc-slider, @google/genai

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `tradesight/lib/bm25.ts` | BM25 text search (moved as-is) |
| Create | `tradesight/lib/clientCache.ts` | Browser session-storage cache (moved as-is) |
| Create | `tradesight/lib/translations.ts` | EN/ZH i18n strings (moved as-is) |
| Create | `tradesight/types.ts` | Tradesight-specific TypeScript types |
| Create | `tradesight/services/worldBankAPI.ts` | World Bank API calls (moved as-is, already browser-direct) |
| Create | `tradesight/services/comtradeAPI.ts` | UN Comtrade API calls (rewritten for browser-direct) |
| Create | `tradesight/services/geminiService.ts` | Browser-direct Gemini recommendations (new) |
| Create | `tradesight/LandingPage.tsx` | Tradesight landing/hero page (moved, imports adapted) |
| Create | `tradesight/App.tsx` | Main tradesight dashboard (moved, API calls adapted) |
| Create | `tradesight/index.css` | Tradesight-specific styles |
| Modify | `package.json` | Add recharts, rc-slider dependencies |
| Modify | `index.tsx` | Add path router for `/tradesight` |
| Modify | `App.tsx` | Add link to `/tradesight` in tradenexus nav |

---

### Task 1: Add New Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add recharts and rc-slider to package.json**

Read `package.json`, then use Edit to add the two packages. The dependencies section currently has `motion` as the last entry before the closing `}`. Add after `motion`:

```json
"rc-slider": "^11.1.9",
"recharts": "^3.8.1",
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: Installs recharts and rc-slider into node_modules

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add recharts and rc-slider for tradesight"
```

---

### Task 2: Create Directory Structure & Move Lib Files

**Files:**
- Create: `tradesight/lib/bm25.ts`
- Create: `tradesight/lib/clientCache.ts`
- Create: `tradesight/lib/translations.ts`

- [ ] **Step 1: Create directories**

```bash
mkdir -p tradesight/lib tradesight/services
```

- [ ] **Step 2: Copy bm25.ts (no changes needed)**

Copy `/home/samu2505/SAAS/un-comtrade-viewer/src/lib/bm25.ts` to `tradesight/lib/bm25.ts` verbatim.

- [ ] **Step 3: Copy clientCache.ts (no changes needed)**

Copy `/home/samu2505/SAAS/un-comtrade-viewer/src/lib/clientCache.ts` to `tradesight/lib/clientCache.ts` verbatim.

- [ ] **Step 4: Copy translations.ts (no changes needed)**

Copy `/home/samu2505/SAAS/un-comtrade-viewer/src/lib/translations.ts` to `tradesight/lib/translations.ts` verbatim.

- [ ] **Step 5: Commit**

```bash
git add tradesight/lib/
git commit -m "feat: add tradesight lib files (bm25, cache, translations)"
```

---

### Task 3: Create Tradesight Types

**Files:**
- Create: `tradesight/types.ts`

- [ ] **Step 1: Write types.ts**

```typescript
export interface TradeRecord {
  period: string;
  reporterCode: number;
  reporterDesc: string;
  partnerCode: number;
  partnerDesc: string;
  partner2Code?: number;
  flowCode: string;
  flowDesc: string;
  cmdCode: string;
  cmdDesc: string;
  primaryValue: number;
  netWgt?: number;
  qty?: number;
}

export interface TradeDataResponse {
  data: TradeRecord[];
}

export interface ReferenceItem {
  id: string;
  text: string;
  reporterCodeIsoAlpha3?: string;
  reporterCodeIsoAlpha2?: string;
}

export interface ReferenceResponse {
  results: ReferenceItem[];
}

export interface Recommendation {
  id: string;
  title: string;
  category: string;
  impact: string;
  timeframe: string;
  description: string;
  actionSteps: string[];
  metricsLink: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add tradesight/types.ts
git commit -m "feat: add tradesight types"
```

---

### Task 4: Move World Bank API Service (Browser-Direct, No Changes)

**Files:**
- Create: `tradesight/services/worldBankAPI.ts`

- [ ] **Step 1: Copy worldBankAPI.ts and fix import path**

Copy `/home/samu2505/SAAS/un-comtrade-viewer/src/services/worldBankAPI.ts` to `tradesight/services/worldBankAPI.ts`.

The import `from '../lib/clientCache'` resolves correctly from `tradesight/services/` → `tradesight/lib/`. No changes needed.

- [ ] **Step 2: Commit**

```bash
git add tradesight/services/worldBankAPI.ts
git commit -m "feat: add tradesight World Bank API service (browser-direct)"
```

---

### Task 5: Rewrite Comtrade API for Browser-Direct UN Comtrade Calls

**Files:**
- Create: `tradesight/services/comtradeAPI.ts`

This is the key rewrite. The current version calls `/api/trade-data`, `/api/reporters`, `/api/partners`, `/api/hs-codes` (Express proxy). The new version calls UN Comtrade directly.

- [ ] **Step 1: Write the rewritten comtradeAPI.ts**

```typescript
import type { TradeRecord, ReferenceItem } from '../types';
import { getCachedOrFetchClient } from '../lib/clientCache';

const COMRADE_PREVIEW_BASE = 'https://comtradeapi.un.org/public/v1/preview/C/A/HS';
const COMRADE_REF_BASE = 'https://comtradeapi.un.org/files/v1/app/reference';

let requestPromise: Promise<void> = Promise.resolve();

const fetchTradeDataDirect = async (url: string): Promise<TradeRecord[]> => {
  return getCachedOrFetchClient(url, async () => {
    await new Promise<void>(resolveSelf => {
      requestPromise = requestPromise.then(async () => {
        resolveSelf();
        await new Promise(res => setTimeout(res, 1200));
      });
    });

    const response = await fetch(url);
    if (!response.ok) {
      let errorMsg = 'Failed to fetch trade data';
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (_e) { /* ignore */ }
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return (data.data as TradeRecord[]).filter((record) => record.partner2Code === 0);
  });
};

export const fetchTradeData = async (
  reporterCode: string,
  partnerCode: string,
  flowCode: string,
  cmdCode: string = 'TOTAL',
  period?: string
): Promise<TradeRecord[]> => {
  const buildUrl = (p: string) =>
    `${COMRADE_PREVIEW_BASE}?reporterCode=${reporterCode}&partnerCode=${partnerCode}&cmdCode=${cmdCode}&flowCode=${flowCode}${p ? `&period=${p}` : ''}`;

  if (!period) {
    return fetchTradeDataDirect(buildUrl(''));
  }

  const periods = period.split(',').map(p => p.trim()).filter(Boolean);
  const CHUNK_SIZE = 5;
  const allRecords: TradeRecord[] = [];
  for (let i = 0; i < periods.length; i += CHUNK_SIZE) {
    const chunk = periods.slice(i, i + CHUNK_SIZE).join(',');
    try {
      const data = await fetchTradeDataDirect(buildUrl(chunk));
      allRecords.push(...data);
    } catch (err) {
      console.warn('Failed fetching chunk:', chunk);
    }
  }
  return allRecords;
};

export const fetchReporters = async (): Promise<ReferenceItem[]> => {
  const url = `${COMRADE_REF_BASE}/Reporters.json`;
  return getCachedOrFetchClient(url, async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return getDefaultCountries();
      const data = await response.json();
      return (data.results as ReferenceItem[]).filter(r => r.id !== 'all');
    } catch (_err) {
      return getDefaultCountries();
    }
  }, 1000 * 60 * 60 * 24);
};

export const fetchPartners = async (): Promise<ReferenceItem[]> => {
  const url = `${COMRADE_REF_BASE}/partnerAreas.json`;
  return getCachedOrFetchClient(url, async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return getDefaultCountries();
      const data = await response.json();
      return (data.results as ReferenceItem[]);
    } catch (_err) {
      return getDefaultCountries();
    }
  }, 1000 * 60 * 60 * 24);
};

export const fetchHsCodes = async (): Promise<ReferenceItem[]> => {
  const url = `${COMRADE_REF_BASE}/HS.json`;
  return getCachedOrFetchClient(url, async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results as ReferenceItem[]);
    } catch (_err) {
      return [];
    }
  }, 1000 * 60 * 60 * 24);
};

const getDefaultCountries = (): ReferenceItem[] => [
  { id: '842', text: 'USA' },
  { id: '156', text: 'China' },
  { id: '276', text: 'Germany' },
  { id: '392', text: 'Japan' },
  { id: '826', text: 'United Kingdom' },
  { id: '356', text: 'India' },
];
```

- [ ] **Step 2: Commit**

```bash
git add tradesight/services/comtradeAPI.ts
git commit -m "feat: add tradesight Comtrade API service (browser-direct UN Comtrade calls)"
```

---

### Task 6: Create Browser-Direct Gemini Service for Tradesight

**Files:**
- Create: `tradesight/services/geminiService.ts`

Follows `services/browserGeminiService.ts` conventions. Replicates the recommendation and chat logic from un-comtrade-viewer's `server.ts` but calls Gemini directly from the browser.

- [ ] **Step 1: Write geminiService.ts**

```typescript
import { GoogleGenAI, Type } from '@google/genai';
import type { Recommendation } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const DEFAULT_MODEL = (import.meta.env.VITE_GEMINI_DEFAULT_MODEL as string | undefined) || 'gemini-2.5-flash';

export const hasTradesightGeminiKey = Boolean(apiKey);

const getAiClient = () => {
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
};

interface RecommendationParams {
  countryName: string;
  segment: 'founder' | 'merchant';
  gdp: string;
  tradeM: string;
  tradeX: string;
  fdi: string;
  commodity: string;
  gdpCapitaPpp: string;
  inflation: string;
}

export const generateRecommendations = async (
  params: RecommendationParams
): Promise<{ recommendations: Recommendation[]; isAiGenerated: boolean; error?: string }> => {
  const {
    countryName, segment, gdp, tradeM, tradeX, fdi, commodity, gdpCapitaPpp, inflation
  } = params;

  // Fallback data when no API key
  if (!hasTradesightGeminiKey) {
    return { recommendations: getFallbackRecommendations(countryName, commodity, segment, gdp, tradeM, tradeX, fdi), isAiGenerated: false };
  }

  try {
    const ai = getAiClient();
    const prompt = `A founder or small business in ${countryName} is seeking advice.
Our active commodity/industry group is: "${commodity}".
The current macroeconomic status indicators are:
- GDP: ${gdp}
- Total Imports: ${tradeM}
- Total Exports: ${tradeX}
- FDI net inflows: ${fdi}
- GDP per Capita (PPP, constant 2017 international $): ${gdpCapitaPpp}
- Consumer Inflation Rate (annual %): ${inflation}

Segment parameter: "${segment}" (${segment === 'founder' ? 'Founders & tech-focused Startups' : 'Small, traditional brick-and-mortar Local Businesses & Merchants'}).

Please generate exactly 4 highly tactical, insightful, and realistic recommendations for this segment.
Make them deeply specific to the country's macroeconomic context, competitive advantages, or trade flows. Reference real concepts like leveraging FDI inflows to build support ecosystems, using high imports to justify import-substitution startups, or exporting premium local goods.
Each recommendation must list exactly 3 actionable steps and explain which macroeconomic metric (like purchasing power, local consumer inflation, or FDI) inspired the concept.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: segment === 'founder'
          ? 'You are an elite B2B venture designer and macroeconomic investment consultant. Your focus is identifying lucrative startup niches, import-substitutions, and technology platform opportunities that fuel job creation and scaling.'
          : 'You are a master small business advisor and retail operations expert. Your focus is giving hyper-practical, street-smart, concrete survival, resilience, and growth recommendations to everyday storefronts, merchants, and local services.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  metricsLink: { type: Type.STRING }
                },
                required: ['id', 'title', 'category', 'impact', 'timeframe', 'description', 'actionSteps', 'metricsLink']
              }
            }
          },
          required: ['recommendations']
        }
      }
    });

    const responseText = response.text || '';
    const parsedData = JSON.parse(responseText.trim());
    if (parsedData && Array.isArray(parsedData.recommendations)) {
      return { recommendations: parsedData.recommendations, isAiGenerated: true };
    }
    return { recommendations: getFallbackRecommendations(countryName, commodity, segment, gdp, tradeM, tradeX, fdi), isAiGenerated: false };
  } catch (error: any) {
    console.error('Gemini Recommendations error:', error.message);
    return { recommendations: getFallbackRecommendations(countryName, commodity, segment, gdp, tradeM, tradeX, fdi), isAiGenerated: false, error: error.message };
  }
};

export const generateAdvisorChat = async (
  countryName: string,
  segment: 'founder' | 'merchant',
  message: string,
  history: { role: string; text: string }[],
  gdp: string,
  fdi: string,
  commodity: string,
  gdpCapitaPpp: string,
  inflation: string
): Promise<{ text: string; isAiGenerated: boolean; error?: string }> => {
  if (!hasTradesightGeminiKey) {
    return { text: getFallbackChatResponse(countryName, commodity, segment), isAiGenerated: false };
  }

  try {
    const ai = getAiClient();
    const systemInstruction = `You are a world-class strategic business advisor specializing in ${countryName}.
The client is in the segment: "${segment === 'founder' ? 'Founders & Startups' : 'Small Local Businesses & Retailers'}".
The current industry/commodity focus is: "${commodity}".
GDP context: ${gdp || 'N/A'}. FDI context: ${fdi || 'N/A'}.
GDP per Capita (PPP): ${gdpCapitaPpp || 'N/A'}. Consumer Inflation Rate: ${inflation || 'N/A'}.

Your goal is to answer the user's specific query. Give structured, professional, motivating, and incredibly insightful business intelligence regarding international trade, retail growth, pricing, funding or business design in ${countryName}. Reference actual trade dynamics. Keep answers scannable with bullet points and bold headers. Limit responses to around 250-300 words.`;

    let prompt = '';
    if (history && history.length > 0) {
      prompt += 'Conversation history:\n';
      history.forEach((h) => {
        prompt += `${h.role === 'user' ? 'Client' : 'Advisor'}: ${h.text}\n`;
      });
    }
    prompt += `\nLatest Client message: ${message}\nAdvisor response:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { systemInstruction, temperature: 0.7 }
    });

    return { text: response.text || getFallbackChatResponse(countryName, commodity, segment), isAiGenerated: true };
  } catch (error: any) {
    console.error('Gemini Advisor Chat error:', error.message);
    return { text: getFallbackChatResponse(countryName, commodity, segment), isAiGenerated: false, error: error.message };
  }
};

// --- Fallback data (from server.ts) ---

function getFallbackRecommendations(
  countryName: string, commodity: string, segment: string,
  gdp: string, tradeM: string, tradeX: string, fdi: string
): Recommendation[] {
  const activeCommodity = commodity || 'All Commodities (TOTAL)';
  if (segment === 'founder') {
    return [
      {
        id: 'f1', title: `Localization of ${activeCommodity.split(' - ').pop()} Imports`,
        category: 'Import Substitution', impact: 'High', timeframe: '6-12 months',
        description: `Verify the heavy import levels of ${activeCommodity}. Moving manufacturing or finishing of raw inputs to a domestic plant inside ${countryName} shortens logistic loops, secures margins, and protects local buyers from customs and tariff shifts.`,
        actionSteps: [
          `Analyze the exact subcomponents of ${activeCommodity} imported into ${countryName}.`,
          'Establish local prototyping hubs utilizing high-precision tooling to support local manufacturing.',
          'Pitch your localized parts to existing high-volume buyers as a supply-chain assurance policy.'
        ],
        metricsLink: `Directly targets ${activeCommodity} imports (valued at ${tradeM})`
      },
      {
        id: 'f2', title: `B2B FDI Integration Landing Pad`,
        category: 'Services Platform', impact: 'High', timeframe: '3-6 months',
        description: `With FDI inflows registered at ${fdi}, outside enterprise players entering ${countryName} struggle with local regulatory networks, procurement, and operations. Building a compliance concierge platform caters directly to this growing trend.`,
        actionSteps: [
          'Map out local logistics, real estate, and customs compliance requirements.',
          'Design an effortless compliance onboarding platform for multinational companies.',
          'Partner with regional business chambers as the designated soft-landing companion.'
        ],
        metricsLink: `Derived from FDI inflows of ${fdi}`
      },
      {
        id: 'f3', title: `HS Tariff Classification Optimization SaaS`,
        category: 'Trade Tech SaaS', impact: 'Medium', timeframe: '2-4 months',
        description: `Automate classification for ${countryName}'s small-and-medium importers. Using intelligent categorization, businesses can lower tariffs, claim refunds, and streamline clearing procedures.`,
        actionSteps: [
          'Create a lightweight categorization tool linking HS descriptions directly to customs codes.',
          'Offer pre-audit compliance analytics to customs agents and importers.',
          'Base monetization around a risk-reduction metric or a percentage of saved duties.'
        ],
        metricsLink: `Inspired by import levels and the active trade matrix`
      },
      {
        id: 'f4', title: `${countryName} Premium Commodity Export Hub`,
        category: 'Global Aggregation', impact: 'Medium', timeframe: '6-9 months',
        description: `While primary bulk exports are dominated by massive conglomerates, small-scale local micro-mills and boutique manufacturing lack structural export routes. An aggregator network handles international branding, quality controls, and export clearance.`,
        actionSteps: [
          `Source high-quality regional outputs in the sector of ${activeCommodity}.`,
          'Create unified packaging, traceability, and global trade certifications.',
          'Partner with bulk cargo containers to bundle micro-consignments to European and US buyers.'
        ],
        metricsLink: `Targets export optimization for ${activeCommodity} (currently ${tradeX})`
      }
    ];
  }
  return [
    {
      id: 'm1', title: 'Insulating Trade volatility with Micro-Sourcing',
      category: 'Procurement Resilience', impact: 'High', timeframe: 'Immediate',
      description: `In ${countryName}, fluctuating import volumes can result in inventory bottlenecks. Shifting critical parts or retail materials to local micro-suppliers shields your boutique retail operation from global logistics delays.`,
      actionSteps: [
        'Perform a strategic inventory review to locate parts vulnerable to international freight delays.',
        'Collaborate with domestic craftspeople and manufacturers to design an exchange-rate-safe supply line.',
        'Promote your short, local turnaround speeds and low carbon footprints in customer marketing.'
      ],
      metricsLink: `Provides buffer against import friction`
    },
    {
      id: 'm2', title: 'Offering Ancillary Logistics Services for Inbound FDI Projects',
      category: 'B2B Outreach', impact: 'High', timeframe: '1-3 months',
      description: `Large corporations pouring investment into ${countryName} have vast budgets but lack regional personnel and depot stations. Small merchants and warehouses can rent portions of their physical footprint or route networks to these incoming partners.`,
      actionSteps: [
        'Track public FDI entries in your region.',
        'Propose temporary regional warehousing, delivery handling, and installation partnerships.',
        'Leverage incoming corporate contracts to obtain better credit lines from banks.'
      ],
      metricsLink: `Leverages a portion of the ${fdi} in FDI Inflows`
    },
    {
      id: 'm3', title: 'Unlocking Export Markets via Micro-Sales E-Commerce',
      category: 'Retail Expansion', impact: 'Medium', timeframe: '1-2 months',
      description: `Local merchants are no longer limited to foot-traffic. Digital cross-border trade platforms allow small boutique owners to ship artisanal crafts, clothing, and processed items directly to international retail customers.`,
      actionSteps: [
        'Enable localized Shopify or Etsy outlets targeting key purchasing nations.',
        'Incorporate international credit card networks and flat-rate international mailing options.',
        'Leverage short behind-the-scenes social videos explaining the heritage of your product.'
      ],
      metricsLink: `Supported by national trade infrastructure`
    },
    {
      id: 'm4', title: 'Proactive Raw Material Stockpiling during Currency Rallies',
      category: 'Strategic Finance', impact: 'Medium', timeframe: 'Immediate',
      description: `With GDP recorded at ${gdp}, pricing trends change rapidly. Hedging raw costs protects local bakers, builders, and fabricators from sudden procurement shocks.`,
      actionSteps: [
        'Identify imported primary inputs heavily affected by domestic currency swings.',
        'Secure working credit agreements to lock in bulk prices with trade partners.',
        'Form local purchase groups with neighboring merchants to secure volume discounts.'
      ],
      metricsLink: `Insulates business inputs from global market swings`
    }
  ];
}

function getFallbackChatResponse(countryName: string, commodity: string, segment: string): string {
  if (segment === 'founder') {
    return `Based on **${countryName}**'s current economic profile (focusing on **${commodity}**), here are some immediate tactical paths you can explore:\n\n1. **Leveraging Supply Chain Crises**: If you see high import numbers, localizing assembly or blending is your best fast-mover advantage. Focus on supplying parts to existing industrial importers.\n2. **Financing Options**: Anchor your startup funding around supply chain trade finance. High commerce nations often have robust regional export-import banks or credit lines willing to back certified purchase orders.\n3. **FDI Integration**: If FDI is growing, multinational corps need localized service providers. Offer outsourcing in logistics, workspace compliance, or talent sourcing.\n\n*Is there a particular commodity, input material, or raw resource you are planning to utilize for your startup? Let me know and we can build a launch blueprint!*`;
  }
  return `As a local merchant in **${countryName}**, here is how to navigate the current commercial climate:\n\n1. **Procurement Hedges**: Shifting even 20% of your primary inventory sourcing to local producers shields your pricing from global supply bottlenecks and container charge-ups.\n2. **Global Consumer Channels**: Can your storefront introduce unique local artisanal goods? Standard shipping tools can make exporting small items to buyers abroad extremely practical and high margin.\n3. **Service Partnerships**: Incoming global entities need foot-soldiers. Pitch your store or team as the authorized local repair facility or partner point to capture passive commercial traffic.\n\n*What kind of storefront or merchant business do you currently run? Tell me, and we can map out a cost-saving and customer acquisition plan!*`;
}
```

- [ ] **Step 2: Commit**

```bash
git add tradesight/services/geminiService.ts
git commit -m "feat: add tradesight Gemini service (browser-direct recommendations and chat)"
```

---

### Task 7: Move LandingPage.tsx

**Files:**
- Create: `tradesight/LandingPage.tsx`

- [ ] **Step 1: Copy LandingPage.tsx and adapt import**

Copy `/home/samu2505/SAAS/un-comtrade-viewer/src/LandingPage.tsx` to `tradesight/LandingPage.tsx`.

The import `from './lib/translations'` resolves correctly from `tradesight/LandingPage.tsx` → `tradesight/lib/translations.ts`. No import changes needed.

- [ ] **Step 2: Commit**

```bash
git add tradesight/LandingPage.tsx
git commit -m "feat: add tradesight LandingPage"
```

---

### Task 8: Move and Adapt App.tsx for Browser-Direct API Calls

**Files:**
- Create: `tradesight/App.tsx`

This is the main dashboard (~2597 lines). Copy it from un-comtrade-viewer, then make three targeted edits:
1. Add geminiService import
2. Replace `/api/recommendations/chat` fetch with `generateAdvisorChat()`
3. Replace `/api/recommendations` fetch with `generateRecommendations()`

- [ ] **Step 1: Copy App.tsx**

Copy `/home/samu2505/SAAS/un-comtrade-viewer/src/App.tsx` to `tradesight/App.tsx`.

- [ ] **Step 2: Add geminiService import**

Add this line after the existing `import { TRANSLATIONS, Language } from './lib/translations';` (line 51 in the original):

```typescript
import { generateRecommendations, generateAdvisorChat, hasTradesightGeminiKey } from './services/geminiService';
```

- [ ] **Step 3: Replace handleSendAdvisorChat with browser-direct Gemini call**

Find the `handleSendAdvisorChat` function (starts around line 636). Replace the entire `fetch('/api/recommendations/chat', ...)` block inside the `try`:

Old code (lines 654-683):
```typescript
    try {
      const response = await fetch('/api/recommendations/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryName,
          segment: adviceSegment,
          message: queryToSubmit,
          history: chatMessages,
          gdp: wbStats.gdp?.formatted || 'N/A',
          fdi: wbStats.fdiIn?.formatted || 'N/A',
          commodity: commodityText,
          gdpCapitaPpp: wbStats.gdpCapitaPpp?.formatted || 'N/A',
          inflation: wbStats.inflation?.formatted || 'N/A',
        })
      });

      if (!response.ok) {
        throw new Error("Advisor system is taking a quick break. Retrying...");
      }

      const data = await response.json();
      setChatMessages([...updatedMessages, { role: 'model' as const, text: data.text || 'Advisor is analyzing logs.' }]);
    } catch (err: any) {
      console.error(err);
      setAdvisorChatError(err.message || 'Connection lost to Gemini advisor.');
    } finally {
      setIsChatLoading(false);
    }
```

Replace with:
```typescript
    try {
      const data = await generateAdvisorChat(
        countryName,
        adviceSegment,
        queryToSubmit,
        chatMessages,
        wbStats.gdp?.formatted || 'N/A',
        wbStats.fdiIn?.formatted || 'N/A',
        commodityText,
        wbStats.gdpCapitaPpp?.formatted || 'N/A',
        wbStats.inflation?.formatted || 'N/A'
      );

      setChatMessages([...updatedMessages, { role: 'model' as const, text: data.text || 'Advisor is analyzing logs.' }]);
      if (data.error) {
        setAdvisorChatError(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setAdvisorChatError(err.message || 'Connection lost to Gemini advisor.');
    } finally {
      setIsChatLoading(false);
    }
```

- [ ] **Step 4: Replace recommendations fetch with browser-direct Gemini call**

Find the recommendations `useEffect` (starts around line 878). Replace the `fetch('/api/recommendations', ...)` block:

Old code (lines 894-927):
```typescript
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryName,
        segment: adviceSegment,
        gdp: gdpVal,
        tradeM: trM,
        tradeX: trX,
        fdi: fdiVal,
        commodity: commodityText,
        gdpCapitaPpp: gdpCapitaPppVal,
        inflation: inflationVal
      })
    })
    .then(r => {
      if (!r.ok) throw new Error("Server responded with error status");
      return r.json();
    })
    .then(data => {
      if (data && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        setIsAdviceAiGenerated(!!data.isAiGenerated);
        if (data.recommendations.length > 0) {
          setSelectedAdviceCardId(data.recommendations[0].id);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load bespoke advice feed:", err);
    })
    .finally(() => {
      setIsAdviceLoading(false);
    });
```

Replace with:
```typescript
    generateRecommendations({
      countryName,
      segment: adviceSegment,
      gdp: gdpVal,
      tradeM: trM,
      tradeX: trX,
      fdi: fdiVal,
      commodity: commodityText,
      gdpCapitaPpp: gdpCapitaPppVal,
      inflation: inflationVal
    })
    .then(data => {
      if (data && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        setIsAdviceAiGenerated(!!data.isAiGenerated);
        if (data.recommendations.length > 0) {
          setSelectedAdviceCardId(data.recommendations[0].id);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load bespoke advice feed:", err);
    })
    .finally(() => {
      setIsAdviceLoading(false);
    });
```

- [ ] **Step 5: Commit**

```bash
git add tradesight/App.tsx
git commit -m "feat: add tradesight App with browser-direct Gemini API calls"
```

---

### Task 9: Create Tradesight CSS

**Files:**
- Create: `tradesight/index.css`

- [ ] **Step 1: Write minimal index.css**

Since tradenexus uses Tailwind CDN, we just need any tradesight-specific overrides:

```css
/* Tradesight-specific styles */
/* Tailwind base is provided by the CDN in index.html */
```

- [ ] **Step 2: Commit**

```bash
git add tradesight/index.css
git commit -m "feat: add tradesight styles"
```

---

### Task 10: Add Path Router to index.tsx

**Files:**
- Modify: `index.tsx`

- [ ] **Step 1: Read current index.tsx**

Current content:
```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: Replace with path router**

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

const rootElement = document.getElementById("root")!;

if (window.location.pathname.startsWith("/tradesight")) {
  import("./tradesight/App.tsx").then((mod) => {
    createRoot(rootElement).render(
      <StrictMode>
        <mod.default />
      </StrictMode>
    );
  });
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add index.tsx
git commit -m "feat: add /tradesight path router to index.tsx"
```

---

### Task 11: Add Cross-Navigation Link to Tradesight in TradeNexus App

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Add a link to /tradesight in the tradenexus header/nav**

Find a suitable place in the tradenexus `App.tsx` header. Add a link element:

```tsx
<a
  href="/tradesight"
  className="text-xs text-slate-400 hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-indigo-500/50"
>
  TradeSight
</a>
```

Place this in the header nav area alongside the existing navigation elements. The exact placement depends on the current header structure — look for the `<header>` element and place it among the existing nav items.

- [ ] **Step 2: Add a "Back to TradeNexus" link in tradesight App.tsx**

In `tradesight/App.tsx`, find the header area (around line 943 where the `<header>` tag is) and add a link back to tradenexus near the language toggle or brand:

```tsx
<a
  href="/"
  className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors font-semibold"
  title="Back to TradeNexus Hub"
>
  ← TradeNexus Hub
</a>
```

Place this in the header's right-side controls area, before the language toggle button.

- [ ] **Step 3: Commit**

```bash
git add App.tsx tradesight/App.tsx
git commit -m "feat: add cross-navigation links between tradenexus and tradesight"
```

---

### Task 12: Install, Build & Verify

- [ ] **Step 1: Install dependencies**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm install
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors. If there are import resolution issues, fix them.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Build succeeds, `dist/` directory created with both apps bundled.

- [ ] **Step 4: Start dev server and verify both routes**

```bash
npm run dev &
```

Then verify:
- `http://localhost:3000/` serves tradenexus
- `http://localhost:3000/tradesight` serves the tradesight landing page
- Tradesight can search trade data (UN Comtrade API called directly from browser)
- Gemini recommendations work (if `VITE_GEMINI_API_KEY` is set)

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: final fixes and verification after tradesight merge"
```
