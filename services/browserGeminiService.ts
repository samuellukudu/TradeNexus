import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import {
  ChatMessage,
  Lead,
  LeadStatus,
  MarketReport,
  ProductAsset,
  ProductDetails,
  RegionSuggestion,
  StrategicContext
} from "../types";
import { ProductRole, ProductApplication, CountryApplicationMap } from "../types/applicationTypes";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const DEFAULT_MODEL = (import.meta.env.VITE_GEMINI_DEFAULT_MODEL as string | undefined) || "gemini-2.5-flash";
const GROUNDING_MODEL = (import.meta.env.VITE_GEMINI_GROUNDING_MODEL as string | undefined) || DEFAULT_MODEL;
const THINKING_BUDGET = Number(import.meta.env.VITE_GEMINI_THINKING_BUDGET || 0) || 0;

export const hasBrowserGeminiKey = Boolean(apiKey);

const FALLBACK_CONTEXT: StrategicContext = {
  productIdentity: "Unspecified Product",
  technicalSpecs: [],
  certifications: [],
  idealBuyer: "General Importers",
  exclusions: "None",
  valueProposition: "Standard Quality"
};

const getAiClient = () => {
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not configured for static Firebase Hosting mode.");
  return new GoogleGenAI({ apiKey });
};

const buildThinkingConfig = (model: string) => {
  if (THINKING_BUDGET <= 0) return {};
  if (model.startsWith("gemma-4") || model.startsWith("gemini-3")) {
    return { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } };
  }
  return { thinkingConfig: { thinkingBudget: THINKING_BUDGET } };
};

const extractJsonFromText = (text: string | undefined): any => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]);
    } catch {}
  }

  return null;
};

const buildPartsWithAssets = (promptText: string, assets?: ProductAsset[]) => {
  const parts: any[] = [{ text: promptText }];
  assets?.forEach((asset) => {
    parts.push({
      inlineData: {
        mimeType: asset.mimeType,
        data: asset.data
      }
    });
  });
  return parts;
};

const stringifyReportField = (value: unknown, fallback = "N/A"): string => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyReportField(item, ""))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${formatLabel(key)}: ${stringifyReportField(item, "")}`)
      .filter((line) => !line.endsWith(": "))
      .join("\n");
  }
  return fallback;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => stringifyReportField(item, "")).filter(Boolean);
  }
  return [stringifyReportField(value)].filter(Boolean);
};

const normalizeStats = (stats: any) => ({
  competitorShare: normalizeStatPoints(stats?.competitorShare),
  growthTrend: normalizeStatPoints(stats?.growthTrend),
  userSegments: normalizeStatPoints(stats?.userSegments)
});

const normalizeStatPoints = (items: unknown): { label: string; value: number }[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item: any) => ({
      label: stringifyReportField(item?.label || item?.name || item?.year || "Item"),
      value: normalizeStatValue(item?.value ?? item?.share ?? item?.size ?? item?.percentage)
    }))
    .filter((item) => Number.isFinite(item.value));
};

const normalizeStatValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }
  return NaN;
};

const formatLabel = (key: string) => {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generateProspectingMessage = async (
  history: ChatMessage[],
  lead: Lead,
  productContext?: StrategicContext
): Promise<string> => {
  const ai = getAiClient();
  const context = productContext || FALLBACK_CONTEXT;
  const contents = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents,
    config: {
      ...buildThinkingConfig(GROUNDING_MODEL),
      systemInstruction: `
        You are an expert B2B sales development assistant.
        Lead: ${lead.companyName}, ${lead.region}
        Website: ${lead.website || "N/A"}
        Summary: ${lead.summary || "N/A"}
        Product: ${context.productIdentity}
        Value proposition: ${context.valueProposition}
        Keep responses concise, professional, specific, and actionable.
      `,
      tools: [{ googleSearch: {} }]
    }
  });

  let text = response.text || "I could not generate a response. Please try again.";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = chunks
    .map((chunk: any) => chunk.web?.uri ? `- [${chunk.web.title || "Source"}](${chunk.web.uri})` : null)
    .filter(Boolean)
    .join("\n");
  if (links) text += `\n\n### Sources\n${links}`;
  return text;
};

export const extractSearchStrategyFromAssets = async (product: ProductDetails): Promise<StrategicContext> => {
  if (!product.assets?.length) return { ...FALLBACK_CONTEXT, productIdentity: product.name || FALLBACK_CONTEXT.productIdentity };

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: {
      parts: buildPartsWithAssets(`
        Analyze the attached product documents and return a strategic JSON memory object:
        productIdentity, technicalSpecs, certifications, idealBuyer, exclusions, valueProposition.
      `, product.assets)
    },
    config: {
      ...buildThinkingConfig(DEFAULT_MODEL),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productIdentity: { type: Type.STRING },
          technicalSpecs: { type: Type.ARRAY, items: { type: Type.STRING } },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          idealBuyer: { type: Type.STRING },
          exclusions: { type: Type.STRING },
          valueProposition: { type: Type.STRING }
        },
        required: ["productIdentity", "idealBuyer", "valueProposition"]
      }
    }
  });

  return { ...FALLBACK_CONTEXT, ...(extractJsonFromText(response.text) || {}) };
};

export const analyzeMarkets = async (
  productName: string,
  productDescription: string,
  continent?: string,
  countries?: string[],
  productAssets?: ProductAsset[],
  preComputedContext?: StrategicContext,
  supplierCountry?: string
): Promise<RegionSuggestion[]> => {
  const ai = getAiClient();
  const focus = [
    continent && continent !== "All" ? `Focus on ${continent}.` : "Analyze global opportunities.",
    countries?.length ? `Prioritize these countries: ${countries.join(", ")}.` : "",
    preComputedContext ? `Strategic memory: ${JSON.stringify(preComputedContext)}` : ""
  ].filter(Boolean).join("\n");

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: {
      parts: preComputedContext
        ? [{ text: marketPrompt(productName, productDescription, supplierCountry, focus) }]
        : buildPartsWithAssets(marketPrompt(productName, productDescription, supplierCountry, focus), productAssets)
    },
    config: {
      ...buildThinkingConfig(DEFAULT_MODEL),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING },
            reason: { type: Type.STRING },
            demandLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
          },
          required: ["region", "reason", "demandLevel"]
        }
      }
    }
  });

  const parsed = extractJsonFromText(response.text);
  return Array.isArray(parsed) ? parsed.slice(0, 9) : [];
};

const marketPrompt = (productName: string, productDescription: string, supplierCountry = "China", focus: string) => `
  I am a supplier in ${supplierCountry} selling "${productName}".
  Product details: ${productDescription || productName}
  ${focus}
  Identify exactly 9 high-potential export markets.
  Return only JSON: [{ "region": "...", "reason": "...", "demandLevel": "High|Medium|Low" }].
`;

export const generateMarketReport = async (product: ProductDetails, region: string): Promise<MarketReport> => {
  const ai = getAiClient();
  const context = product.strategicContext
    ? `Strategic memory: ${JSON.stringify(product.strategicContext)}`
    : "";

  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents: {
      parts: [{
        text: `
          Conduct a supplier intelligence report for exporting "${product.name}" from ${product.supplierCountry || "China"} to "${region}".
          Product details: ${product.description || product.name}
          ${context}
          Use search for logistics, duties, compliance, competitors, trade events, and market stats.
          Return only valid JSON with keys: region, overview, marketSize, buyingHabits, competitors, regulations,
          entryStrategy, hsCode, importDuty, shippingTime, priceStructure, tradeShows, localization, stats.
          stats must contain competitorShare, growthTrend, userSegments arrays of {label, value}.
        `
      }]
    },
    config: {
      ...buildThinkingConfig(GROUNDING_MODEL),
      tools: [{ googleSearch: {} }]
    }
  });

  const parsed = extractJsonFromText(response.text) || {};
  const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map((chunk: any) => ({
      title: chunk.web?.title || "Web Source",
      url: chunk.web?.uri
    }))
    .filter((source: any) => source.url)
    .filter((source: any, index: number, all: any[]) => index === all.findIndex((item) => item.url === source.url));

  return {
    region: stringifyReportField(parsed.region, region),
    overview: stringifyReportField(parsed.overview, "No information available."),
    marketSize: stringifyReportField(parsed.marketSize),
    buyingHabits: stringifyReportField(parsed.buyingHabits),
    competitors: normalizeStringArray(parsed.competitors),
    regulations: stringifyReportField(parsed.regulations),
    entryStrategy: stringifyReportField(parsed.entryStrategy),
    hsCode: stringifyReportField(parsed.hsCode),
    importDuty: stringifyReportField(parsed.importDuty),
    shippingTime: stringifyReportField(parsed.shippingTime),
    priceStructure: stringifyReportField(parsed.priceStructure),
    tradeShows: normalizeStringArray(parsed.tradeShows),
    localization: stringifyReportField(parsed.localization),
    sources,
    stats: normalizeStats(parsed.stats)
  };
};

export const searchForLeads = async (product: ProductDetails): Promise<Lead[]> => {
  const ai = getAiClient();
  const targetCount = Math.min(product.targetLeadCount || 20, 20);
  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents: {
      parts: [{
        text: `
          Find up to ${targetCount} B2B buyer, importer, distributor, OEM, or industrial customer leads for "${product.name}"
          in "${product.targetRegion || "global markets"}".
          Supplier country: ${product.supplierCountry || "China"}.
          Product details: ${product.description || product.name}
          Strategic context: ${product.strategicContext ? JSON.stringify(product.strategicContext) : "none"}
          Search for real companies with websites and physical presence in the target region.
          Return only JSON array. Each item: companyName, website, reason, confidenceScore, sourceUrl, googleMapsUrl,
          country, socialProfiles, employeeCount, revenue, contactEmail, phoneNumber, address, tradeVolume,
          manufacturingVolume, matchDetails, competitors.
        `
      }]
    },
    config: {
      ...buildThinkingConfig(GROUNDING_MODEL),
      tools: [{ googleSearch: {} }]
    }
  });

  const parsed = extractJsonFromText(response.text);
  const rawLeads = Array.isArray(parsed) ? parsed : [];
  const groundingSources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map((chunk: any) => chunk.web?.uri)
    .filter(Boolean);

  return rawLeads.map((lead: any) => ({
    id: uuidv4(),
    companyName: lead.companyName || "Unknown Company",
    website: lead.website && String(lead.website).toLowerCase() !== "n/a" ? lead.website : undefined,
    region: product.targetRegion || lead.country || "Unknown",
    status: LeadStatus.DISCOVERED,
    confidenceScore: normalizeScore(lead.confidenceScore),
    matchDetails: lead.matchDetails,
    summary: lead.reason || "Potential match based on market research.",
    socialProfiles: Array.isArray(lead.socialProfiles) ? lead.socialProfiles : [],
    employeeCount: lead.employeeCount,
    revenue: lead.revenue,
    contactEmail: lead.contactEmail,
    phoneNumber: lead.phoneNumber,
    address: lead.address,
    sourceUrl: lead.sourceUrl,
    googleMapsUrl: lead.googleMapsUrl,
    tradeVolume: lead.tradeVolume,
    manufacturingVolume: lead.manufacturingVolume,
    competitors: Array.isArray(lead.competitors) ? lead.competitors : [],
    sources: groundingSources,
    logs: [{
      timestamp: new Date().toLocaleTimeString(),
      actor: "SYSTEM",
      message: `Lead discovered via browser Gemini static mode.${lead.googleMapsUrl ? `\nLocation: ${lead.googleMapsUrl}` : ""}`
    }]
  }));
};

export const verifyLead = async (lead: Lead, product: ProductDetails): Promise<Partial<Lead>> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents: {
      parts: [{
        text: `
          Verify whether "${lead.companyName}" in "${lead.region}" is a legitimate and relevant lead for "${product.name}".
          Website: ${lead.website || "unknown"}
          Address: ${lead.address || "unknown"}
          Return only JSON: verificationStatus ("VERIFIED", "FAILED", "UNVERIFIED"), verificationNotes, confidenceScore.
        `
      }]
    },
    config: {
      ...buildThinkingConfig(GROUNDING_MODEL),
      tools: [{ googleSearch: {} }]
    }
  });

  const parsed = extractJsonFromText(response.text) || {};
  return {
    verificationStatus: parsed.verificationStatus || "UNVERIFIED",
    verificationNotes: parsed.verificationNotes || "Verification completed with limited evidence.",
    confidenceScore: normalizeScore(parsed.confidenceScore)
  };
};

const normalizeScore = (score: unknown) => {
  if (typeof score !== "number") return 85;
  if (score > 0 && score <= 1) return Math.round(score * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const classifyProductRole = async (
  product: ProductDetails,
  context?: StrategicContext
): Promise<ProductRole> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: {
      parts: [{
        text: `
          You are an industrial product classifier for B2B trade.
          Classify this product's role in the supply chain and identify the ecosystem around it.

          Product: ${product.name}
          Description: ${product.description || product.name}
          Supplier country: ${product.supplierCountry || "unknown"}
          ${context ? `Strategic context: ${JSON.stringify(context)}` : ""}

          Return only valid JSON:
          {
            "role": "<one of: finished system, machine or equipment, component, consumable, raw material, spare part, installation or service, software-enabled system>",
            "resellerTypes": ["who resells this product"],
            "installerTypes": ["who installs it"],
            "operatorTypes": ["who operates/uses it"],
            "maintainerTypes": ["who maintains/services it"],
            "financierTypes": ["who finances purchases of it"]
          }
        `
      }]
    },
    config: {
      ...buildThinkingConfig(DEFAULT_MODEL),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          resellerTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          installerTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          operatorTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          maintainerTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          financierTypes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["role"]
      }
    }
  });

  const parsed = extractJsonFromText(response.text) || {};
  return {
    role: parsed.role || "machine or equipment",
    resellerTypes: Array.isArray(parsed.resellerTypes) ? parsed.resellerTypes : [],
    installerTypes: Array.isArray(parsed.installerTypes) ? parsed.installerTypes : [],
    operatorTypes: Array.isArray(parsed.operatorTypes) ? parsed.operatorTypes : [],
    maintainerTypes: Array.isArray(parsed.maintainerTypes) ? parsed.maintainerTypes : [],
    financierTypes: Array.isArray(parsed.financierTypes) ? parsed.financierTypes : []
  };
};
