# Phase 5: Planner + Memory + Next Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement campaign planning, next-best-action recommendations, and campaign memory so the agent can track what it has learned and suggest what to do next.

**Architecture:** The planner (`campaignPlanner`) is deterministic — it inspects session state and builds an AgentPlan with ordered steps. The recommender (`nextBestAction`) uses Gemini (DEFAULT_MODEL, no grounding) to analyze a lead and propose actions. Campaign memory records user behavior events in-memory and derives patterns. Supplier memory merges campaign-level learning into persistent supplier preferences. Rejection pattern analysis uses Gemini to find commonalities across rejected leads.

**Tech Stack:** TypeScript ESM, Google GenAI SDK, Express asyncRoute pattern, React + Vite

---

### Task 1: Implement campaignPlanner (deterministic)

**Files:**
- Modify: `server/agent/planner/campaignPlanner.ts` (replace stub)

- [ ] **Step 1: Replace the stub with the full implementation**

```ts
// Phase 5 — Campaign planner: determines which modules to run based on campaign state.
import type { AgentPlan, AgentPlanStep, SearchSession, StrategicContext } from '../types.js';

export async function createCampaignPlan(
  session: SearchSession,
  _context?: StrategicContext
): Promise<AgentPlan> {
  const now = Date.now();
  const steps: AgentPlanStep[] = [];
  const leads = session.leads || [];

  const addStep = (state: AgentPlanStep['state'], label: string): AgentPlanStep => ({
    state,
    label,
    status: 'PENDING',
  });

  // Step 1: Always analyze context first
  steps.push(addStep('ANALYZE_CONTEXT', 'Analyze product context and target markets'));

  // Step 2: Discover markets if no region suggestions exist
  if (!session.regionSuggestions || session.regionSuggestions.length === 0) {
    steps.push(addStep('DISCOVER_MARKETS', 'Discover target markets and regions'));
  }

  // Step 3: Discover leads if none exist or all are DISCOVERED with low count
  if (leads.length === 0) {
    steps.push(addStep('DISCOVER_LEADS', 'Search for potential leads'));
    steps.push(addStep('DISCOVER_SOCIAL', 'Find leads through social platforms'));
  } else if (leads.length < 10) {
    steps.push(addStep('DISCOVER_LEADS', 'Expand lead pool — currently under 10 leads'));
  }

  // Step 4: Enrich leads that lack evidence or social profiles
  const unenrichedCount = leads.filter(l => !l.evidence || l.evidence.length === 0).length;
  const noSocialCount = leads.filter(l => !l.socialDiscovery || l.socialDiscovery.length === 0).length;
  if (unenrichedCount > 0 || noSocialCount > 0) {
    steps.push(addStep('ENRICH_LEADS', `Enrich ${unenrichedCount + noSocialCount} leads with evidence and social data`));
  }

  // Step 5: Verify leads that haven't been verified
  const unverifiedCount = leads.filter(l => !l.verification).length;
  if (unverifiedCount > 0) {
    steps.push(addStep('VERIFY_LEADS', `Verify ${unverifiedCount} unverified leads`));
  }

  // Step 6: Score leads that haven't been scored
  const unscoredCount = leads.filter(l => !l.scoreBreakdown).length;
  if (unscoredCount > 0) {
    steps.push(addStep('SCORE_LEADS', `Score ${unscoredCount} unscored leads`));
  }

  // Step 7: Draft outreach for verified, scored leads with no outreach
  const readyForOutreach = leads.filter(
    l => l.verification && l.scoreBreakdown && (!l.outreachDrafts || l.outreachDrafts.length === 0)
  ).length;
  if (readyForOutreach > 0) {
    steps.push(addStep('DRAFT_OUTREACH', `Draft outreach for ${readyForOutreach} qualified leads`));
  }

  // Step 8: Always end with user approval gate
  steps.push(addStep('AWAIT_USER_APPROVAL', 'Review and approve next actions'));

  const plan: AgentPlan = {
    id: `plan-${session.id || 'unknown'}-${now}`,
    campaignId: session.id || 'unknown',
    steps,
    currentStep: 0,
    createdAt: now,
    updatedAt: now,
  };

  return plan;
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to campaignPlanner.ts

- [ ] **Step 3: Quick smoke test via node**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && node --loader ts-node/esm -e "
import { createCampaignPlan } from './server/agent/planner/campaignPlanner.js';
const plan = await createCampaignPlan({ id: 'test', leads: [] });
console.log('Steps:', plan.steps.length);
console.log('First step:', plan.steps[0].state);
console.log('Has AWAIT_USER_APPROVAL:', plan.steps.some(s => s.state === 'AWAIT_USER_APPROVAL'));
" 2>&1`
Expected: Output shows steps count >= 4, first step is ANALYZE_CONTEXT, AWAIT_USER_APPROVAL is present

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/planner/campaignPlanner.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement deterministic campaign planner (Phase 5)"
```

---

### Task 2: Implement campaignMemory (record + reset)

**Files:**
- Modify: `server/agent/memory/campaignMemory.ts` (replace recordMemoryEvent and resetCampaignMemory stubs)

- [ ] **Step 1: Replace the two stub functions**

```ts
// Phase 5 — Campaign memory: records and retrieves campaign-level learning events.
import type { CampaignMemory, MemoryEvent } from '../types.js';

let _memory: CampaignMemory = {
  events: [],
  preferredLeadPatterns: [],
  rejectedLeadPatterns: [],
  strongRegions: [],
  weakRegions: [],
  platformUsefulness: {},
  buyerTypePerformance: {},
  updatedAt: Date.now(),
};

export function getCampaignMemory(): CampaignMemory {
  return _memory;
}

export function recordMemoryEvent(event: MemoryEvent): void {
  _memory.events.push(event);
  _memory.updatedAt = Date.now();

  // Derive patterns from accumulated events
  if (event.type === 'LEAD_ACCEPTED' && event.details) {
    if (!_memory.preferredLeadPatterns.includes(event.details)) {
      _memory.preferredLeadPatterns.push(event.details);
    }
  }

  if (event.type === 'LEAD_REJECTED' && event.details) {
    if (!_memory.rejectedLeadPatterns.includes(event.details)) {
      _memory.rejectedLeadPatterns.push(event.details);
    }
  }

  if (event.type === 'LEAD_ACCEPTED' && event.leadId) {
    // Increment region tracking would need lead lookup; handled by supplierMemory merge
  }

  if (event.type === 'SOCIAL_PROFILE_USEFUL' && event.details) {
    const platform = event.details;
    _memory.platformUsefulness[platform] = (_memory.platformUsefulness[platform] || 0) + 1;
  }

  if (event.type === 'SOCIAL_PROFILE_IRRELEVANT' && event.details) {
    const platform = event.details;
    _memory.platformUsefulness[platform] = (_memory.platformUsefulness[platform] || 0) - 1;
  }
}

export function resetCampaignMemory(): void {
  _memory = {
    events: [],
    preferredLeadPatterns: [],
    rejectedLeadPatterns: [],
    strongRegions: [],
    weakRegions: [],
    platformUsefulness: {},
    buyerTypePerformance: {},
    updatedAt: Date.now(),
  };
}
```

The rest of the file (imports, `_memory` initializer, `getCampaignMemory`) stays unchanged — only the two stub function bodies are replaced.

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to campaignMemory.ts

- [ ] **Step 3: Quick smoke test via node**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && node --loader ts-node/esm -e "
import { getCampaignMemory, recordMemoryEvent, resetCampaignMemory } from './server/agent/memory/campaignMemory.js';

// Test record
const before = getCampaignMemory().events.length;
recordMemoryEvent({ id: 'ev1', type: 'LEAD_ACCEPTED', details: 'midwest-distributors', timestamp: Date.now() });
const after = getCampaignMemory().events.length;
console.log('Events grew:', after > before);
console.log('Preferred patterns:', getCampaignMemory().preferredLeadPatterns);

// Test reset
resetCampaignMemory();
console.log('After reset events:', getCampaignMemory().events.length);
console.log('After reset patterns:', getCampaignMemory().preferredLeadPatterns.length);
" 2>&1`
Expected: Events grew: true, preferred patterns includes 'midwest-distributors', after reset both counts are 0

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/memory/campaignMemory.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement campaign memory recording and reset (Phase 5)"
```

---

### Task 3: Implement supplierMemory merge

**Files:**
- Modify: `server/agent/memory/supplierMemory.ts` (replace stub)

- [ ] **Step 1: Replace the stub with the full implementation**

```ts
// Phase 5 — Supplier memory: captures supplier preferences and patterns across campaigns.
import type { CampaignMemory } from '../types.js';

export async function mergeSupplierMemory(
  existing: CampaignMemory,
  campaignMemory: CampaignMemory
): Promise<CampaignMemory> {
  const now = Date.now();

  // Merge events (newest first), deduplicate by id
  const seenIds = new Set(existing.events.map(e => e.id));
  const newEvents = campaignMemory.events.filter(e => !seenIds.has(e.id));
  const mergedEvents = [...campaignMemory.events, ...existing.events].slice(0, 500);

  // Merge string arrays with dedup
  const mergeStrings = (base: string[], incoming: string[]): string[] => {
    const set = new Set([...incoming, ...base]);
    return Array.from(set);
  };

  // Merge platform usefulness scores (add values)
  const mergedPlatforms: Record<string, number> = { ...existing.platformUsefulness };
  for (const [platform, score] of Object.entries(campaignMemory.platformUsefulness)) {
    mergedPlatforms[platform] = (mergedPlatforms[platform] || 0) + score;
  }

  // Merge buyer type performance scores
  const mergedBuyerTypes: Record<string, number> = { ...existing.buyerTypePerformance };
  for (const [buyerType, score] of Object.entries(campaignMemory.buyerTypePerformance)) {
    mergedBuyerTypes[buyerType] = (mergedBuyerTypes[buyerType] || 0) + score;
  }

  return {
    events: mergedEvents,
    preferredLeadPatterns: mergeStrings(existing.preferredLeadPatterns, campaignMemory.preferredLeadPatterns),
    rejectedLeadPatterns: mergeStrings(existing.rejectedLeadPatterns, campaignMemory.rejectedLeadPatterns),
    strongRegions: mergeStrings(existing.strongRegions, campaignMemory.strongRegions),
    weakRegions: mergeStrings(existing.weakRegions, campaignMemory.weakRegions),
    platformUsefulness: mergedPlatforms,
    buyerTypePerformance: mergedBuyerTypes,
    updatedAt: now,
  };
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to supplierMemory.ts

- [ ] **Step 3: Quick smoke test via node**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && node --loader ts-node/esm -e "
import { mergeSupplierMemory } from './server/agent/memory/supplierMemory.js';

const existing = {
  events: [{ id: 'e1', type: 'LEAD_ACCEPTED' as const, timestamp: 1000 }],
  preferredLeadPatterns: ['pattern-a'],
  rejectedLeadPatterns: [],
  strongRegions: ['US-West'],
  weakRegions: [],
  platformUsefulness: { linkedin: 3 },
  buyerTypePerformance: {},
  updatedAt: 1000,
};

const campaign = {
  events: [{ id: 'e2', type: 'LEAD_ACCEPTED' as const, timestamp: 2000 }],
  preferredLeadPatterns: ['pattern-b'],
  rejectedLeadPatterns: ['bad-fit'],
  strongRegions: ['US-East'],
  weakRegions: ['EU-North'],
  platformUsefulness: { linkedin: 2, facebook: 1 },
  buyerTypePerformance: { distributor: 5 },
  updatedAt: 2000,
};

const merged = await mergeSupplierMemory(existing, campaign);
console.log('Events:', merged.events.length);
console.log('Preferred patterns:', merged.preferredLeadPatterns.length);
console.log('LinkedIn score:', merged.platformUsefulness.linkedin);
console.log('Facebook score:', merged.platformUsefulness.facebook);
console.log('Distributor score:', merged.buyerTypePerformance.distributor);
" 2>&1`
Expected: Events: 2, Preferred patterns: 2, LinkedIn score: 5, Facebook score: 1, Distributor score: 5

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/memory/supplierMemory.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement supplier memory merge (Phase 5)"
```

---

### Task 4: Implement rejectionPatterns (AI-powered)

**Files:**
- Modify: `server/agent/memory/rejectionPatterns.ts` (replace stub)

- [ ] **Step 1: Replace the stub with the full implementation**

```ts
// Phase 5 — Rejection patterns: analyzes rejected leads to identify patterns using AI.
import { GoogleGenAI } from "@google/genai";
import type { Lead, CampaignMemory } from '../types.js';
import fs from "node:fs";
import path from "node:path";

// --- Environment loading ---
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

const DEFAULT_MODEL = getEnv("GEMINI_DEFAULT_MODEL", "gemma-4-31b-it") || "gemma-4-31b-it";
const THINKING_BUDGET = parseInt(getEnv("GEMINI_THINKING_BUDGET", "0") || "0") || 0;

const buildThinkingConfig = (model: string) => {
  if (THINKING_BUDGET <= 0) return {};
  if (model.startsWith('gemma-4')) {
    return { thinkingConfig: { thinkingLevel: "high" as any } };
  }
  return { thinkingConfig: { thinkingBudget: THINKING_BUDGET } };
};

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
  return null;
};

// --- Main export ---

export async function analyzeRejectionPatterns(
  rejectedLeads: Lead[]
): Promise<Partial<CampaignMemory>> {
  if (rejectedLeads.length === 0) {
    return {
      rejectedLeadPatterns: [],
      weakRegions: [],
      updatedAt: Date.now(),
    };
  }

  const leadSummaries = rejectedLeads.map(l => ({
    company: l.companyName,
    region: l.region,
    industry: l.matchDetails?.industryFit || 'Unknown',
    size: l.employeeCount || 'Unknown',
    website: l.website || 'None',
    summary: l.summary || 'No summary',
  }));

  const prompt = `
    You are a Lead Pattern Analyst. Analyze these REJECTED leads and identify common patterns.

    REJECTED LEADS:
    ${JSON.stringify(leadSummaries, null, 2)}

    Identify:
    1. rejectedLeadPatterns: 3-5 strings describing common traits of rejected leads (e.g., "too small", "wrong industry", "no importing history", "startup phase", "wrong region")
    2. weakRegions: Array of region names where multiple rejections occurred
    3. A brief analysis summary (2-3 sentences)

    Return ONLY a JSON object:
    {
      "rejectedLeadPatterns": ["pattern1", "pattern2", ...],
      "weakRegions": ["Region A", "Region B"],
      "analysis": "Summary of findings..."
    }
    No markdown wrapping.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: buildThinkingConfig(DEFAULT_MODEL),
    });

    if (!response.text) {
      return { rejectedLeadPatterns: [], weakRegions: [], updatedAt: Date.now() };
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed) {
      return { rejectedLeadPatterns: [], weakRegions: [], updatedAt: Date.now() };
    }

    return {
      rejectedLeadPatterns: Array.isArray(parsed.rejectedLeadPatterns) ? parsed.rejectedLeadPatterns : [],
      weakRegions: Array.isArray(parsed.weakRegions) ? parsed.weakRegions : [],
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('[RejectionPatterns] Analysis failed:', error);
    return {
      rejectedLeadPatterns: [],
      weakRegions: [],
      updatedAt: Date.now(),
    };
  }
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to rejectionPatterns.ts

- [ ] **Step 3: Quick smoke test (empty input — no API call needed)**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && node --loader ts-node/esm -e "
import { analyzeRejectionPatterns } from './server/agent/memory/rejectionPatterns.js';
const result = await analyzeRejectionPatterns([]);
console.log('Empty input patterns:', result.rejectedLeadPatterns);
console.log('Empty input regions:', result.weakRegions);
" 2>&1`
Expected: Empty input patterns: [], Empty input regions: []

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/memory/rejectionPatterns.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement AI-powered rejection pattern analysis (Phase 5)"
```

---

### Task 5: Implement nextBestAction (AI-powered recommendations)

**Files:**
- Modify: `server/agent/planner/nextBestAction.ts` (replace stub)

- [ ] **Step 1: Replace the stub with the full implementation**

```ts
// Phase 5 — Next best action: recommends next action for a given lead using AI.
import { GoogleGenAI } from "@google/genai";
import type { Lead, AgentRecommendation, RecommendationType, RecommendationPriority } from '../types.js';
import fs from "node:fs";
import path from "node:path";

// --- Environment loading ---
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

const DEFAULT_MODEL = getEnv("GEMINI_DEFAULT_MODEL", "gemma-4-31b-it") || "gemma-4-31b-it";
const THINKING_BUDGET = parseInt(getEnv("GEMINI_THINKING_BUDGET", "0") || "0") || 0;

const buildThinkingConfig = (model: string) => {
  if (THINKING_BUDGET <= 0) return {};
  if (model.startsWith('gemma-4')) {
    return { thinkingConfig: { thinkingLevel: "high" as any } };
  }
  return { thinkingConfig: { thinkingBudget: THINKING_BUDGET } };
};

const extractJsonFromText = (text: string | undefined): any => {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  const objMatch = text.match(/\[[\s\S]*\]/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  return null;
};

const VALID_RECOMMENDATION_TYPES: RecommendationType[] = [
  'VERIFY', 'ENRICH', 'DRAFT_OUTREACH', 'PRIORITIZE', 'REJECT', 'USER_REVIEW', 'EXPORT'
];

const VALID_PRIORITIES: RecommendationPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

// --- Main export ---

export async function recommendNextActions(lead: Lead): Promise<AgentRecommendation[]> {
  const now = Date.now();

  const hasVerification = !!lead.verification;
  const hasScore = !!lead.scoreBreakdown;
  const hasSocial = lead.socialDiscovery && lead.socialDiscovery.length > 0;
  const hasEvidence = lead.evidence && lead.evidence.length > 0;
  const hasContact = !!(lead.contactEmail || lead.phoneNumber);
  const verificationStatus = lead.verification?.status || 'UNVERIFIED';
  const overallScore = lead.scoreBreakdown?.overall ?? 0;
  const status = lead.status;

  const prompt = `
    You are a Sales Strategy Advisor. Based on the lead's current state, recommend the next best actions.

    LEAD:
    - Company: ${lead.companyName}
    - Region: ${lead.region}
    - Status: ${status}
    - Pipeline Status: ${status}
    - Confidence: ${lead.confidenceScore}/100
    - Has Verification: ${hasVerification} (${verificationStatus})
    - Has Score: ${hasScore} (overall: ${overallScore}/100)
    - Has Social Profiles: ${hasSocial}
    - Has Evidence: ${hasEvidence}
    - Has Contact Info: ${hasContact}
    - Website: ${lead.website || 'None'}

    Recommend 2-4 next actions. Each action must have:
    - type: One of VERIFY, ENRICH, DRAFT_OUTREACH, PRIORITIZE, REJECT, USER_REVIEW, EXPORT
    - priority: HIGH, MEDIUM, or LOW
    - title: Short action title (max 8 words)
    - reason: Why this action is recommended (1 sentence)

    Rules:
    - If not verified, VERIFY should be HIGH priority
    - If not scored and verified, recommend scoring (use USER_REVIEW)
    - If scored >= 60 and verified but no outreach drafted, DRAFT_OUTREACH should be HIGH
    - If scored < 40, consider REJECT with MEDIUM priority
    - If status is CLOSED_WON or CLOSED_LOST, recommend EXPORT or USER_REVIEW
    - Always include at least one actionable item

    Return ONLY a JSON array:
    [
      {
        "type": "VERIFY",
        "priority": "HIGH",
        "title": "Verify company details and location",
        "reason": "Lead has not been verified yet and needs basic validation before outreach."
      }
    ]
    No markdown wrapping.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: buildThinkingConfig(DEFAULT_MODEL),
    });

    if (!response.text) {
      return getFallbackRecommendations(lead, now);
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed || !Array.isArray(parsed)) {
      return getFallbackRecommendations(lead, now);
    }

    return parsed.slice(0, 4).map((item: any, i: number) => ({
      id: `rec-${lead.id || 'unknown'}-${now}-${i}`,
      type: VALID_RECOMMENDATION_TYPES.includes(item.type) ? item.type : 'USER_REVIEW',
      priority: VALID_PRIORITIES.includes(item.priority) ? item.priority : 'MEDIUM',
      title: typeof item.title === 'string' ? item.title : 'Review this lead',
      reason: typeof item.reason === 'string' ? item.reason : 'No reason provided.',
      evidenceIds: [],
      createdAt: now,
    }));
  } catch (error) {
    console.error(`[NextBestAction] Error for ${lead.companyName}:`, error);
    return getFallbackRecommendations(lead, now);
  }
}

function getFallbackRecommendations(lead: Lead, now: number): AgentRecommendation[] {
  const recs: AgentRecommendation[] = [];
  let idx = 0;

  if (!lead.verification) {
    recs.push({
      id: `rec-${lead.id || 'unknown'}-${now}-${idx++}`,
      type: 'VERIFY',
      priority: 'HIGH',
      title: 'Verify lead details',
      reason: 'Verification has not been completed yet.',
      evidenceIds: [],
      createdAt: now,
    });
  }

  if (!lead.scoreBreakdown) {
    recs.push({
      id: `rec-${lead.id || 'unknown'}-${now}-${idx++}`,
      type: 'USER_REVIEW',
      priority: 'MEDIUM',
      title: 'Score this lead',
      reason: 'Lead scoring helps prioritize outreach efforts.',
      evidenceIds: [],
      createdAt: now,
    });
  }

  if (!lead.socialDiscovery || lead.socialDiscovery.length === 0) {
    recs.push({
      id: `rec-${lead.id || 'unknown'}-${now}-${idx++}`,
      type: 'ENRICH',
      priority: 'MEDIUM',
      title: 'Find social profiles',
      reason: 'Social profiles provide additional contact channels.',
      evidenceIds: [],
      createdAt: now,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: `rec-${lead.id || 'unknown'}-${now}-${idx++}`,
      type: 'USER_REVIEW',
      priority: 'LOW',
      title: 'Review lead status',
      reason: 'All automated checks complete — manual review recommended.',
      evidenceIds: [],
      createdAt: now,
    });
  }

  return recs;
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to nextBestAction.ts

- [ ] **Step 3: Quick smoke test (uses fallback path when no API key)**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && node --loader ts-node/esm -e "
import { recommendNextActions } from './server/agent/planner/nextBestAction.js';

const lead = {
  id: 'test-1',
  companyName: 'TestCorp',
  region: 'US-West',
  status: 'DISCOVERED',
  confidenceScore: 75,
  website: 'https://testcorp.com',
};

const recs = await recommendNextActions(lead as any);
console.log('Recommendations:', recs.length);
recs.forEach(r => console.log(' -', r.priority, r.type, ':', r.title));
" 2>&1`
Expected: Shows 2-3 fallback recommendations (VERIFY, USER_REVIEW, ENRICH) with appropriate priorities

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/planner/nextBestAction.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement AI-powered next best action recommendations (Phase 5)"
```

---

### Task 6: Wire up server route + client service + UI

**Files:**
- Modify: `server/index.ts` (replace 501 stub for /api/agent/next-best-action)
- Create: `services/agent/nextBestActionService.ts`
- Modify: `components/InteractionViewer.tsx` (add recommendations section to Dossier)

- [ ] **Step 1: Update server route in index.ts**

In `server/index.ts`, add the import for nextBestAction (near line 30, after the existing agent imports):

```ts
const agentNextBestAction = await import("./agent/planner/nextBestAction.js");
```

Replace the 501 stub route (lines 126-128):

```ts
// Phase 5: Next best action recommendation
app.post("/api/agent/next-best-action", asyncRoute(async (req, res) => {
  const { lead } = req.body;
  const recommendations = await agentNextBestAction.recommendNextActions(lead);
  res.json({ recommendations });
}));
```

- [ ] **Step 2: Create client service**

Create `services/agent/nextBestActionService.ts`:

```ts
// services/agent/nextBestActionService.ts
// Client-side wrapper for next-best-action API endpoint.

import type { AgentRecommendation } from '../../types/agentTypes';
import type { Lead } from '../../types';

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const getNextBestActions = async (lead: Lead): Promise<AgentRecommendation[]> => {
  const { recommendations } = await postJson<{ recommendations: AgentRecommendation[] }>(
    '/api/agent/next-best-action',
    { lead }
  );
  return recommendations;
};
```

- [ ] **Step 3: Add recommendations display to InteractionViewer Dossier tab**

Add the import at the top of `components/InteractionViewer.tsx` (near line 9):

```ts
import { getNextBestActions } from '../services/agent/nextBestActionService';
import type { AgentRecommendation } from '../types/agentTypes';
```

Add state variables after the existing state declarations (near line 28):

```ts
const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
```

Add the Recommendations section to the Dossier tab. Insert this JSX block after the Lead Scoring section (after line 701, before the closing `</div>` of the dossier tab):

```tsx
{/* Agent Recommendations — Phase 5 */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-[10px] font-bold text-slate-600 uppercase">Recommendations</h4>
    <button
      onClick={async () => {
        if (!onUpdateLead || isGettingRecommendations) return;
        setIsGettingRecommendations(true);
        try {
          const recommendations = await getNextBestActions(lead);
          onUpdateLead({
            ...lead,
            recommendations,
            lastAgentAction: 'recommendNextActions',
          });
        } catch (e) {
          console.error('Recommendations failed:', e);
        } finally {
          setIsGettingRecommendations(false);
        }
      }}
      disabled={isGettingRecommendations}
      className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-600/30 rounded text-[10px] text-cyan-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGettingRecommendations ? 'Analyzing...' : 'Get Recommendations'}
    </button>
  </div>

  {lead.recommendations && lead.recommendations.length > 0 ? (
    <div className="space-y-2">
      {lead.recommendations.map((rec: AgentRecommendation, i: number) => (
        <div key={rec.id || i} className="p-3 bg-slate-800/60 rounded border border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white">{rec.title}</span>
            <div className="flex items-center gap-1">
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                rec.priority === 'HIGH' ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                rec.priority === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' :
                'bg-slate-700/30 text-slate-400 border-slate-700/50'
              }`}>
                {rec.priority}
              </span>
              <span className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">
                {rec.type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">{rec.reason}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-[10px] text-slate-600">No recommendations yet.</p>
  )}
</div>
```

- [ ] **Step 4: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors

- [ ] **Step 5: Start the server and verify the route responds**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && timeout 8 npm run dev 2>&1 || true`
Expected: Server starts without errors

- [ ] **Step 6: Test the endpoint with curl**

Run: `curl -s -X POST http://localhost:3000/api/agent/next-best-action -H 'Content-Type: application/json' -d '{"lead":{"id":"t1","companyName":"TestCo","region":"US-West","status":"DISCOVERED","confidenceScore":75}}' | head -200`
Expected: JSON response with `recommendations` array containing 1-4 recommendation objects

- [ ] **Step 7: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/index.ts services/agent/nextBestActionService.ts components/InteractionViewer.tsx
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: wire up next-best-action route, service, and UI (Phase 5)"
```

---

### Task 7: End-to-end smoke test

- [ ] **Step 1: Build check**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No TypeScript errors

- [ ] **Step 2: Start dev server**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &`
Wait for server to start, then:

- [ ] **Step 3: Test all Phase 5 endpoints**

```bash
# Test next-best-action
curl -s -X POST http://localhost:3000/api/agent/next-best-action \
  -H 'Content-Type: application/json' \
  -d '{"lead":{"id":"t1","companyName":"TestCo","region":"US-West","status":"DISCOVERED","confidenceScore":75,"website":"https://testco.com"}}' | python3 -m json.tool
```

Expected: Returns `{"recommendations": [...]}` with valid recommendation objects

- [ ] **Step 4: Kill the dev server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 5: Commit (if any fixes were needed)**

Only if fixes were made during smoke testing.
