// server/agent/discovery/socialDiscovery.ts
// Phase 2 — Social media discovery for known companies using Gemini + Google Search.

import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { SocialProfileEvidence, SocialPlatform, SocialProfileType, SocialActivityLevel, StrategicContext, EvidenceSourceType } from '../types.js';
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
