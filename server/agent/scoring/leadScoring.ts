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
  const isSocialFirst = lead.socialOrigin?.originType === 'social-first' || Boolean(lead.searchVector?.startsWith('Social:'));
  const hasVerification = lead.verification;
  const verificationStatus = lead.verification?.status || 'UNVERIFIED';
  const evidenceCount = lead.evidence?.length || 0;
  const socialCount = lead.socialDiscovery?.length || 0;
  const socialSignals = lead.socialDiscovery?.map(profile => ({
    platform: profile.platform,
    profileType: profile.profileType,
    activityLevel: profile.activityLevel,
    contactHints: profile.contactHints || [],
    productFitSignals: profile.productFitSignals || [],
    verificationSignals: profile.verificationSignals || [],
    badFitSignals: profile.badFitSignals || [],
    confidence: profile.confidence,
  })) || [];

  const prompt = `
    You are a Lead Scoring Specialist. Score this lead across 10 dimensions based on available data.

    LEAD: "${lead.companyName}"
    REGION: ${lead.region}
    WEBSITE: ${lead.website || 'None'}
    CONFIDENCE: ${lead.confidenceScore}/100
    EVIDENCE RECORDS: ${evidenceCount}
    SOCIAL PROFILES: ${socialCount}
    SOCIAL-FIRST ORIGIN: ${isSocialFirst ? 'Yes' : 'No'}
    SOCIAL SIGNALS: ${socialSignals.length ? JSON.stringify(socialSignals) : 'None'}
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
    5. evidenceQuality — How good is the evidence? For social-first leads, count official profile likelihood, platform diversity, source query traceability, contact/location hints, cross-platform/map/website verification, and bad-fit signals.
    6. socialActivity — How active is the company on social media? Use recent posts, product photos, service examples, comments/reviews, and HIGH/MEDIUM/LOW from socialDiscovery.
    7. contactability — Can we contact this company? (email, phone, social DM available?)
    8. competitiveOpportunity — Is there a gap in the market? Are competitors weak in this segment?
    9. freshness — How recently was this lead discovered? (recent = higher score)
    10. overall — Weighted average of above, weighted toward productFit and evidenceQuality. Do not penalize a social-first lead for missing a website when it has clear identity, country/service area, product/application fit, contact/location signals, and reasonable activity or secondary verification.

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
