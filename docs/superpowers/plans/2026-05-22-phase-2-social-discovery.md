# Phase 2: Social Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the social discovery module for known-company social lookup using Gemini + Google Search, add "Find Social Profiles" action in the UI, and display social evidence in the Dossier tab.

**Architecture:** Server-side `socialDiscovery.ts` uses Gemini with Google Search grounding to find LinkedIn, Facebook, Instagram, YouTube, TikTok profiles for a given company. Returns typed `SocialProfileEvidence[]` with platform, official-likelihood classification, activity level, and contact hints. Client-side wrapper calls the existing `/api/agent/social-discovery/company` endpoint. UI adds a button in InteractionViewer to trigger discovery and shows results in the Dossier tab.

**Tech Stack:** TypeScript, Express, Google GenAI SDK with Google Search grounding, React

---

### Task 1: Implement server-side socialDiscovery.ts (known-company lookup)

**Files:**
- Replace: `server/agent/discovery/socialDiscovery.ts`

- [ ] **Step 1: Read the current geminiService.ts for patterns**

Read `server/geminiService.ts` to understand:
- How `getAiClient()` is called
- How `GROUNDING_MODEL` and `buildThinkingConfig` are used
- How `extractJsonFromText` works for parsing model output
- The pattern for Google Search grounding

- [ ] **Step 2: Write the real socialDiscovery.ts**

Replace the stub at `server/agent/discovery/socialDiscovery.ts` with:

```ts
// server/agent/discovery/socialDiscovery.ts
// Phase 2 — Social media discovery for known companies using Gemini + Google Search.

import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { SocialProfileEvidence, SocialPlatform, SocialProfileType, SocialActivityLevel, StrategicContext } from '../types.js';
import fs from "node:fs";
import path from "node:path";

// --- Environment loading (same pattern as geminiService.ts) ---
const loadLocalEnv = () => {
  const envPaths = [".env.local", ".env"];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (!fs.existsSync(fullPath)) continue;
    const contents = fs.readFileSync(fullPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;
      const [, key, rawValue = ""] = match;
      if (process.env[key]) continue;
      const value = rawValue.replace(/^['"]|['"]$/g, "").trim();
      process.env[key] = value;
    }
  }
};
loadLocalEnv();

const getEnv = (key: string, fallback?: string) => {
  return process.env[key] || process.env[`VITE_${key}`] || fallback;
};

const getAiClient = () => {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
  return new GoogleGenAI({ apiKey });
};

const GROUNDING_MODEL = getEnv("GEMINI_GROUNDING_MODEL", "gemma-4-31b-it") || "gemma-4-31b-it";
const THINKING_BUDGET = parseInt(getEnv("GEMINI_THINKING_BUDGET", "0") || "0") || 0;

const buildThinkingConfig = (model: string) => {
  if (THINKING_BUDGET <= 0) return {};
  if (model.startsWith('gemma-4')) {
    return { thinkingConfig: { thinkingLevel: "high" as any } };
  }
  return { thinkingConfig: { thinkingBudget: THINKING_BUDGET } };
};

// JSON extraction helper (same pattern as geminiService.ts)
const extractJsonFromText = (text: string | undefined): any => {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch {}
  }
  return null;
};

// --- Main exports ---

const PLATFORMS: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'x'];

export async function discoverSocialForCompany(
  companyName: string,
  region: string,
  website?: string,
  productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> {
  const ai = getAiClient();
  const now = Date.now();

  const productHint = productContext
    ? `Product context: ${productContext.productIdentity}. Ideal buyer: ${productContext.idealBuyer}.`
    : '';
  const websiteHint = website ? `Website: ${website}` : '';

  const prompt = `
    You are a B2B Sales Intelligence Researcher. Your job is to find official social media profiles for a target company.

    COMPANY: "${companyName}"
    REGION: ${region}
    ${websiteHint}
    ${productHint}

    TASK: Search for this company's presence on these platforms: LinkedIn, Facebook, Instagram, YouTube, TikTok, X (Twitter).

    For each platform where you find a profile, classify it:

    PROFILE TYPES:
    - "company" — Official company page or business profile
    - "employee" — Individual employee or founder profile (not the company itself)
    - "reseller" — A distributor/reseller page mentioning the company
    - "community" — Fan page, group, or community
    - "unknown" — Cannot determine

    ACTIVITY LEVELS:
    - "HIGH" — Recent posts (within last month), active engagement visible
    - "MEDIUM" — Profile exists, some activity but not frequent
    - "LOW" — Profile exists but appears inactive or very sparse
    - "UNKNOWN" — Cannot assess activity from available data

    CONFIDENCE (0.0 to 1.0):
    - 0.9-1.0: Exact company name match, verified location, consistent branding
    - 0.7-0.89: Strong name match, same industry/region
    - 0.5-0.69: Partial name match or similar industry
    - 0.3-0.49: Weak match, might be related
    - 0.0-0.29: Very uncertain

    Return a JSON object with a "profiles" array. Each profile object must have these keys:
    - platform: one of "linkedin", "facebook", "instagram", "youtube", "tiktok", "x", "other"
    - url: the full profile URL
    - handle: the username or handle (if visible)
    - isOfficialLikely: boolean — true if this appears to be the official company profile
    - profileType: "company", "employee", "founder", "reseller", "community", or "unknown"
    - activityLevel: "HIGH", "MEDIUM", "LOW", or "UNKNOWN"
    - activityEvidence: short description of what activity is visible (e.g., "Last post 3 days ago, 50+ comments")
    - contactHints: array of strings — any contact info visible in the profile or recent posts (email, phone, WhatsApp)
    - relevanceNotes: brief explanation of why this profile is or isn't relevant
    - confidence: number 0-1

    IMPORTANT: Only include profiles you actually found. Do not fabricate. If a platform has no visible presence for this company, omit it.
    Return ONLY the raw JSON object, no markdown wrapping.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GROUNDING_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        ...buildThinkingConfig(GROUNDING_MODEL),
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      console.error(`[SocialDiscovery] Empty response for ${companyName}`);
      return [];
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed || !Array.isArray(parsed.profiles)) {
      console.error(`[SocialDiscovery] Failed to parse profiles for ${companyName}`);
      return [];
    }

    return parsed.profiles.map((p: any) => ({
      id: uuidv4(),
      sourceType: p.platform || 'other',
      url: p.url || '',
      title: `${companyName} - ${p.platform}`,
      snippet: p.relevanceNotes,
      confidence: typeof p.confidence === 'number' ? p.confidence : 0.5,
      foundAt: now,
      foundBy: 'socialDiscovery',
      validationStatus: 'UNVERIFIED' as const,
      platform: p.platform || 'other',
      handle: p.handle,
      isOfficialLikely: Boolean(p.isOfficialLikely),
      profileType: (p.profileType as SocialProfileType) || 'unknown',
      activityLevel: (p.activityLevel as SocialActivityLevel) || 'UNKNOWN',
      activityEvidence: p.activityEvidence,
      contactHints: Array.isArray(p.contactHints) ? p.contactHints : [],
      relevanceNotes: p.relevanceNotes,
    }));

  } catch (error) {
    console.error(`[SocialDiscovery] Error for ${companyName}:`, error);
    return [];
  }
}

export async function discoverLeadsFromSocial(
  _productName: string,
  _region: string,
  _productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> {
  throw new Error("Social-first lead discovery not yet implemented (Phase 3)");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add server/agent/discovery/socialDiscovery.ts
git commit -m "feat: implement socialDiscovery module for known-company social lookup"
```

---

### Task 2: Add "Find Social Profiles" UI action and display in Dossier tab

**Files:**
- Modify: `components/InteractionViewer.tsx`
- Modify: `components/LeadCard.tsx`

- [ ] **Step 1: Add social discovery service import to InteractionViewer.tsx**

Add import at top:
```tsx
import { discoverSocialForCompany } from '../services/agent/socialDiscoveryService';
import type { SocialProfileEvidence } from '../types/evidenceTypes';
```

- [ ] **Step 2: Add "Find Social Profiles" button in the Dossier tab**

In the Dossier tab's Social Presence section (replace the existing simple social links display):

```tsx
{/* Social Presence — Enhanced for Phase 2 */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-[10px] font-bold text-slate-600 uppercase">Social Presence</h4>
    <button
      onClick={async () => {
        if (!onUpdateLead) return;
        try {
          const profiles = await discoverSocialForCompany(
            lead.companyName,
            lead.region,
            lead.website
          );
          if (profiles.length > 0) {
            onUpdateLead({
              ...lead,
              socialDiscovery: profiles,
              lastAgentAction: 'socialDiscovery',
            });
          }
        } catch (e) {
          console.error('Social discovery failed:', e);
        }
      }}
      className="px-2 py-1 bg-primary-600/20 hover:bg-primary-600/40 border border-primary-600/30 rounded text-[10px] text-primary-400 font-medium transition-colors"
    >
      Find Social Profiles
    </button>
  </div>

  {/* Show SocialProfileEvidence if available */}
  {lead.socialDiscovery && lead.socialDiscovery.length > 0 ? (
    <div className="space-y-2">
      {lead.socialDiscovery.map((sp: SocialProfileEvidence, i: number) => (
        <a
          key={sp.id || i}
          href={sp.url}
          target="_blank"
          rel="noreferrer"
          className="block p-3 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white capitalize">{sp.platform}</span>
            <div className="flex items-center gap-2">
              {sp.isOfficialLikely && (
                <span className="text-[9px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">Official</span>
              )}
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                sp.activityLevel === 'HIGH' ? 'bg-green-900/30 text-green-400 border-green-800/50' :
                sp.activityLevel === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' :
                sp.activityLevel === 'LOW' ? 'bg-slate-700/30 text-slate-400 border-slate-700/50' :
                'bg-slate-800/30 text-slate-500 border-slate-700/30'
              }`}>
                {sp.activityLevel}
              </span>
            </div>
          </div>
          {sp.relevanceNotes && (
            <p className="text-[10px] text-slate-400 leading-relaxed">{sp.relevanceNotes}</p>
          )}
          {sp.contactHints && sp.contactHints.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {sp.contactHints.map((hint: string, j: number) => (
                <span key={j} className="text-[9px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/30">
                  {hint}
                </span>
              ))}
            </div>
          )}
        </a>
      ))}
    </div>
  ) : (
    /* Fallback: show legacy socialProfiles if no socialDiscovery yet */
    lead.socialProfiles && lead.socialProfiles.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {lead.socialProfiles.map((social, i) => (
          <a key={i} href={social.url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors">
            {social.platform}
          </a>
        ))}
      </div>
    ) : (
      <p className="text-[10px] text-slate-600">No social profiles discovered yet.</p>
    )
  )}
</div>
```

- [ ] **Step 3: Add compact social badge to LeadCard**

In `components/LeadCard.tsx`, add a social active indicator badge when the lead has social data. Find the existing badge/status area and add:

```tsx
{lead.socialDiscovery && lead.socialDiscovery.length > 0 && (
  <span className="text-[10px]" title="Social profiles found">
    👥
  </span>
)}
```

If `lead.socialDiscovery` doesn't exist but `lead.socialProfiles` does, show the badge for that too.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors (App.tsx errors are pre-existing)

- [ ] **Step 5: Commit**

```bash
git add components/InteractionViewer.tsx components/LeadCard.tsx
git commit -m "feat: add Find Social Profiles action and social evidence display in Dossier tab"
```

---

### Task 3: Integration smoke test

**Files:**
- No files changed — verification only

- [ ] **Step 1: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 2: Start dev server and test the social discovery endpoint**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &
# Wait for server start
```

Test the endpoint:
```bash
curl -s -X POST http://localhost:3000/api/agent/social-discovery/company \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Bosch","region":"Germany","website":"https://www.bosch.com"}'
```

Expected: Returns `{"profiles":[...]}` with social profile evidence objects containing platform, url, confidence, isOfficialLikely, profileType, activityLevel.

- [ ] **Step 3: Test health endpoint still works**

Run: `curl -s http://localhost:3000/api/health`
Expected: `{"ok":true}`

- [ ] **Step 4: Test that existing search endpoint still works**

Run:
```bash
curl -s -X POST http://localhost:3000/api/ai/search-leads \
  -H "Content-Type: application/json" \
  -d '{"product":{"name":"Solar Panels","targetRegion":"Germany"}}'
```
Expected: Returns `{"leads":[...]}` with evidence arrays intact from Phase 1.

- [ ] **Step 5: Stop dev server and commit any final changes**

---

## Self-Review

1. **Spec coverage:** Phase 2 requirements from design spec — socialDiscovery.ts implementation, known-company lookup, social evidence on leads, social display in Dossier tab, platform/confidence/activity classification.

2. **Placeholder scan:** No TBDs, TODOs. All code is exact.

3. **Type consistency:** `SocialProfileEvidence` fields match what `discoverSocialForCompany` returns. UI component accesses `lead.socialDiscovery` which matches the optional field added in Phase 1.
