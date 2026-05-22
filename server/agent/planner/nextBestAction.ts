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
