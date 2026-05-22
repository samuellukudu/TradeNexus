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
