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
