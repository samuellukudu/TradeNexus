# Phase 6: Strategy-Driven Outreach Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a strategy-first outreach engine that analyzes each lead's profile and selects a closing strategy before generating any message — so every draft is tailored to *how* to close that specific deal, not just which platform to send on.

**Architecture:** Three modules layered by abstraction. `closingStrategy` (top) analyzes the lead's evidence, verification, scoring, and competitive landscape to pick a closing approach and extract evidence-backed talking points. `messageDrafting` (middle) takes that strategy and renders it into a platform-appropriate draft with specific evidence citations. `followUpPlanning` (bottom) builds a multi-step follow-up sequence with timing, goal per step, and platform choice. All three use Gemini (DEFAULT_MODEL, no grounding) and follow the established graceful-degradation pattern — returning fallback drafts on failure rather than throwing.

**Tech Stack:** TypeScript ESM, Google GenAI SDK, Express asyncRoute pattern, React + Vite

---

### Task 1: Implement closingStrategy (AI-powered strategy selection)

**Files:**
- Create: `server/agent/outreach/closingStrategy.ts`

- [ ] **Step 1: Create the closing strategy module**

```ts
// Phase 6 — Closing strategy: selects the best deal-closing approach for a lead.
import { GoogleGenAI } from "@google/genai";
import type { Lead, ProductDetails } from '../types.js';
import type { OutreachDraftType } from '../types.js';
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

// --- Types ---

export type ClosingStrategyType =
  | 'DIRECT_VALUE_PITCH'
  | 'COMPETITIVE_DISPLACEMENT'
  | 'EDUCATIONAL_HOOK'
  | 'PROBLEM_SOLUTION'
  | 'PARTNERSHIP_APPROACH'
  | 'CASE_STUDY_APPROACH';

export interface ClosingStrategy {
  type: ClosingStrategyType;
  rationale: string;
  keyTalkingPoints: string[];
  evidenceToHighlight: string[];
  recommendedPlatform: OutreachDraftType;
  confidence: number;
  generatedAt: number;
}

const VALID_STRATEGY_TYPES: ClosingStrategyType[] = [
  'DIRECT_VALUE_PITCH', 'COMPETITIVE_DISPLACEMENT', 'EDUCATIONAL_HOOK',
  'PROBLEM_SOLUTION', 'PARTNERSHIP_APPROACH', 'CASE_STUDY_APPROACH'
];

const VALID_PLATFORMS: OutreachDraftType[] = [
  'cold_email', 'linkedin_connection', 'linkedin_followup',
  'whatsapp_short', 'tradeshow_intro', 'distributor_pitch'
];

// --- Main export ---

export async function generateClosingStrategy(
  lead: Lead,
  product?: ProductDetails
): Promise<ClosingStrategy> {
  const now = Date.now();
  const productName = product?.name || "our product";

  const evidenceSummary = (lead.evidence || []).map(e => ({
    type: e.sourceType,
    title: e.title,
    snippet: e.snippet?.substring(0, 200),
    confidence: e.confidence,
  }));

  const socialSummary = (lead.socialDiscovery || []).map(s => ({
    platform: s.platform,
    activityLevel: s.activityLevel,
    isOfficial: s.isOfficialLikely,
    relevance: s.relevanceNotes?.substring(0, 150),
  }));

  const hasCompetitors = lead.competitors && lead.competitors.length > 0;
  const competitorSummary = hasCompetitors
    ? lead.competitors!.map(c => `${c.name}: weakness=${c.weaknesses?.substring(0, 100)}`)
    : [];

  const scoreBreakdown = lead.scoreBreakdown;
  const overallScore = scoreBreakdown?.overall ?? 0;
  const verificationStatus = lead.verification?.status || 'UNVERIFIED';

  const prompt = `
    You are a B2B Sales Strategist specializing in international trade. Select the best closing strategy for this lead.

    LEAD PROFILE:
    - Company: ${lead.companyName}
    - Region: ${lead.region}
    - Industry Fit: ${lead.matchDetails?.industryFit || 'Unknown'}
    - Size Fit: ${lead.matchDetails?.sizeFit || 'Unknown'}
    - Lead Score: ${overallScore}/100
    - Verification: ${verificationStatus}
    - Has Contact Info: ${lead.contactEmail || lead.phoneNumber ? 'Yes' : 'No'}
    - Has Social Presence: ${socialSummary.length > 0 ? 'Yes' : 'No'}

    EVIDENCE GATHERED (${evidenceSummary.length} records):
    ${JSON.stringify(evidenceSummary, null, 2)}

    SOCIAL PROFILES (${socialSummary.length} profiles):
    ${JSON.stringify(socialSummary, null, 2)}

    ${hasCompetitors ? `COMPETITORS:\n${competitorSummary.join('\n')}` : 'COMPETITORS: None identified'}

    PRODUCT: ${productName}

    Select ONE closing strategy from:
    - DIRECT_VALUE_PITCH: Lead has clear need, strong evidence of fit. Pitch value directly — ROI, cost savings, quality advantages.
    - COMPETITIVE_DISPLACEMENT: Competitors identified with known weaknesses. Frame around switching from incumbent.
    - EDUCATIONAL_HOOK: Lead may not fully understand the product category. Educate on market trends and why suppliers like us matter.
    - PROBLEM_SOLUTION: Lead has a specific pain point visible in evidence. Position as the solution to that exact problem.
    - PARTNERSHIP_APPROACH: Lead is a strategic fit for long-term partnership. Frame around mutual growth, exclusivity, co-investment.
    - CASE_STUDY_APPROACH: Similar companies have succeeded with this product. Lead with a relevant success story.

    Also provide:
    - rationale: 2-3 sentences explaining why this strategy fits THIS lead specifically
    - keyTalkingPoints: 3-5 specific arguments tailored to this lead (cite evidence where possible)
    - evidenceToHighlight: 2-4 specific evidence items (titles or snippets) that support the strategy
    - recommendedPlatform: best first-touch channel — 'cold_email', 'linkedin_connection', 'linkedin_followup', 'whatsapp_short', 'tradeshow_intro', or 'distributor_pitch'
    - confidence: 0-100 how confident you are in this strategy choice

    Return ONLY a JSON object:
    {
      "type": "COMPETITIVE_DISPLACEMENT",
      "rationale": "This lead currently uses CompetitorX who has known quality issues...",
      "keyTalkingPoints": ["Your current supplier has 3.2-star quality rating", "We offer ISO 9001 certified production at 15% lower cost"],
      "evidenceToHighlight": ["CompetitorX quality complaints on Trustpilot", "Our ISO 9001 certification"],
      "recommendedPlatform": "cold_email",
      "confidence": 85
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
      return fallbackStrategy(lead, now, 'Model returned empty response');
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed) {
      return fallbackStrategy(lead, now, 'Could not parse model response');
    }

    return {
      type: VALID_STRATEGY_TYPES.includes(parsed.type) ? parsed.type : 'DIRECT_VALUE_PITCH',
      rationale: parsed.rationale || 'Strategy selected based on lead profile analysis.',
      keyTalkingPoints: Array.isArray(parsed.keyTalkingPoints) ? parsed.keyTalkingPoints.slice(0, 5) : [],
      evidenceToHighlight: Array.isArray(parsed.evidenceToHighlight) ? parsed.evidenceToHighlight.slice(0, 4) : [],
      recommendedPlatform: VALID_PLATFORMS.includes(parsed.recommendedPlatform) ? parsed.recommendedPlatform : 'cold_email',
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.confidence))) : 70,
      generatedAt: now,
    };
  } catch (error) {
    console.error(`[ClosingStrategy] Error for ${lead.companyName}:`, error);
    return fallbackStrategy(lead, now, `Strategy error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

function fallbackStrategy(lead: Lead, now: number, reason: string): ClosingStrategy {
  const hasCompetitors = lead.competitors && lead.competitors.length > 0;
  return {
    type: hasCompetitors ? 'COMPETITIVE_DISPLACEMENT' : 'DIRECT_VALUE_PITCH',
    rationale: `Fallback strategy: ${reason}. Using ${hasCompetitors ? 'competitive displacement' : 'direct value pitch'} as default.`,
    keyTalkingPoints: [
      'Our product quality and competitive pricing',
      'Reliable supply chain and on-time delivery',
      'Flexible order quantities and customization options',
    ],
    evidenceToHighlight: [],
    recommendedPlatform: lead.socialDiscovery && lead.socialDiscovery.length > 0 ? 'linkedin_connection' : 'cold_email',
    confidence: 30,
    generatedAt: now,
  };
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to closingStrategy.ts

- [ ] **Step 3: Quick smoke test (fallback path — no API call needed for graceful degradation)**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsx -e "
(async () => {
const { generateClosingStrategy } = await import('./server/agent/outreach/closingStrategy.js');
const lead = { id:'t1', companyName:'TestCo', region:'US-West', status:'DISCOVERED', confidenceScore:75, evidence:[], socialDiscovery:[] };
const result = await generateClosingStrategy(lead as any);
console.log('Strategy:', result.type);
console.log('Rationale:', result.rationale.substring(0, 80));
console.log('Talking points:', result.keyTalkingPoints.length);
console.log('Platform:', result.recommendedPlatform);
console.log('Confidence:', result.confidence);
})();
" 2>&1`
Expected: Strategy: DIRECT_VALUE_PITCH (or COMPETITIVE_DISPLACEMENT), 3 talking points, valid platform, confidence > 0

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/outreach/closingStrategy.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement AI-powered closing strategy selection (Phase 6)"
```

---

### Task 2: Implement messageDrafting (strategy-guided, evidence-citing)

**Files:**
- Modify: `server/agent/outreach/messageDrafting.ts` (replace stub)

- [ ] **Step 1: Replace the messageDrafting stub**

```ts
// Phase 6 — Message drafting: generates strategy-guided, evidence-citing outreach drafts.
import { GoogleGenAI } from "@google/genai";
import type { Lead, StrategicContext, OutreachDraft, OutreachDraftType } from '../types.js';
import type { ClosingStrategy } from './closingStrategy.js';
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

const PLATFORM_GUIDANCE: Record<OutreachDraftType, { maxLength: number; tone: string; needsSubject: boolean }> = {
  cold_email: { maxLength: 250, tone: 'professional and concise', needsSubject: true },
  linkedin_connection: { maxLength: 200, tone: 'personal and brief — this is a connection request note', needsSubject: false },
  linkedin_followup: { maxLength: 350, tone: 'warm follow-up referencing prior contact', needsSubject: false },
  whatsapp_short: { maxLength: 150, tone: 'casual, direct, mobile-friendly', needsSubject: false },
  tradeshow_intro: { maxLength: 200, tone: 'in-person follow-up energy, reference the event', needsSubject: true },
  distributor_pitch: { maxLength: 300, tone: 'business-focused, emphasize margins and logistics', needsSubject: true },
};

// --- Main export ---

export async function generateOutreachDraft(
  lead: Lead,
  type: OutreachDraftType,
  strategy: ClosingStrategy,
  context?: StrategicContext
): Promise<OutreachDraft> {
  const now = Date.now();
  const guidance = PLATFORM_GUIDANCE[type] || PLATFORM_GUIDANCE.cold_email;
  const productName = context?.productName || "our product";

  // Collect evidence IDs that back the strategy's talking points
  const evidenceAvailable = lead.evidence || [];
  const relevantEvidence = evidenceAvailable.filter(e =>
    strategy.evidenceToHighlight.some(highlight =>
      e.title?.toLowerCase().includes(highlight.toLowerCase()) ||
      e.snippet?.toLowerCase().includes(highlight.toLowerCase())
    )
  );
  const evidenceIds = relevantEvidence.map(e => e.id).filter(Boolean);
  const evidenceSnippets = relevantEvidence.slice(0, 3).map(e =>
    `[${e.sourceType}] ${e.title}: ${e.snippet?.substring(0, 150)}`
  );

  const socialContactInfo = (lead.socialDiscovery || [])
    .filter(s => s.contactHints && s.contactHints.length > 0)
    .flatMap(s => s.contactHints || [])
    .slice(0, 3);

  const prompt = `
    You are a B2B Sales Copywriter. Write an outreach message for the following lead.

    CLOSING STRATEGY: ${strategy.type}
    Strategy Rationale: ${strategy.rationale}

    KEY TALKING POINTS TO INCLUDE:
    ${strategy.keyTalkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

    SUPPORTING EVIDENCE:
    ${evidenceSnippets.length > 0 ? evidenceSnippets.join('\n') : 'No specific evidence available — use general value propositions.'}

    LEAD:
    - Company: ${lead.companyName}
    - Region: ${lead.region}
    - Contact: ${lead.contactEmail || lead.phoneNumber || 'No direct contact — use company channels'}
    - Industry: ${lead.matchDetails?.industryFit || 'Unknown'}
    - Website: ${lead.website || 'None'}
    ${socialContactInfo.length > 0 ? `- Social Contact Hints: ${socialContactInfo.join(', ')}` : ''}

    PRODUCT: ${productName}

    PLATFORM: ${type}
    ${guidance.needsSubject ? 'Include a subject line.' : 'No subject line needed.'}
    Max length: ~${guidance.maxLength} characters.
    Tone: ${guidance.tone}

    IMPORTANT:
    - Weave in the strategy's talking points naturally — don't list them
    - Reference specific evidence when it adds credibility
    - End with a clear, low-friction call to action
    - Do NOT use placeholders like [Company Name] — use the actual company name: ${lead.companyName}

    Return ONLY a JSON object:
    {
      "subject": "${guidance.needsSubject ? 'Subject line here' : ''}",
      "body": "Full message text here..."
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
      return fallbackDraft(lead, type, strategy, now, evidenceIds, 'Model returned empty response');
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed || !parsed.body) {
      return fallbackDraft(lead, type, strategy, now, evidenceIds, 'Could not parse model response');
    }

    return {
      id: `draft-${lead.id || 'unknown'}-${now}`,
      type,
      subject: guidance.needsSubject ? (parsed.subject || undefined) : undefined,
      body: parsed.body,
      evidenceIds,
      createdAt: now,
      approved: false,
    };
  } catch (error) {
    console.error(`[MessageDrafting] Error for ${lead.companyName}:`, error);
    return fallbackDraft(lead, type, strategy, now, evidenceIds,
      `Drafting error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

function fallbackDraft(
  lead: Lead,
  type: OutreachDraftType,
  strategy: ClosingStrategy,
  now: number,
  evidenceIds: string[],
  reason: string
): OutreachDraft {
  const talkingPoints = strategy.keyTalkingPoints.slice(0, 2).join(' ');

  const bodies: Record<OutreachDraftType, string> = {
    cold_email: `Subject: Partnership Opportunity for ${lead.companyName}\n\nDear ${lead.companyName} team,\n\nI'm reaching out because ${talkingPoints || 'we see a strong fit between our capabilities and your needs'}.\n\nWe specialize in high-quality manufacturing with reliable delivery. I'd love to schedule a brief call to explore how we can support your supply chain.\n\nBest regards`,
    linkedin_connection: `Hi, I've been following ${lead.companyName}'s work in ${lead.region}. ${talkingPoints || 'I believe there could be a strong fit between our companies'}. Would love to connect and explore potential collaboration.`,
    linkedin_followup: `Hi again, following up on my previous message. ${talkingPoints || 'I wanted to circle back as I think there's real potential here'}. Happy to share more details about how we've helped similar companies — just let me know if you'd like to chat.`,
    whatsapp_short: `Hi! This is regarding a potential supply partnership with ${lead.companyName}. ${talkingPoints || 'We see a strong fit'}. Would you be open to a quick chat?`,
    tradeshow_intro: `Subject: Great to connect at the show\n\nHi ${lead.companyName} team,\n\nIt was great meeting you. ${talkingPoints || 'I wanted to follow up on our conversation about supply chain opportunities'}.\n\nLet me know if you'd like to continue the discussion.\n\nBest regards`,
    distributor_pitch: `Subject: Distribution Partnership — ${lead.companyName}\n\nDear ${lead.companyName} team,\n\nWe're looking for a distribution partner in ${lead.region} and ${lead.companyName} stands out. ${talkingPoints || 'We believe there's a strong mutual opportunity here'}.\n\nOur products offer competitive margins and reliable supply. I'd love to discuss a potential partnership.\n\nBest regards`,
  };

  return {
    id: `draft-${lead.id || 'unknown'}-${now}`,
    type,
    subject: type === 'cold_email' || type === 'tradeshow_intro' || type === 'distributor_pitch'
      ? `Partnership Opportunity for ${lead.companyName}`
      : undefined,
    body: bodies[type] || bodies.cold_email,
    evidenceIds,
    createdAt: now,
    approved: false,
  };
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to messageDrafting.ts

- [ ] **Step 3: Quick smoke test (fallback path)**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsx -e "
(async () => {
const { generateOutreachDraft } = await import('./server/agent/outreach/messageDrafting.js');
const { generateClosingStrategy } = await import('./server/agent/outreach/closingStrategy.js');

const lead = { id:'t1', companyName:'TestCo', region:'US-West', status:'DISCOVERED', confidenceScore:75, evidence:[], socialDiscovery:[] };
const strategy = await generateClosingStrategy(lead as any);
const draft = await generateOutreachDraft(lead as any, strategy.recommendedPlatform, strategy);
console.log('Draft type:', draft.type);
console.log('Has body:', draft.body.length > 50);
console.log('Approved:', draft.approved);
console.log('Has subject:', !!draft.subject);
console.log('Body preview:', draft.body.substring(0, 100));
})();
" 2>&1`
Expected: Valid draft with body, approved: false, type matches strategy's recommended platform

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/outreach/messageDrafting.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement strategy-guided message drafting with evidence citations (Phase 6)"
```

---

### Task 3: Implement followUpPlanning (multi-step sequence planning)

**Files:**
- Modify: `server/agent/outreach/followUpPlanning.ts` (replace stub)

- [ ] **Step 1: Replace the followUpPlanning stub**

```ts
// Phase 6 — Follow-up planning: builds multi-step closing sequences.
import { GoogleGenAI } from "@google/genai";
import type { Lead } from '../types.js';
import type { OutreachDraftType } from '../types.js';
import type { ClosingStrategy } from './closingStrategy.js';
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

// --- Types ---

export interface OutreachSequenceStep {
  step: number;
  type: OutreachDraftType;
  timing: string;
  goal: string;
  draftId?: string;
}

export interface OutreachSequence {
  id: string;
  leadId: string;
  strategyType: string;
  steps: OutreachSequenceStep[];
  totalDays: number;
  rationale: string;
  generatedAt: number;
}

// --- Main export ---

export async function planFollowUpSequence(
  lead: Lead,
  initialDraftId: string,
  strategy: ClosingStrategy
): Promise<OutreachSequence> {
  const now = Date.now();

  const hasEmail = !!lead.contactEmail;
  const hasPhone = !!lead.phoneNumber;
  const hasSocial = lead.socialDiscovery && lead.socialDiscovery.length > 0;
  const hasLinkedIn = lead.socialDiscovery?.some(s => s.platform === 'linkedin');

  const prompt = `
    You are a B2B Sales Cadence Planner. Design a multi-step follow-up sequence to close this deal.

    LEAD: ${lead.companyName}
    REGION: ${lead.region}
    CLOSING STRATEGY: ${strategy.type}
    INITIAL DRAFT ALREADY SENT via: ${strategy.recommendedPlatform}
    CHANNELS AVAILABLE:
    - Email: ${hasEmail ? 'Yes' : 'No'}
    - Phone/SMS: ${hasPhone ? 'Yes' : 'No'}
    - LinkedIn: ${hasLinkedIn ? 'Yes' : 'No'}
    - Social: ${hasSocial ? 'Yes' : 'No'}

    STRATEGY TALKING POINTS:
    ${strategy.keyTalkingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

    Plan 3-5 follow-up steps. For each step specify:
    - step: number (1-based, step 1 is the first follow-up AFTER the initial draft)
    - type: 'cold_email' | 'linkedin_connection' | 'linkedin_followup' | 'whatsapp_short'
    - timing: when to send relative to previous step (e.g., "3 days after initial", "1 week after Step 1")
    - goal: what this step should accomplish (e.g., "Get a reply", "Share a case study", "Propose a call")

    Rules:
    - Vary the channel — don't send 3 emails in a row
    - Escalate value over time — later steps should offer more specific value
    - Don't be pushy — space steps realistically (3-7 days between touches)
    - The last step should be a soft breakpoint ("If no response, pause and reassess")

    Return ONLY a JSON object:
    {
      "steps": [
        {
          "step": 1,
          "type": "linkedin_followup",
          "timing": "3 days after initial email",
          "goal": "Reinforce value proposition on a second channel"
        }
      ],
      "totalDays": 14,
      "rationale": "This sequence alternates email and LinkedIn to maximize visibility without being aggressive..."
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
      return fallbackSequence(lead, initialDraftId, strategy, now, 'Model returned empty response');
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed || !Array.isArray(parsed.steps)) {
      return fallbackSequence(lead, initialDraftId, strategy, now, 'Could not parse model response');
    }

    return {
      id: `seq-${lead.id || 'unknown'}-${now}`,
      leadId: lead.id || 'unknown',
      strategyType: strategy.type,
      steps: parsed.steps.slice(0, 5).map((s: any, i: number) => ({
        step: s.step || i + 1,
        type: s.type || 'cold_email',
        timing: s.timing || `${(i + 1) * 4} days after initial`,
        goal: s.goal || 'Continue engagement',
      })),
      totalDays: typeof parsed.totalDays === 'number' ? parsed.totalDays : 14,
      rationale: parsed.rationale || 'Multi-step follow-up sequence.',
      generatedAt: now,
    };
  } catch (error) {
    console.error(`[FollowUpPlanning] Error for ${lead.companyName}:`, error);
    return fallbackSequence(lead, initialDraftId, strategy, now,
      `Sequence error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

function fallbackSequence(
  lead: Lead,
  initialDraftId: string,
  strategy: ClosingStrategy,
  now: number,
  reason: string
): OutreachSequence {
  const hasLinkedIn = lead.socialDiscovery?.some(s => s.platform === 'linkedin');

  return {
    id: `seq-${lead.id || 'unknown'}-${now}`,
    leadId: lead.id || 'unknown',
    strategyType: strategy.type,
    steps: [
      {
        step: 1,
        type: hasLinkedIn ? 'linkedin_followup' : 'cold_email',
        timing: '3-4 days after initial',
        goal: 'Reinforce key value proposition on a second channel',
      },
      {
        step: 2,
        type: 'cold_email',
        timing: '1 week after Step 1',
        goal: 'Share additional detail — case study, spec sheet, or pricing advantage',
      },
      {
        step: 3,
        type: 'whatsapp_short',
        timing: '5-7 days after Step 2',
        goal: 'Brief, personal check-in. If no response, pause and reassess.',
      },
    ],
    totalDays: 16,
    rationale: `Fallback 3-step sequence: ${reason}`,
    generatedAt: now,
  };
}
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to followUpPlanning.ts

- [ ] **Step 3: Quick smoke test (fallback path)**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsx -e "
(async () => {
const { planFollowUpSequence } = await import('./server/agent/outreach/followUpPlanning.js');
const lead = { id:'t1', companyName:'TestCo', region:'US-West', socialDiscovery:[] };
const strategy = { type: 'DIRECT_VALUE_PITCH' as const, keyTalkingPoints: ['Quality', 'Price'], recommendedPlatform: 'cold_email' as const, evidenceToHighlight: [], rationale: 'test', confidence: 80, generatedAt: Date.now() };
const seq = await planFollowUpSequence(lead as any, 'draft-1', strategy);
console.log('Steps:', seq.steps.length);
console.log('Total days:', seq.totalDays);
console.log('Has rationale:', seq.rationale.length > 10);
seq.steps.forEach(s => console.log(' Step', s.step, ':', s.type, '-', s.timing));
})();
" 2>&1`
Expected: 3 steps, totalDays: ~16, each step has type/timing/goal

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/outreach/followUpPlanning.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement multi-step follow-up sequence planning (Phase 6)"
```

---

### Task 4: Wire up server routes + client services

**Files:**
- Modify: `server/index.ts:30-31` (add imports)
- Modify: `server/index.ts:133-136` (replace 501 stubs)
- Create: `services/agent/outreachService.ts`

- [ ] **Step 1: Add server imports**

In `server/index.ts`, add after the existing agent imports (line ~31):

```ts
const agentOutreachStrategy = await import("./agent/outreach/closingStrategy.js");
const agentOutreachDrafting = await import("./agent/outreach/messageDrafting.js");
const agentOutreachFollowUp = await import("./agent/outreach/followUpPlanning.js");
```

- [ ] **Step 2: Replace 501 stubs with working routes**

Replace the Phase 6 stub (lines 133-136) with:

```ts
// Phase 6: Closing strategy selection
app.post("/api/agent/closing-strategy", asyncRoute(async (req, res) => {
  const { lead, product } = req.body;
  const strategy = await agentOutreachStrategy.generateClosingStrategy(lead, product);
  res.json({ strategy });
}));

// Phase 6: Strategy-guided outreach draft generation
app.post("/api/agent/outreach-draft", asyncRoute(async (req, res) => {
  const { lead, type, strategy, context } = req.body;
  const draft = await agentOutreachDrafting.generateOutreachDraft(lead, type, strategy, context);
  res.json({ draft });
}));

// Phase 6: Follow-up sequence planning
app.post("/api/agent/follow-up-sequence", asyncRoute(async (req, res) => {
  const { lead, draftId, strategy } = req.body;
  const sequence = await agentOutreachFollowUp.planFollowUpSequence(lead, draftId, strategy);
  res.json({ sequence });
}));
```

- [ ] **Step 3: Create client service**

Create `services/agent/outreachService.ts`:

```ts
// services/agent/outreachService.ts
// Client-side wrapper for outreach drafting API endpoints.

import type { OutreachDraft, OutreachDraftType } from '../../types/agentTypes';
import type { Lead, StrategicContext } from '../../types';
import type { ClosingStrategy } from '../../server/agent/outreach/closingStrategy';
import type { OutreachSequence } from '../../server/agent/outreach/followUpPlanning';

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

export const getClosingStrategy = async (
  lead: Lead,
  product?: { name?: string }
): Promise<ClosingStrategy> => {
  const { strategy } = await postJson<{ strategy: ClosingStrategy }>(
    '/api/agent/closing-strategy',
    { lead, product }
  );
  return strategy;
};

export const generateOutreachDraft = async (
  lead: Lead,
  type: OutreachDraftType,
  strategy: ClosingStrategy,
  context?: StrategicContext
): Promise<OutreachDraft> => {
  const { draft } = await postJson<{ draft: OutreachDraft }>(
    '/api/agent/outreach-draft',
    { lead, type, strategy, context }
  );
  return draft;
};

export const getFollowUpSequence = async (
  lead: Lead,
  draftId: string,
  strategy: ClosingStrategy
): Promise<OutreachSequence> => {
  const { sequence } = await postJson<{ sequence: OutreachSequence }>(
    '/api/agent/follow-up-sequence',
    { lead, draftId, strategy }
  );
  return sequence;
};
```

- [ ] **Step 4: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors related to the new files

- [ ] **Step 5: Start server and test all 3 endpoints**

Run:
```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &
sleep 5
```

Then test:

```bash
# Test closing strategy
curl -s -X POST http://localhost:3000/api/agent/closing-strategy \
  -H 'Content-Type: application/json' \
  -d '{"lead":{"id":"t1","companyName":"TestCo","region":"US-West","status":"DISCOVERED","confidenceScore":75,"evidence":[],"socialDiscovery":[]}}' | python3 -m json.tool

# Test outreach draft
curl -s -X POST http://localhost:3000/api/agent/outreach-draft \
  -H 'Content-Type: application/json' \
  -d '{"lead":{"id":"t1","companyName":"TestCo","region":"US-West","confidenceScore":75},"type":"cold_email","strategy":{"type":"DIRECT_VALUE_PITCH","rationale":"test","keyTalkingPoints":["Quality","Price"],"evidenceToHighlight":[],"recommendedPlatform":"cold_email","confidence":80}}' | python3 -m json.tool

# Test follow-up sequence
curl -s -X POST http://localhost:3000/api/agent/follow-up-sequence \
  -H 'Content-Type: application/json' \
  -d '{"lead":{"id":"t1","companyName":"TestCo","region":"US-West","socialDiscovery":[]},"draftId":"draft-1","strategy":{"type":"DIRECT_VALUE_PITCH","keyTalkingPoints":["Quality","Price"],"recommendedPlatform":"cold_email","evidenceToHighlight":[],"rationale":"test","confidence":80}}' | python3 -m json.tool
```

Expected: All three return valid JSON with the expected shape

- [ ] **Step 6: Kill server and commit**

```bash
kill %1 2>/dev/null || true
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/index.ts services/agent/outreachService.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: wire up Phase 6 outreach routes and client service"
```

---

### Task 5: Add outreach UI to Dossier tab

**Files:**
- Modify: `components/InteractionViewer.tsx` (add imports, state, and outreach section)

- [ ] **Step 1: Add imports to InteractionViewer.tsx**

Add after existing agent service imports (near line 9):

```ts
import { getClosingStrategy, generateOutreachDraft, getFollowUpSequence } from '../services/agent/outreachService';
import type { ClosingStrategy } from '../server/agent/outreach/closingStrategy';
import type { OutreachSequence } from '../server/agent/outreach/followUpPlanning';
import type { OutreachDraft } from '../types/agentTypes';
```

- [ ] **Step 2: Add state variables**

Add after `isGettingRecommendations` state (near line 29):

```ts
const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
const [outreachError, setOutreachError] = useState<string | null>(null);
```

- [ ] **Step 3: Add Outreach Strategy section to Dossier tab**

Insert this JSX block after the Recommendations section (before the closing `</div>` of the dossier tab):

```tsx
{/* Outreach Strategy & Drafts — Phase 6 */}
<div className="mb-6">
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-[10px] font-bold text-slate-600 uppercase">Outreach Strategy</h4>
    <div className="flex items-center gap-2">
      <button
        onClick={async () => {
          if (!onUpdateLead || isGeneratingStrategy) return;
          setIsGeneratingStrategy(true);
          setOutreachError(null);
          try {
            const strategy = await getClosingStrategy(lead, productContext as any);
            onUpdateLead({
              ...lead,
              lastAgentAction: 'generateClosingStrategy',
              // Store strategy on lead for draft generation
              ...({ _closingStrategy: strategy } as any),
            });
          } catch (e) {
            console.error('Strategy generation failed:', e);
            setOutreachError('Strategy generation failed.');
          } finally {
            setIsGeneratingStrategy(false);
          }
        }}
        disabled={isGeneratingStrategy}
        className="px-2 py-1 bg-teal-600/20 hover:bg-teal-600/40 border border-teal-600/30 rounded text-[10px] text-teal-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingStrategy ? 'Analyzing...' : 'Get Strategy'}
      </button>
      {(lead as any)._closingStrategy && (
        <button
          onClick={async () => {
            if (!onUpdateLead || isGeneratingDraft) return;
            setIsGeneratingDraft(true);
            setOutreachError(null);
            try {
              const strategy = (lead as any)._closingStrategy as ClosingStrategy;
              const draft = await generateOutreachDraft(lead, strategy.recommendedPlatform, strategy, productContext);
              const drafts = [...(lead.outreachDrafts || []), draft];
              onUpdateLead({
                ...lead,
                outreachDrafts: drafts,
                lastAgentAction: 'generateOutreachDraft',
              } as any);
            } catch (e) {
              console.error('Draft generation failed:', e);
              setOutreachError('Draft generation failed.');
            } finally {
              setIsGeneratingDraft(false);
            }
          }}
          disabled={isGeneratingDraft}
          className="px-2 py-1 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-600/30 rounded text-[10px] text-pink-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingDraft ? 'Drafting...' : 'Generate Draft'}
        </button>
      )}
    </div>
  </div>

  {outreachError && (
    <p className="text-[10px] text-red-400 mb-2">{outreachError}</p>
  )}

  {/* Strategy display */}
  {(lead as any)._closingStrategy ? (
    <div className="mb-3 p-3 bg-teal-900/20 rounded border border-teal-800/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-teal-400">
          {(lead as any)._closingStrategy.type.replace(/_/g, ' ')}
        </span>
        <span className="text-[9px] text-teal-600">
          {(lead as any)._closingStrategy.confidence}% confidence
        </span>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
        {(lead as any)._closingStrategy.rationale}
      </p>
      <div className="space-y-1">
        {((lead as any)._closingStrategy.keyTalkingPoints as string[]).map((point: string, i: number) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-[9px] text-teal-500 mt-0.5">•</span>
            <span className="text-[10px] text-slate-300">{point}</span>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-[10px] text-slate-600 mb-3">Generate a closing strategy first.</p>
  )}

  {/* Generated drafts */}
  {lead.outreachDrafts && lead.outreachDrafts.length > 0 && (
    <div className="space-y-2">
      <h5 className="text-[9px] font-bold text-slate-500 uppercase">Generated Drafts</h5>
      {lead.outreachDrafts.map((draft: OutreachDraft, i: number) => (
        <div key={draft.id || i} className="p-3 bg-slate-800/60 rounded border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50 capitalize">
                {draft.type.replace(/_/g, ' ')}
              </span>
              {draft.approved ? (
                <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">Approved</span>
              ) : (
                <span className="text-[9px] bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-800/50">Pending</span>
              )}
            </div>
            <button
              onClick={() => {
                if (!onUpdateLead) return;
                const updated = lead.outreachDrafts?.map((d, idx) =>
                  idx === i ? { ...d, approved: !d.approved } : d
                ) || [];
                onUpdateLead({ ...lead, outreachDrafts: updated, lastAgentAction: 'toggleDraftApproval' });
              }}
              className="text-[9px] text-slate-500 hover:text-white transition-colors"
            >
              {draft.approved ? 'Unapprove' : 'Approve'}
            </button>
          </div>
          {draft.subject && (
            <p className="text-[10px] font-bold text-slate-300 mb-1">{draft.subject}</p>
          )}
          <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap">{draft.body}</p>
          {draft.evidenceIds && draft.evidenceIds.length > 0 && (
            <p className="text-[9px] text-slate-600 mt-2">
              Evidence: {draft.evidenceIds.length} references cited
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 2: Build and verify TypeScript compilation**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: No errors in InteractionViewer.tsx

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add components/InteractionViewer.tsx
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: add outreach strategy and draft UI to Dossier tab (Phase 6)"
```

---

### Task 6: End-to-end smoke test

- [ ] **Step 1: Final TypeScript check**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit --pretty 2>&1 | head -40`
Expected: Only pre-existing errors in App.tsx and firestore.rules.test.ts

- [ ] **Step 2: Start dev server and run full flow**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &
sleep 5
```

Test the complete flow:

```bash
# 1. Get closing strategy
STRATEGY=$(curl -s -X POST http://localhost:3000/api/agent/closing-strategy \
  -H 'Content-Type: application/json' \
  -d '{"lead":{"id":"t1","companyName":"TestCo","region":"US-West","status":"DISCOVERED","confidenceScore":75,"evidence":[],"socialDiscovery":[]}}')
echo "Strategy: $(echo $STRATEGY | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["strategy"]["type"])')"

# 2. Generate draft using that strategy
curl -s -X POST http://localhost:3000/api/agent/outreach-draft \
  -H 'Content-Type: application/json' \
  -d "{\"lead\":{\"id\":\"t1\",\"companyName\":\"TestCo\",\"region\":\"US-West\"},\"type\":\"cold_email\",\"strategy\":$(echo $STRATEGY | python3 -c 'import sys,json; print(json.dumps(json.load(sys.stdin)["strategy"]))')}" | python3 -m json.tool

# 3. Get follow-up sequence
curl -s -X POST http://localhost:3000/api/agent/follow-up-sequence \
  -H 'Content-Type: application/json' \
  -d "{\"lead\":{\"id\":\"t1\",\"companyName\":\"TestCo\",\"region\":\"US-West\"},\"draftId\":\"draft-1\",\"strategy\":$(echo $STRATEGY | python3 -c 'import sys,json; print(json.dumps(json.load(sys.stdin)["strategy"]))')}" | python3 -m json.tool
```

Expected: All three endpoints return valid JSON with correct shapes

- [ ] **Step 3: Kill server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 4: Final commit (only if fixes were needed)**

Only if smoke test revealed issues requiring fixes.
