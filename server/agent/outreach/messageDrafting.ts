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
    linkedin_followup: `Hi again, following up on my previous message. ${talkingPoints || "I wanted to circle back as I think there's real potential here"}. Happy to share more details about how we've helped similar companies — just let me know if you'd like to chat.`,
    whatsapp_short: `Hi! This is regarding a potential supply partnership with ${lead.companyName}. ${talkingPoints || 'We see a strong fit'}. Would you be open to a quick chat?`,
    tradeshow_intro: `Subject: Great to connect at the show\n\nHi ${lead.companyName} team,\n\nIt was great meeting you. ${talkingPoints || 'I wanted to follow up on our conversation about supply chain opportunities'}.\n\nLet me know if you'd like to continue the discussion.\n\nBest regards`,
    distributor_pitch: `Subject: Distribution Partnership — ${lead.companyName}\n\nDear ${lead.companyName} team,\n\nWe're looking for a distribution partner in ${lead.region} and ${lead.companyName} stands out. ${talkingPoints || "We believe there's a strong mutual opportunity here"}.\n\nOur products offer competitive margins and reliable supply. I'd love to discuss a potential partnership.\n\nBest regards`,
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
