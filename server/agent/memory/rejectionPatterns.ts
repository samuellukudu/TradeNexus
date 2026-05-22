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
