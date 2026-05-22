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
