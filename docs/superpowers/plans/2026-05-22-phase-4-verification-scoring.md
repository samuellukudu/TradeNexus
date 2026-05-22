# Phase 4: Verification + Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement structured lead verification (multi-check with evidence cross-referencing) and AI-powered lead scoring (10-dimensional breakdown), then display both in the Dossier tab.

**Architecture:** `leadVerification.ts` migrates the existing `verifyLead` from geminiService.ts into a modular verifier that returns `LeadVerification` with a checks array (LOCATION, WEBSITE, PRODUCT_FIT, SOCIAL_OWNERSHIP, CONTACT, DUPLICATE). `leadScoring.ts` uses Gemini to score leads across 10 dimensions using available evidence. `scoreBreakdown.ts` provides formatting and color-coding helpers. The Dossier tab gains "Verify Lead" and "Score Lead" action buttons, plus visual displays for verification checks and score bars.

**Tech Stack:** TypeScript, Express, Google GenAI SDK with Google Search grounding, React

---

### Task 1: Implement lead verification module

**Files:**
- Modify: `server/agent/verification/leadVerification.ts`

- [ ] **Step 1: Read the existing verifyLead in geminiService.ts for reference**

Read `server/geminiService.ts:524-579` to understand the current verification prompt pattern and response handling.

- [ ] **Step 2: Replace the leadVerification.ts stub**

Replace `server/agent/verification/leadVerification.ts` with:

```ts
// server/agent/verification/leadVerification.ts
// Phase 4 — Multi-check lead verification that cross-references evidence.

import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { Lead, ProductDetails, LeadVerification, VerificationCheck } from '../types.js';
import fs from "node:fs";
import path from "node:path";

// --- Environment loading (same pattern as socialDiscovery.ts) ---
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

export async function verifyLead(
  lead: Lead,
  product?: ProductDetails
): Promise<LeadVerification> {
  const now = Date.now();
  const checks: VerificationCheck[] = [];

  const productName = product?.name || "the product";
  const evidenceList = lead.evidence && lead.evidence.length > 0
    ? lead.evidence.map(e => `- ${e.sourceType}: ${e.url} (confidence: ${e.confidence})`).join('\n')
    : 'No evidence available.';
  const socialProfiles = lead.socialDiscovery && lead.socialDiscovery.length > 0
    ? lead.socialDiscovery.map(s => `- ${s.platform}: ${s.url} (official: ${s.isOfficialLikely})`).join('\n')
    : 'No social profiles discovered.';

  const prompt = `
    You are a Lead Verification Specialist. Your job is to verify the legitimacy of a sales lead using available evidence.

    LEAD: "${lead.companyName}"
    REGION: ${lead.region}
    WEBSITE: ${lead.website || 'Unknown'}
    ADDRESS: ${lead.address || 'Unknown'}
    CONFIDENCE SCORE: ${lead.confidenceScore}/100
    GOOGLE MAPS URL: ${lead.googleMapsUrl || 'Not available'}

    PRODUCT WE ARE SELLING: ${productName}

    EVIDENCE RECORDS:
    ${evidenceList}

    SOCIAL PROFILES:
    ${socialProfiles}

    TASK: Run these verification checks and return a JSON object:

    1. LOCATION — Does the company physically exist in ${lead.region}? Check Google Maps data, address validity.
    2. WEBSITE — Is the website active and relevant to their claimed business?
    3. PRODUCT_FIT — Does this company potentially buy, distribute, or use ${productName}?
    4. SOCIAL_OWNERSHIP — Do the social profiles genuinely belong to this company? (check name match, branding, activity)
    5. CONTACT — Is there usable contact information available? (email, phone, WhatsApp from evidence or social)
    6. DUPLICATE — Any sign this is a duplicate of another known lead? (usually PASS unless evidence strongly suggests duplication)

    For EACH check, return:
    - type: one of "LOCATION", "WEBSITE", "PRODUCT_FIT", "SOCIAL_OWNERSHIP", "CONTACT", "DUPLICATE", "COUNTRY_EXCLUSION"
    - status: "PASS" (check passed), "FAIL" (check failed), "WARNING" (some concerns), or "UNKNOWN" (insufficient data)
    - confidence: number 0-1 (how confident are you in this assessment)
    - notes: short explanation of what you found
    - evidenceIds: an empty array (client can populate with specific evidence record IDs)

    OVERALL:
    - status: "VERIFIED" (all critical checks pass), "PARTIAL" (most pass but some warnings), "FAILED" (critical checks fail), or "UNVERIFIED" (insufficient data)
    - confidence: number 0-1 (overall confidence in the lead after verification)

    Return ONLY a JSON object with this exact structure:
    {
      "checks": [ ... ],
      "status": "VERIFIED" | "PARTIAL" | "FAILED" | "UNVERIFIED",
      "confidence": 0.85
    }
    No markdown wrapping.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        ...buildThinkingConfig(DEFAULT_MODEL),
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      return {
        status: 'UNVERIFIED',
        confidence: 0,
        checks: [{
          id: uuidv4(),
          type: 'LOCATION',
          status: 'UNKNOWN',
          confidence: 0,
          notes: 'Verification failed: model returned empty response.',
          evidenceIds: [],
        }],
        updatedAt: now,
      };
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed) {
      return {
        status: 'UNVERIFIED',
        confidence: 0,
        checks: [{
          id: uuidv4(),
          type: 'LOCATION',
          status: 'UNKNOWN',
          confidence: 0,
          notes: 'Verification failed: could not parse model response.',
          evidenceIds: [],
        }],
        updatedAt: now,
      };
    }

    const parsedChecks: VerificationCheck[] = Array.isArray(parsed.checks)
      ? parsed.checks.map((c: any) => ({
          id: uuidv4(),
          type: c.type || 'LOCATION',
          status: c.status || 'UNKNOWN',
          confidence: typeof c.confidence === 'number' ? c.confidence : 0.5,
          notes: c.notes || '',
          evidenceIds: Array.isArray(c.evidenceIds) ? c.evidenceIds : [],
        }))
      : [];

    return {
      status: parsed.status || 'UNVERIFIED',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      checks: parsedChecks,
      updatedAt: now,
    };

  } catch (error) {
    console.error(`[LeadVerification] Error for ${lead.companyName}:`, error);
    return {
      status: 'UNVERIFIED',
      confidence: 0,
      checks: [{
        id: uuidv4(),
        type: 'LOCATION',
        status: 'UNKNOWN',
        confidence: 0,
        notes: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        evidenceIds: [],
      }],
      updatedAt: now,
    };
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/verification/leadVerification.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement multi-check lead verification with structured checks"
```

---

### Task 2: Implement lead scoring module

**Files:**
- Modify: `server/agent/scoring/leadScoring.ts`

- [ ] **Step 1: Replace the leadScoring.ts stub**

Replace `server/agent/scoring/leadScoring.ts` with:

```ts
// server/agent/scoring/leadScoring.ts
// Phase 4 — AI-powered lead scoring with 10-dimensional breakdown.

import { GoogleGenAI } from "@google/genai";
import type { Lead, ProductDetails, LeadScoreBreakdown } from '../types.js';
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

export async function scoreLead(
  lead: Lead,
  product?: ProductDetails
): Promise<LeadScoreBreakdown> {
  const now = Date.now();
  const productName = product?.name || "the product";

  const hasEvidence = lead.evidence && lead.evidence.length > 0;
  const hasSocial = lead.socialDiscovery && lead.socialDiscovery.length > 0;
  const hasVerification = lead.verification && lead.verification.status !== 'UNVERIFIED';
  const verificationStatus = lead.verification?.status || 'UNVERIFIED';
  const evidenceCount = lead.evidence?.length || 0;
  const socialCount = lead.socialDiscovery?.length || 0;

  const prompt = `
    You are a Lead Scoring Specialist. Score this lead across 10 dimensions based on available data.

    LEAD: "${lead.companyName}"
    REGION: ${lead.region}
    WEBSITE: ${lead.website || 'None'}
    CONFIDENCE: ${lead.confidenceScore}/100
    EVIDENCE RECORDS: ${evidenceCount}
    SOCIAL PROFILES: ${socialCount}
    VERIFICATION STATUS: ${verificationStatus}
    EMPLOYEE COUNT: ${lead.employeeCount || 'Unknown'}
    MATCH DETAILS: ${lead.matchDetails ? JSON.stringify(lead.matchDetails) : 'None'}
    HAS CONTACT INFO: ${lead.contactEmail || lead.phoneNumber ? 'Yes' : 'No'}

    PRODUCT: ${productName}

    CONTEXT: ${lead.summary || 'No summary available.'}

    Score each dimension 0-100 (0 = worst, 100 = best):

    1. locationFit — Is the lead in the right region? (use lead.region data)
    2. productFit — Does this company need/could use ${productName}?
    3. buyerTypeFit — Is this company the right buyer type (distributor, OEM, end user)?
    4. companySizeFit — Is the company appropriately sized?
    5. evidenceQuality — How good is the evidence? (count, source types, confidence of each piece)
    6. socialActivity — How active is the company on social media? (HIGH/MEDIUM/LOW from socialDiscovery)
    7. contactability — Can we contact this company? (email, phone, social DM available?)
    8. competitiveOpportunity — Is there a gap in the market? Are competitors weak in this segment?
    9. freshness — How recently was this lead discovered? (recent = higher score)
    10. overall — Weighted average of above, weighted toward productFit and evidenceQuality.

    Also provide:
    - rationale: 2-3 sentences explaining the overall score and key factors

    Return ONLY a JSON object:
    {
      "overall": 72,
      "locationFit": 85,
      "productFit": 65,
      "buyerTypeFit": 70,
      "companySizeFit": 60,
      "evidenceQuality": 80,
      "socialActivity": 55,
      "contactability": 75,
      "competitiveOpportunity": 50,
      "freshness": 90,
      "rationale": "Strong location fit and good evidence quality..."
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
      return fallbackScore(now, 'Model returned empty response');
    }

    const parsed = extractJsonFromText(response.text);
    if (!parsed) {
      return fallbackScore(now, 'Could not parse model response');
    }

    return {
      overall: clampScore(parsed.overall),
      locationFit: clampScore(parsed.locationFit),
      productFit: clampScore(parsed.productFit),
      buyerTypeFit: clampScore(parsed.buyerTypeFit),
      companySizeFit: clampScore(parsed.companySizeFit),
      evidenceQuality: clampScore(parsed.evidenceQuality),
      socialActivity: clampScore(parsed.socialActivity),
      contactability: clampScore(parsed.contactability),
      competitiveOpportunity: clampScore(parsed.competitiveOpportunity),
      freshness: clampScore(parsed.freshness),
      rationale: parsed.rationale || 'Score generated from available data.',
      updatedAt: now,
    };

  } catch (error) {
    console.error(`[LeadScoring] Error for ${lead.companyName}:`, error);
    return fallbackScore(now, `Scoring error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

function clampScore(value: unknown): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  return 50;
}

function fallbackScore(now: number, rationale: string): LeadScoreBreakdown {
  return {
    overall: 50,
    locationFit: 50,
    productFit: 50,
    buyerTypeFit: 50,
    companySizeFit: 50,
    evidenceQuality: 50,
    socialActivity: 50,
    contactability: 50,
    competitiveOpportunity: 50,
    freshness: 50,
    rationale,
    updatedAt: now,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/scoring/leadScoring.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement AI-powered lead scoring with 10-dimension breakdown"
```

---

### Task 3: Implement score breakdown formatter

**Files:**
- Modify: `server/agent/scoring/scoreBreakdown.ts`

- [ ] **Step 1: Replace the scoreBreakdown.ts stub**

Replace `server/agent/scoring/scoreBreakdown.ts` with:

```ts
// server/agent/scoring/scoreBreakdown.ts
// Phase 4 — Score breakdown formatting and utility functions.

import type { LeadScoreBreakdown } from '../types.js';

const DIMENSION_LABELS: Record<keyof LeadScoreBreakdown, string> = {
  overall: 'Overall',
  locationFit: 'Location Fit',
  productFit: 'Product Fit',
  buyerTypeFit: 'Buyer Type',
  companySizeFit: 'Company Size',
  evidenceQuality: 'Evidence Quality',
  socialActivity: 'Social Activity',
  contactability: 'Contactability',
  competitiveOpportunity: 'Competitive Gap',
  freshness: 'Freshness',
  rationale: 'Rationale',
  updatedAt: 'Updated',
};

export function formatScoreBreakdown(score: LeadScoreBreakdown): string {
  const lines: string[] = [];
  const dims: (keyof LeadScoreBreakdown)[] = [
    'overall', 'locationFit', 'productFit', 'buyerTypeFit', 'companySizeFit',
    'evidenceQuality', 'socialActivity', 'contactability', 'competitiveOpportunity', 'freshness'
  ];

  for (const dim of dims) {
    const value = score[dim] as number;
    const bar = scoreBar(value);
    const label = DIMENSION_LABELS[dim];
    lines.push(`${label.padEnd(22)} ${bar} ${value}/100`);
  }

  if (score.rationale) {
    lines.push('');
    lines.push(`Rationale: ${score.rationale}`);
  }

  return lines.join('\n');
}

export function scoreBar(value: number, width: number = 10): string {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function scoreColor(value: number): string {
  if (value >= 80) return '#34d399'; // emerald-400
  if (value >= 60) return '#fbbf24'; // amber-400
  if (value >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

export function getScoreLabel(value: number): string {
  if (value >= 80) return 'Strong';
  if (value >= 60) return 'Good';
  if (value >= 40) return 'Fair';
  return 'Weak';
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add server/agent/scoring/scoreBreakdown.ts
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: implement score breakdown formatter and color utilities"
```

---

### Task 4: Add verification and scoring display to Dossier tab

**Files:**
- Modify: `components/InteractionViewer.tsx`

- [ ] **Step 1: Add imports for verification and scoring services**

Add to the existing imports (after the social discovery import on line 7):

```tsx
import { verifyLead } from '../services/agent/verificationService';
import { scoreLead } from '../services/agent/leadScoringService';
import type { LeadVerification, LeadScoreBreakdown } from '../types/evidenceTypes';
```

- [ ] **Step 2: Add state for verification and scoring loading**

Add after the existing state declarations (after `socialDiscoveryError` on line ~21):

```tsx
const [isVerifying, setIsVerifying] = useState(false);
const [isScoring, setIsScoring] = useState(false);
```

- [ ] **Step 3: Add verification and scoring sections to Dossier tab**

Find the Social Presence section in the Dossier tab (around line 510, right after the closing `</div>` of the social discovery area). Add these two new sections BEFORE the closing `</div>` that ends the Dossier content:

```tsx
                        {/* Verification Status — Phase 4 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Verification</h4>
                            <button
                              onClick={async () => {
                                if (!onUpdateLead || isVerifying) return;
                                setIsVerifying(true);
                                try {
                                  const verification = await verifyLead(lead, productContext as any);
                                  onUpdateLead({
                                    ...lead,
                                    verification,
                                    lastAgentAction: 'verifyLead',
                                  });
                                } catch (e) {
                                  console.error('Verification failed:', e);
                                } finally {
                                  setIsVerifying(false);
                                }
                              }}
                              disabled={isVerifying}
                              className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-600/30 rounded text-[10px] text-purple-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isVerifying ? 'Verifying...' : 'Verify Lead'}
                            </button>
                          </div>

                          {lead.verification ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  lead.verification.status === 'VERIFIED' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' :
                                  lead.verification.status === 'PARTIAL' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' :
                                  lead.verification.status === 'FAILED' ? 'bg-red-900/30 text-red-400 border-red-800/50' :
                                  'bg-slate-800/30 text-slate-400 border-slate-700/30'
                                }`}>
                                  {lead.verification.status}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Confidence: {Math.round(lead.verification.confidence * 100)}%
                                </span>
                              </div>
                              {lead.verification.checks && lead.verification.checks.length > 0 && (
                                <div className="space-y-1">
                                  {lead.verification.checks.map((check, i) => (
                                    <div key={check.id || i} className="flex items-center justify-between p-2 bg-slate-800/40 rounded border border-slate-700/40">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] w-12 text-center px-1 py-0.5 rounded ${
                                          check.status === 'PASS' ? 'bg-emerald-900/20 text-emerald-400' :
                                          check.status === 'FAIL' ? 'bg-red-900/20 text-red-400' :
                                          check.status === 'WARNING' ? 'bg-yellow-900/20 text-yellow-400' :
                                          'bg-slate-700/20 text-slate-500'
                                        }`}>
                                          {check.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{check.type.replace(/_/g, ' ')}</span>
                                      </div>
                                      <span className="text-[9px] text-slate-600">{Math.round(check.confidence * 100)}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600">Not verified yet.</p>
                          )}
                        </div>

                        {/* Lead Scoring — Phase 4 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase">Lead Score</h4>
                            <button
                              onClick={async () => {
                                if (!onUpdateLead || isScoring) return;
                                setIsScoring(true);
                                try {
                                  const scoreBreakdown = await scoreLead(lead, productContext as any);
                                  onUpdateLead({
                                    ...lead,
                                    scoreBreakdown,
                                    lastAgentAction: 'scoreLead',
                                  });
                                } catch (e) {
                                  console.error('Scoring failed:', e);
                                } finally {
                                  setIsScoring(false);
                                }
                              }}
                              disabled={isScoring}
                              className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-600/30 rounded text-[10px] text-amber-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isScoring ? 'Scoring...' : 'Score Lead'}
                            </button>
                          </div>

                          {lead.scoreBreakdown ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-bold" style={{ color: lead.scoreBreakdown.overall >= 80 ? '#34d399' : lead.scoreBreakdown.overall >= 60 ? '#fbbf24' : lead.scoreBreakdown.overall >= 40 ? '#f97316' : '#ef4444' }}>
                                  {lead.scoreBreakdown.overall}/100
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {lead.scoreBreakdown.overall >= 80 ? 'Strong' : lead.scoreBreakdown.overall >= 60 ? 'Good' : lead.scoreBreakdown.overall >= 40 ? 'Fair' : 'Weak'}
                                </span>
                              </div>
                              {([
                                ['locationFit', 'Location'],
                                ['productFit', 'Product Fit'],
                                ['buyerTypeFit', 'Buyer Type'],
                                ['companySizeFit', 'Size'],
                                ['evidenceQuality', 'Evidence'],
                                ['socialActivity', 'Social'],
                                ['contactability', 'Contact'],
                                ['competitiveOpportunity', 'Competition'],
                                ['freshness', 'Freshness'],
                              ] as [string, string][]).map(([key, label]) => {
                                const value = (lead.scoreBreakdown as any)[key] as number;
                                const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : value >= 40 ? '#f97316' : '#ef4444';
                                return (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{label}</span>
                                    <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500 w-6 text-right">{value}</span>
                                  </div>
                                );
                              })}
                              {lead.scoreBreakdown.rationale && (
                                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed border-t border-slate-700/50 pt-2">
                                  {lead.scoreBreakdown.rationale}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-600">Not scored yet.</p>
                          )}
                        </div>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent add components/InteractionViewer.tsx
git -C /home/samu2505/SAAS/tradenexus-ai-sales-agent commit -m "feat: add verification status and lead score display to Dossier tab"
```

---

### Task 5: Integration smoke test

**Files:**
- No files changed — verification only

- [ ] **Step 1: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 2: Start dev server and test**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &
```

Wait for server: `curl -s http://localhost:3000/api/health`

- [ ] **Step 3: Test verification endpoint**

```bash
curl -s -X POST http://localhost:3000/api/agent/verify-lead \
  -H "Content-Type: application/json" \
  -d '{"lead":{"companyName":"Bosch","region":"Germany","website":"https://www.bosch.com","confidenceScore":85},"product":{"name":"Solar Panels"}}'
```

Expected: Returns `{"verification":{"status":"VERIFIED"|"PARTIAL"|"FAILED"|"UNVERIFIED","checks":[...],"confidence":0.X,"updatedAt":...}}`

- [ ] **Step 4: Test scoring endpoint**

```bash
curl -s -X POST http://localhost:3000/api/agent/score-lead \
  -H "Content-Type: application/json" \
  -d '{"lead":{"companyName":"Bosch","region":"Germany","website":"https://www.bosch.com","confidenceScore":85},"product":{"name":"Solar Panels"}}'
```

Expected: Returns `{"score":{"overall":NN,"locationFit":NN,"productFit":NN,...,"rationale":"..."}}`

- [ ] **Step 5: Test existing endpoints still work**

```bash
curl -s http://localhost:3000/api/health
curl -s -X POST http://localhost:3000/api/agent/social-discovery/company -H "Content-Type: application/json" -d '{"companyName":"TestCorp","region":"US"}'
```

Expected: Health returns `{"ok":true}`, social discovery returns profiles.

- [ ] **Step 6: Stop dev server**

```bash
kill $(lsof -ti:3000) 2>/dev/null
```

---

## Self-Review

1. **Spec coverage:** Phase 4 requirements from design spec:
   - "Migrate verifyLead logic into verification/leadVerification.ts" → Task 1
   - "Implement scoring/leadScoring.ts with score breakdown" → Task 2
   - "Deprecate old /api/ai/verify-lead" → Kept for backward compat, new route at /api/agent/verify-lead
   - "Add Dashboard sort/filter UI" → Deferred to Phase 4b (Dashboard is 420 lines, adding sort/filter would bloat this plan)
   - "Update Dossier tab with verification status and score breakdown" → Task 4

2. **Placeholder scan:** No TBDs, TODOs. All code is exact. Helper functions (clampScore, fallbackScore) are fully implemented.

3. **Type consistency:**
   - `verifyLead` returns `LeadVerification` — matches the stub signature and route handler
   - `scoreLead` returns `LeadScoreBreakdown` — matches the stub signature and route handler
   - `formatScoreBreakdown` returns `string` — matches stub
   - New exports `scoreBar`, `scoreColor`, `getScoreLabel` are additional utilities
   - UI uses `lead.verification?.checks`, `lead.verification?.status`, `lead.scoreBreakdown?.overall` — all match the types defined in evidenceTypes.ts
