# Phase 3: Social-First Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement social-first lead discovery — given a product and target region, use Gemini + Google Search grounding to find potential buyer/distributor companies via their social media presence, and convert those social profiles into Lead objects with `searchVector: 'social'` labels.

**Architecture:** `discoverLeadsFromSocial` uses Gemini with Google Search grounding to search for companies on LinkedIn, Facebook, Instagram, YouTube, TikTok, X that match the buyer profile in a target region. A new `socialProfilesToLeads` converter turns `SocialProfileEvidence[]` into `Lead[]` objects with DISCOVERED status, `searchVector` labels per platform, and `socialDiscovery` evidence attached. The `/api/agent/social-discovery/region` endpoint is updated to return leads instead of raw profiles. No UI changes in this phase — the endpoint is callable via curl and the client wrapper.

**Tech Stack:** TypeScript, Express, Google GenAI SDK with Google Search grounding, uuid

---

### Task 1: Implement discoverLeadsFromSocial

**Files:**
- Modify: `server/agent/discovery/socialDiscovery.ts`

- [ ] **Step 1: Replace the discoverLeadsFromSocial stub**

Replace lines 182-188 of `server/agent/discovery/socialDiscovery.ts` (the stub that throws "not yet implemented") with:

```ts
export async function discoverLeadsFromSocial(
  productName: string,
  region: string,
  productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> {
  const now = Date.now();

  const productHint = productContext
    ? `Product: ${productContext.productIdentity}. Ideal buyer: ${productContext.idealBuyer}. Value proposition: ${productContext.valueProposition}.`
    : `Product: ${productName}.`;
  const excludeHint = productContext?.exclusions
    ? `EXCLUDE these company types: ${productContext.exclusions}.`
    : '';

  const prompt = `
    You are a B2B Sales Intelligence Researcher. Your job is to find potential buyer or distributor companies in a target region by searching for their social media presence.

    PRODUCT TO SELL: ${productName}
    TARGET REGION: ${region}
    ${productHint}
    ${excludeHint}

    TASK: Search social media platforms (LinkedIn, Facebook, Instagram, YouTube, TikTok, X) for companies in ${region} that could be potential buyers, distributors, or importers of ${productName}.

    For each company you find, provide their social profile details. Focus on:
    1. Companies that match the ideal buyer profile
    2. Companies with active social media presence (indicates they're real businesses)
    3. Companies in the specified region

    PROFILE TYPES:
    - "company" — Official company page or business profile
    - "employee" — Individual employee or founder profile (useful for contact)
    - "reseller" — A distributor/reseller page
    - "community" — Fan page, group, or industry community
    - "unknown" — Cannot determine

    ACTIVITY LEVELS:
    - "HIGH" — Recent posts (within last month), active engagement visible
    - "MEDIUM" — Profile exists, some activity but not frequent
    - "LOW" — Profile exists but appears inactive or very sparse
    - "UNKNOWN" — Cannot assess activity from available data

    CONFIDENCE (0.0 to 1.0):
    - 0.9-1.0: Company clearly matches buyer profile, verified in target region
    - 0.7-0.89: Strong match — right industry, likely in region
    - 0.5-0.69: Partial match — could be relevant
    - 0.3-0.49: Weak match — might be tangentially related
    - 0.0-0.29: Very uncertain

    Return a JSON object with a "profiles" array. Each profile object must have these keys:
    - companyName: string — the company name as it appears on the profile
    - platform: "linkedin", "facebook", "instagram", "youtube", "tiktok", "x", or "other"
    - url: full profile URL
    - handle: username or handle (if visible)
    - isOfficialLikely: boolean — true if this appears to be the official company profile
    - profileType: "company", "employee", "founder", "reseller", "community", or "unknown"
    - activityLevel: "HIGH", "MEDIUM", "LOW", or "UNKNOWN"
    - activityEvidence: short description of what activity is visible
    - contactHints: array of strings — any contact info visible (email, phone, WhatsApp, website)
    - relevanceNotes: why this company is a good (or bad) match for the product
    - confidence: number 0-1
    - employeeCount: string — rough size indication if visible (e.g., "10-50", "50-200")
    - website: string — company website if visible on the profile (empty string if not found)

    AIM FOR 8-15 RESULTS. Focus on quality over quantity — prefer real, active companies.
    IMPORTANT: Only include companies you actually found. Do not fabricate.
    Return ONLY the raw JSON object, no markdown wrapping.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: GROUNDING_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        ...buildThinkingConfig(GROUNDING_MODEL),
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      console.error(`[SocialDiscovery] Empty response for ${productName} in ${region}`);
      return [];
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed || !Array.isArray(parsed.profiles)) {
      console.error(`[SocialDiscovery] Failed to parse leads for ${productName} in ${region}`);
      return [];
    }

    return parsed.profiles.map((p: any) => ({
      id: uuidv4(),
      sourceType: (p.platform as EvidenceSourceType) || 'other',
      url: p.url || '',
      title: p.companyName || `${productName} lead`,
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
      extractedFields: {
        companyName: p.companyName || '',
        website: p.website || '',
        region: region,
        employeeCount: p.employeeCount || '',
      },
    }));

  } catch (error) {
    console.error(`[SocialDiscovery] Error discovering leads for ${productName} in ${region}:`, error);
    return [];
  }
}
```

Note: Add `EvidenceSourceType` to the imports from `'../types.js'` on line 3. Change:
```ts
import type { SocialProfileEvidence, SocialPlatform, SocialProfileType, SocialActivityLevel, StrategicContext } from '../types.js';
```
to:
```ts
import type { SocialProfileEvidence, SocialPlatform, SocialProfileType, SocialActivityLevel, StrategicContext, EvidenceSourceType } from '../types.js';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors (pre-existing errors in App.tsx and firestore.rules.test.ts are fine)

- [ ] **Step 3: Commit**

```bash
git add server/agent/discovery/socialDiscovery.ts
git commit -m "feat: implement discoverLeadsFromSocial for social-first lead discovery"
```

---

### Task 2: Add socialProfilesToLeads converter

**Files:**
- Create: `server/agent/discovery/socialToLead.ts`

- [ ] **Step 1: Create the converter module**

Create `server/agent/discovery/socialToLead.ts`:

```ts
// server/agent/discovery/socialToLead.ts
// Phase 3 — Converts SocialProfileEvidence[] to Lead[] objects.

import { v4 as uuidv4 } from 'uuid';
import type { Lead, SocialProfileEvidence } from '../types.js';
import { LeadStatus } from '../../../types.js';

export const SOCIAL_VECTOR_PREFIX = 'Social:';

export function socialProfilesToLeads(
  profiles: SocialProfileEvidence[],
  region: string
): Lead[] {
  const now = Date.now();

  // Group profiles by company name to avoid duplicates
  const byCompany = new Map<string, SocialProfileEvidence[]>();
  for (const profile of profiles) {
    const name = (profile.extractedFields?.companyName as string) ||
                 profile.title ||
                 'Unknown Company';
    const key = name.toLowerCase().trim();
    if (!byCompany.has(key)) {
      byCompany.set(key, []);
    }
    byCompany.get(key)!.push(profile);
  }

  return Array.from(byCompany.entries()).map(([_, companyProfiles]) => {
    const primary = companyProfiles[0];
    const companyName = (primary.extractedFields?.companyName as string) ||
                        primary.title ||
                        'Unknown Company';
    const website = (primary.extractedFields?.website as string) || undefined;

    // Collect unique platforms for the search vector
    const platforms = [...new Set(companyProfiles.map(p => p.platform))];
    const vectorName = `${SOCIAL_VECTOR_PREFIX} ${platforms.join('/')}`;

    // Extract contact hints from all profiles
    const allContactHints = companyProfiles.flatMap(p => p.contactHints || []);
    const contactInfo = [...new Set(allContactHints)].join(', ') || undefined;

    // Best confidence across all profiles
    const bestConfidence = Math.max(...companyProfiles.map(p => p.confidence));

    // Activity level — best across profiles
    const activityOrder: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'UNKNOWN': 0 };
    const bestActivity = companyProfiles.reduce((best, p) => {
      const score = activityOrder[p.activityLevel] || 0;
      return score > (activityOrder[best] || 0) ? p.activityLevel : best;
    }, 'UNKNOWN' as string);

    const lead: Lead = {
      id: uuidv4(),
      companyName,
      website,
      region,
      status: LeadStatus.DISCOVERED,
      confidenceScore: Math.round(bestConfidence * 100),
      summary: primary.relevanceNotes || primary.snippet,
      socialProfiles: companyProfiles.map(p => ({
        platform: p.platform,
        url: p.url,
      })),
      socialDiscovery: companyProfiles,
      searchVector: vectorName,
      contactInfo,
      employeeCount: (primary.extractedFields?.employeeCount as string) || undefined,
      lastAgentAction: 'socialDiscovery',
      logs: [{
        timestamp: new Date().toLocaleTimeString(),
        actor: 'SYSTEM',
        message: `Lead discovered via social media on ${platforms.join(', ')}.\nActivity Level: ${bestActivity}\nPlatforms found: ${companyProfiles.length} profile(s)`,
      }],
    };

    return lead;
  });
}
```
Note: `LeadStatus` is an enum — it needs a value import from `../../../types.js` (the project root `types.ts`) because `server/agent/types.ts` re-exports it as type-only.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add server/agent/discovery/socialToLead.ts
git commit -m "feat: add socialProfilesToLeads converter for social-first leads"
```

---

### Task 3: Update API endpoint and client service

**Files:**
- Modify: `server/index.ts`
- Modify: `services/agent/socialDiscoveryService.ts`

- [ ] **Step 1: Update the server endpoint to return leads**

In `server/index.ts`, add the import for the converter (after the existing `agentSocialDiscovery` import on line 27):

```ts
const agentSocialToLead = await import("./agent/discovery/socialToLead.js");
```

Then replace the `/api/agent/social-discovery/region` handler (lines 99-107) with:

```ts
// Phase 3: Social-first lead discovery by region
app.post("/api/agent/social-discovery/region", asyncRoute(async (req, res) => {
  const { productName, region, productContext } = req.body;
  const profiles = await agentSocialDiscovery.discoverLeadsFromSocial(
    productName,
    region,
    productContext
  );
  const leads = agentSocialToLead.socialProfilesToLeads(profiles, region || "Unknown");
  res.json({ profiles, leads });
}));
```

- [ ] **Step 2: Update the client service**

In `services/agent/socialDiscoveryService.ts`, update `discoverLeadsFromSocial` to return both profiles and leads:

```ts
export const discoverLeadsFromSocial = async (
  productName: string,
  region: string,
  productContext?: StrategicContext
): Promise<{ profiles: SocialProfileEvidence[]; leads: any[] }> => {
  const result = await postJson<{ profiles: SocialProfileEvidence[]; leads: any[] }>(
    '/api/agent/social-discovery/region',
    { productName, region, productContext }
  );
  return result;
};
```

Import `Lead` type from the types:
```ts
import type { StrategicContext, Lead } from '../../types';
```

And change `leads: any[]` to `leads: Lead[]`:

```ts
): Promise<{ profiles: SocialProfileEvidence[]; leads: Lead[] }> => {
  const result = await postJson<{ profiles: SocialProfileEvidence[]; leads: Lead[] }>(
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add server/index.ts services/agent/socialDiscoveryService.ts
git commit -m "feat: update /api/agent/social-discovery/region to return leads from social profiles"
```

---

### Task 4: Integration smoke test

**Files:**
- No files changed — verification only

- [ ] **Step 1: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 2: Start dev server**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &
```

Wait for server start (check `curl -s http://localhost:3000/api/health` returns `{"ok":true}`).

- [ ] **Step 3: Test social-first lead discovery**

```bash
curl -s -X POST http://localhost:3000/api/agent/social-discovery/region \
  -H "Content-Type: application/json" \
  -d '{"productName":"Solar Panels","region":"Germany"}'
```

Expected: Returns `{"profiles":[...], "leads":[...]}`. The `leads` array should contain Lead objects with `searchVector` starting with "Social:", `socialDiscovery` evidence attached, `status: "DISCOVERED"`, and `socialProfiles` populated.

- [ ] **Step 4: Test with product context**

```bash
curl -s -X POST http://localhost:3000/api/agent/social-discovery/region \
  -H "Content-Type: application/json" \
  -d '{"productName":"Solar Panels","region":"Germany","productContext":{"productIdentity":"High-efficiency solar panels for commercial rooftops","idealBuyer":"Solar installation companies and renewable energy distributors","valueProposition":"25% higher efficiency than standard panels","exclusions":"Residential-only installers, DIY retailers"}}'
```

Expected: Returns `{"profiles":[...], "leads":[...]}` with more targeted results.

- [ ] **Step 5: Test health endpoint still works**

Run: `curl -s http://localhost:3000/api/health`
Expected: `{"ok":true}`

- [ ] **Step 6: Test existing search endpoint still works**

```bash
curl -s -X POST http://localhost:3000/api/ai/search-leads \
  -H "Content-Type: application/json" \
  -d '{"product":{"name":"Solar Panels","targetRegion":"Germany"}}'
```
Expected: Returns `{"leads":[...]}` with evidence arrays intact.

- [ ] **Step 7: Stop dev server and commit any final changes**

```bash
kill $(lsof -ti:3000) 2>/dev/null
```

---

### Task 5: Add UI "Discover from Social" action in the app

**Files:**
- Modify: `components/InteractionViewer.tsx`

- [ ] **Step 1: Add import for discoverLeadsFromSocial**

In `components/InteractionViewer.tsx`, update the import from `../services/agent/socialDiscoveryService` to also import `discoverLeadsFromSocial`:

The current import (line 6) is:
```tsx
import { discoverSocialForCompany } from '../services/agent/socialDiscoveryService';
```

Change to:
```tsx
import { discoverSocialForCompany, discoverLeadsFromSocial } from '../services/agent/socialDiscoveryService';
```

- [ ] **Step 2: Add "Discover from Social" button in the Dossier tab**

Find the Social Presence section in the Dossier tab (the section modified in Phase 2). Add a second button next to "Find Social Profiles" for social-first discovery. Insert this after the "Find Social Profiles" button (after line ~453):

```tsx
<button
  onClick={async () => {
    if (!onUpdateLead || isDiscoveringSocial) return;
    setIsDiscoveringSocial(true);
    setSocialDiscoveryError(null);
    try {
      const result = await discoverLeadsFromSocial(
        lead.companyName,
        lead.region,
        productContext
      );
      if (result.profiles.length > 0) {
        onUpdateLead({
          ...lead,
          socialDiscovery: result.profiles,
          lastAgentAction: 'socialDiscovery',
        });
      }
    } catch (e) {
      console.error('Social lead discovery failed:', e);
      setSocialDiscoveryError('Discovery failed. Try again.');
    } finally {
      setIsDiscoveringSocial(false);
    }
  }}
  disabled={isDiscoveringSocial}
  className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 rounded text-[10px] text-emerald-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isDiscoveringSocial ? 'Searching...' : 'Discover Similar Companies'}
</button>
```

Place this button next to the "Find Social Profiles" button (in the same flex row). Change the parent div to accommodate both buttons:

The current header div (line 426) is:
```tsx
<div className="flex items-center justify-between mb-3">
```

Keep it as-is (both buttons will flow naturally). Or if the buttons overflow, wrap them:

```tsx
<div className="flex items-center justify-between mb-3">
  <h4 className="text-[10px] font-bold text-slate-600 uppercase">Social Presence</h4>
  <div className="flex items-center gap-2">
    <button ...>Find Social Profiles</button>
    <button ...>Discover Similar Companies</button>
  </div>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add components/InteractionViewer.tsx
git commit -m "feat: add Discover Similar Companies button for social-first lead discovery"
```

---

## Self-Review

1. **Spec coverage:** Phase 3 requirements from design spec — regional social-first lead discovery, social-first candidates convert to leads with source vector labels, POST /api/agent/social-discovery/region endpoint. All covered.

2. **Placeholder scan:** No TBDs, TODOs. All code is exact. The `LeadStatus` import check (Task 2 Step 2) is a verification step, not a placeholder — it confirms the import works before committing.

3. **Type consistency:** `discoverLeadsFromSocial` returns `SocialProfileEvidence[]` which is the same type as the existing stub signature. `socialProfilesToLeads` takes `SocialProfileEvidence[]` and returns `Lead[]` — the `Lead` type from root `types.ts` includes `socialDiscovery?: SocialProfileEvidence[]` and `searchVector?: string`. The endpoint response `{ profiles, leads }` matches the updated client service return type.
