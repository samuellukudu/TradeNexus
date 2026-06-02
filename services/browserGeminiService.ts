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
import { ProductRole, ProductApplication, CountryApplicationMap, ApplicationSourceType, LaneQualificationReport, LeadQualificationResult, LeadQualification } from "../types/applicationTypes";

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
        ${lead.application ? `Application: ${lead.application}` : ""}
        ${lead.buyerType ? `Buyer type: ${lead.buyerType}` : ""}
        ${lead.searchLane ? `Discovered via: ${lead.searchLane}` : ""}
        Keep responses concise, professional, specific, and actionable.
        ${lead.application ? `Tailor the outreach to the lead's application context (${lead.application}). Focus on operational pain points relevant to their industry, not generic product features.` : ""}
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
  supplierCountry?: string,
  productRole?: ProductRole
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
        ? [{ text: marketPrompt(productName, productDescription, supplierCountry, focus, productRole) }]
        : buildPartsWithAssets(marketPrompt(productName, productDescription, supplierCountry, focus, productRole), productAssets)
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

const marketPrompt = (productName: string, productDescription: string, supplierCountry = "China", focus: string, productRole?: ProductRole) => {
  const roleBlock = productRole ? `
Product role: ${productRole.role}.${productRole.operatorTypes.length ? ` Typically operated by ${productRole.operatorTypes.join(", ")}.` : ""}
` : "";

  return `
  I am a supplier in ${supplierCountry} selling "${productName}".
  Product details: ${productDescription || productName}
  ${roleBlock}
  ${focus}
  Identify exactly 9 high-potential export markets.
  Return only JSON: [{ "region": "...", "reason": "...", "demandLevel": "High|Medium|Low" }].
`;
};

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
          Search for real companies with physical presence or service area in the target region.
          Treat social profiles as possible source leads, not only enrichment. Search Facebook business pages,
          Instagram shops, LinkedIn company pages, TikTok demos, WhatsApp contact mentions, Google Maps, and
          local marketplace/directory posts directly. A website is helpful but not required when social evidence
          shows clear company identity, location/service area, category fit, contact/location hints, and activity
          or secondary verification.
          Generate social-first queries such as:
          site:facebook.com "${product.name}" "${product.targetRegion || ""}" "WhatsApp";
          site:instagram.com "${product.name}" "${product.targetRegion || ""}" "supplier";
          site:linkedin.com/company "${product.name}" "${product.targetRegion || ""}";
          site:tiktok.com "${product.name}" "${product.targetRegion || ""}" "installer".
          Return only JSON array. Each item: companyName, website, reason, confidenceScore, sourceUrl, googleMapsUrl,
          country, socialProfiles, employeeCount, revenue, contactEmail, phoneNumber, address, tradeVolume,
          manufacturingVolume, matchDetails, competitors, socialDiscovery, socialOrigin.
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
    socialDiscovery: Array.isArray(lead.socialDiscovery) ? lead.socialDiscovery.map((e: any) => ({
      id: e.id || uuidv4(),
      sourceType: e.platform || "other",
      url: e.url || "",
      title: e.title || e.companyName || lead.companyName || "Social profile",
      snippet: e.snippet || e.relevanceNotes,
      confidence: typeof e.confidence === "number" ? e.confidence : normalizeScore(lead.confidenceScore) / 100,
      foundAt: Date.now(),
      foundBy: "browserLeadSearch",
      validationStatus: "UNVERIFIED",
      platform: e.platform || "other",
      handle: e.handle,
      companyName: e.companyName || lead.companyName,
      country: e.country || lead.country,
      city: e.city,
      sourceQuery: e.sourceQuery,
      isOfficialLikely: Boolean(e.isOfficialLikely),
      profileType: e.profileType || "unknown",
      activityLevel: e.activityLevel || "UNKNOWN",
      activityEvidence: e.activityEvidence,
      contactHints: Array.isArray(e.contactHints) ? e.contactHints : [],
      productFitSignals: Array.isArray(e.productFitSignals) ? e.productFitSignals : [],
      verificationSignals: Array.isArray(e.verificationSignals) ? e.verificationSignals : [],
      badFitSignals: Array.isArray(e.badFitSignals) ? e.badFitSignals : [],
      relevanceNotes: e.relevanceNotes,
    })) : [],
    socialOrigin: lead.socialOrigin?.originType === "social-first" ? {
      originType: "social-first",
      primaryProfileUrl: lead.socialOrigin.primaryProfileUrl || lead.socialDiscovery?.[0]?.url || lead.socialProfiles?.[0]?.url || "",
      primaryPlatform: lead.socialOrigin.primaryPlatform || lead.socialDiscovery?.[0]?.platform || lead.socialProfiles?.[0]?.platform || "other",
      evidence: Array.isArray(lead.socialDiscovery) ? lead.socialDiscovery : [],
      verificationStatus: lead.socialOrigin.verificationStatus || (lead.googleMapsUrl ? "partially_verified" : "unverified"),
    } : undefined,
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

/**
 * POST-DISCOVERY QUALIFICATION
 * Screens a batch of discovered leads against the application's qualification signals
 * and bad-fit signals. Runs as a single lightweight LLM call (no Google Search).
 * Returns a per-lead qualification with matched/triggered signals and reasoning.
 */
export const qualifyLeadsForApplication = async (
  leads: Lead[],
  application: ProductApplication,
  productName: string
): Promise<LaneQualificationReport> => {
  if (leads.length === 0) {
    return {
      applicationId: application.id,
      applicationName: application.name,
      totalDiscovered: 0,
      qualified: 0,
      rejected: 0,
      uncertain: 0,
      qualifications: [],
    };
  }

  const ai = getAiClient();

  // Build a compact lead list for the prompt
  const leadList = leads.map((l, i) =>
    `${i + 1}. ${l.companyName} | ${l.website || "no website"} | ${l.summary || ""} | confidence: ${l.confidenceScore}`
  ).join("\n");

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: {
      parts: [{
        text: `
          You are a lead qualification auditor. Your job is to SCREEN a batch of discovered leads against a specific application profile.

          APPLICATION: ${application.name}
          COUNTRY: ${application.country}
          PRODUCT: ${productName}

          ═══════════════════════════════════
          QUALIFICATION SIGNALS — a lead SHOULD match several of these:
          ${application.qualificationSignals.map(s => `• ${s}`).join("\n")}

          ═══════════════════════════════════
          BAD-FIT SIGNALS — a lead matching ANY of these should be REJECTED:
          ${application.badFitSignals.map(s => `• ${s}`).join("\n")}

          ═══════════════════════════════════
          DISCOVERED LEADS TO SCREEN:
          ${leadList}

          ═══════════════════════════════════
          For EACH lead above, determine:
          - "qualified" — matches 2+ qualification signals AND triggers ZERO bad-fit signals
          - "rejected" — triggers ANY bad-fit signal OR matches zero qualification signals
          - "uncertain" — matches only 1 qualification signal with no bad-fit triggers, or insufficient information to decide

          Return ONLY a JSON object:
          {
            "qualifications": [
              {
                "leadIndex": 1,
                "result": "qualified",
                "matchedSignals": ["signal text..."],
                "triggeredBadFitSignals": [],
                "reasoning": "one sentence why"
              }
            ]
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
          qualifications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                leadIndex: { type: Type.NUMBER },
                result: { type: Type.STRING, enum: ["qualified", "rejected", "uncertain"] },
                matchedSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
                triggeredBadFitSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
                reasoning: { type: Type.STRING },
              },
              required: ["leadIndex", "result", "reasoning"]
            }
          }
        },
        required: ["qualifications"]
      }
    }
  });

  const parsed = extractJsonFromText(response.text) || {};
  const rawQualifications = Array.isArray(parsed.qualifications) ? parsed.qualifications : [];

  const qualifications: LeadQualification[] = rawQualifications.map((q: any) => {
    const idx = (q.leadIndex || 1) - 1;
    const lead = leads[idx];
    return {
      leadId: lead?.id || "",
      companyName: lead?.companyName || "Unknown",
      result: (q.result as LeadQualificationResult) || "uncertain",
      matchedSignals: Array.isArray(q.matchedSignals) ? q.matchedSignals : [],
      triggeredBadFitSignals: Array.isArray(q.triggeredBadFitSignals) ? q.triggeredBadFitSignals : [],
      reasoning: q.reasoning || "",
    };
  });

  const qualified = qualifications.filter(q => q.result === "qualified").length;
  const rejected = qualifications.filter(q => q.result === "rejected").length;
  const uncertain = qualifications.filter(q => q.result === "uncertain").length;

  return {
    applicationId: application.id,
    applicationName: application.name,
    totalDiscovered: leads.length,
    qualified,
    rejected,
    uncertain,
    qualifications,
  };
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
          role: {
            type: Type.STRING,
            enum: [
              "finished system",
              "machine or equipment",
              "component",
              "consumable",
              "raw material",
              "spare part",
              "installation or service",
              "software-enabled system"
            ]
          },
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

export const generateApplicationMap = async (
  product: ProductDetails,
  country: string,
  productRole: ProductRole,
  context?: StrategicContext,
  pastMaps?: CountryApplicationMap[],
  supplierCountry?: string
): Promise<CountryApplicationMap> => {
  const ai = getAiClient();
  const pastMapsContext = pastMaps?.length
    ? `Past application maps for reference (use as inspiration only — do NOT copy; generate fresh applications from current product+country):\n${JSON.stringify(pastMaps.slice(-5))}`
    : "No past application maps available. Generate all applications from scratch.";

  // Build audience-aware directive for application map generation
  const audienceDirective = (() => {
    switch (product.targetAudience) {
      case 'Distributors/Importers':
        return `Focus on companies in ${country} that IMPORT, DISTRIBUTE, WHOLESALE, or RETAIL this product. Look for trading companies, importers, distributors, dealers, retailers, wholesalers, and channel partners who buy from foreign suppliers to resell locally. Each application should describe a distribution or retail context where this product would be stocked, resold, or re-distributed in ${country}.`;
      case 'OEMs/Manufacturers':
        return `Focus on companies in ${country} that INCORPORATE this product as a component, input, or production asset into their own manufacturing or assembly. Look for OEMs, factories, and manufacturers that need this product for their production, assembly lines, or value-added processing. Each application should describe a manufacturing context where this product is an essential input.`;
      case 'End Users':
        return `Focus on companies in ${country} that directly USE or OPERATE this product in their business operations. Each application must describe a real operational context where companies USE this product (not resell it).`;
      case 'All':
      default:
        return `Include ALL viable buyer types in ${country} — end users who operate the product, distributors and importers who resell it, OEMs and manufacturers who incorporate it, retailers and wholesalers who stock it, and channel partners who specify or finance it. Generate a diverse mix of applications covering different buyer categories (resellers, end users, manufacturers). Ensure at least some applications target distribution and retail channels and some target operational end users.`;
    }
  })();

  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents: {
      parts: [{
        text: `
          You are an international trade analyst specializing in product-market decomposition.

          Product: ${product.name}
          Description: ${product.description || product.name}
          Supplier country: ${supplierCountry || product.supplierCountry || "China"}
          Target country: ${country}
          Product role: ${JSON.stringify(productRole)}
          Target audience strategy: ${product.targetAudience || "All"}
          ${context ? `Strategic context: ${JSON.stringify(context)}` : ""}

          ${pastMapsContext}

          Use Google Search to research ${country}'s industries, infrastructure gaps, economic conditions, climate, regulations, and regional clusters relevant to this product.

          Generate a country-specific application map. ${audienceDirective}

          For each application, provide:
          - name: specific application context (e.g. "commercial irrigation farms")
          - buyerTypes: specific company types operating in this context
          - whyRelevant: why this product matters for this application in ${country}
          - procurementTriggers: events that drive purchase decisions
          - searchTerms: 3 actual Google search queries to find these companies in ${country}
          - socialSearchTerms: 3 actual social-first queries for Facebook, Instagram, LinkedIn, TikTok, WhatsApp, Maps, or local marketplace surfaces
          - qualificationSignals: what confirms a company is a real fit
          - badFitSignals: what indicates a company is NOT a fit
          - decisionMakers: job titles/roles who make purchasing decisions
          - confidence: 0-1 how confident you are this application is real for ${country}
          - sourceType: "discovered" (or "adapted" if inspired by a past map)

          Then compute a priorityScore (0-1) for each application considering:
          - demand likelihood in ${country}
          - urgency of need
          - purchasing power of buyer types
          - import dependency (higher = more likely to import)
          - ease of finding these companies online
          - fit with supplier capability

          Generate at least 3 distinct applications, and at most 10. Focus on the most relevant ones. If you cannot find enough evidence for at least 3 applications, include lower-confidence ones with appropriate confidence scores.

          Return only a valid JSON object with this exact shape:
          {
            "applications": [
              {
                "name": "...",
                "buyerTypes": [...],
                "whyRelevant": "...",
                "procurementTriggers": [...],
                "searchTerms": [...],
                "socialSearchTerms": [...],
                "qualificationSignals": [...],
                "badFitSignals": [...],
                "decisionMakers": [...],
                "confidence": 0.9,
                "priorityScore": 0.92,
                "sourceType": "discovered"
              }
            ]
          }
        `
      }]
    },
    config: {
      ...buildThinkingConfig(GROUNDING_MODEL),
      tools: [{ googleSearch: {} }]
    }
  });

  const parsed = extractJsonFromText(response.text) || {};
  const rawApps = Array.isArray(parsed.applications) ? parsed.applications : [];
  const evidence = [...new Set(
    (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .map((chunk: any) => chunk.web?.uri)
      .filter(Boolean)
  )];

  const applications: ProductApplication[] = rawApps
    .map((app: any) => ({
      id: uuidv4(),
      name: app.name || "Unknown Application",
      country: country,
      buyerTypes: Array.isArray(app.buyerTypes) ? app.buyerTypes : [],
      whyRelevant: app.whyRelevant || "",
      procurementTriggers: Array.isArray(app.procurementTriggers) ? app.procurementTriggers : [],
      searchTerms: Array.isArray(app.searchTerms) ? app.searchTerms : [],
      socialSearchTerms: Array.isArray(app.socialSearchTerms) ? app.socialSearchTerms : [],
      qualificationSignals: Array.isArray(app.qualificationSignals) ? app.qualificationSignals : [],
      badFitSignals: Array.isArray(app.badFitSignals) ? app.badFitSignals : [],
      decisionMakers: Array.isArray(app.decisionMakers) ? app.decisionMakers : [],
      priorityScore: typeof app.priorityScore === "number" ? Math.max(0, Math.min(1, app.priorityScore)) : 0.5,
      confidence: typeof app.confidence === "number" ? Math.max(0, Math.min(1, app.confidence)) : 0.5,
      sourceType: (app.sourceType as ApplicationSourceType) || "discovered",
      evidence: evidence.length > 0 ? evidence : undefined
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    productName: product.name || product.description || "Unspecified Product",
    country,
    productRole,
    applications,
    generatedAt: Date.now()
  };
};

export const allocateLeadBudget = (
  applications: ProductApplication[],
  totalBudget: number
): Record<string, number> => {
  const budget: Record<string, number> = {};
  const totalScore = applications.reduce((sum, a) => sum + a.priorityScore, 0);
  if (totalScore === 0 || applications.length === 0) return budget;

  const minPerLane = totalBudget >= applications.length ? 1 : 0;
  let remaining = totalBudget;

  const fracs: { id: string; frac: number }[] = [];
  for (const app of applications) {
    const raw = (totalBudget * app.priorityScore) / totalScore;
    const alloc = Math.max(minPerLane, Math.floor(raw));
    budget[app.id] = alloc;
    remaining -= alloc;
    fracs.push({ id: app.id, frac: raw - alloc });
  }

  // If minPerLane pushed us over budget, trim from lowest-priority apps
  if (remaining < 0) {
    let overflow = -remaining;
    // Walk applications in reverse (lowest priority first)
    for (let i = applications.length - 1; i >= 0 && overflow > 0; i--) {
      const id = applications[i].id;
      if (budget[id] > 1) {
        budget[id]--;
        overflow--;
      }
    }
    remaining = 0;
  }

  fracs.sort((a, b) => b.frac - a.frac);
  for (const { id } of fracs) {
    if (remaining <= 0) break;
    budget[id]++;
    remaining--;
  }

  return budget;
};

export const searchApplicationLane = async (
  product: ProductDetails,
  application: ProductApplication,
  leadTarget: number
): Promise<Lead[]> => {
  const ai = getAiClient();

  // Build product-role-aware targeting instruction
  const productRole = product.productRole;
  let targetingDirective = "Find companies that OPERATE in this application context.";
  if (productRole) {
    switch (productRole.role) {
      case "component":
      case "raw material":
        targetingDirective = `Find MANUFACTURERS and OEMs that INCORPORATE this ${productRole.role} into their products. Target ${productRole.operatorTypes.join(", ") || "factories and production facilities"}.`;
        break;
      case "finished system":
      case "machine or equipment":
        targetingDirective = `Find END USERS and OPERATORS of this ${productRole.role}. Target ${productRole.operatorTypes.join(", ") || "facilities and operations"} that USE this equipment. Also include ${productRole.resellerTypes.join(", ") || "dealers and distributors"} when they serve as the local purchasing channel.`;
        break;
      case "consumable":
      case "spare part":
        targetingDirective = `Find COMPANIES that CONSUME or REPLACE this ${productRole.role} regularly. Target ${productRole.operatorTypes.join(", ") || "maintenance and operations teams"}. Also include ${productRole.maintainerTypes.join(", ") || "service providers"} who purchase on behalf of end users.`;
        break;
      case "installation or service":
        targetingDirective = `Find PROJECT OWNERS and CONTRACTORS that hire ${productRole.installerTypes.join(", ") || "installation and service providers"}. Also include ${productRole.financierTypes.join(", ") || "project financiers"} who specify and procure these services.`;
        break;
      case "software-enabled system":
        targetingDirective = `Find ORGANIZATIONS that DEPLOY this ${productRole.role}. Target ${productRole.operatorTypes.join(", ") || "IT and operations teams"} who both purchase and operate the system.`;
        break;
      default:
        targetingDirective = `Find companies that OPERATE in this application context. Target ${productRole.operatorTypes.join(", ") || "end users"} and ${productRole.resellerTypes.join(", ") || "channel partners"}.`;
    }
  }

  // Override targeting directive based on user's target audience strategy
  if (product.targetAudience && product.targetAudience !== 'All') {
    const audienceTargeting = (() => {
      switch (product.targetAudience) {
        case 'Distributors/Importers':
          return `Find DISTRIBUTORS, IMPORTERS, WHOLESALERS, DEALERS, RETAILERS, and CHANNEL PARTNERS in this application context. Look for trading companies that buy from foreign suppliers to resell locally. Prioritize companies whose business model is resale and distribution over end use.`;
        case 'OEMs/Manufacturers':
          return `Find OEMs and MANUFACTURERS that incorporate this product into their own production. Look for factories, assembly operations, and industrial producers that use this product as an input or component. Prioritize companies with manufacturing or value-added processing operations.`;
        case 'End Users':
          return `Find END USERS and OPERATORS that directly use this product in their business operations. Look for companies whose operations depend on this type of product. Prioritize companies that consume or operate the product themselves rather than reselling it.`;
        default:
          return targetingDirective;
      }
    })();
    targetingDirective = audienceTargeting;
  }

  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents: {
      parts: [{
        text: `
          You are a B2B lead discovery agent. ${targetingDirective}

          ═══════════════════════════════════════════
          PRODUCT & APPLICATION CONTEXT
          ═══════════════════════════════════════════
          Product: ${product.name}
          Description: ${product.description || product.name}
          Supplier country: ${product.supplierCountry || "China"}
          Target audience strategy: ${product.targetAudience || "All"}
          ${productRole ? `Product role: ${productRole.role} (resold by: ${productRole.resellerTypes.join(", ") || "various"}, installed by: ${productRole.installerTypes.join(", ") || "various"}, operated by: ${productRole.operatorTypes.join(", ") || "various"})` : ""}

          Application: ${application.name}
          Why this matters in ${application.country}: ${application.whyRelevant}
          Procurement triggers: ${application.procurementTriggers.join("; ")}

          ═══════════════════════════════════════════
          🔴 MUST HAVE — reject any company missing these
          ═══════════════════════════════════════════
          ${application.qualificationSignals.map(s => `• ${s}`).join("\n          ")}

          ═══════════════════════════════════════════
          🟡 PREFERRED — rank higher if present
          ═══════════════════════════════════════════
          • Decision makers reachable: ${application.decisionMakers.join(", ")}
          • Active procurement cycle suggested by recent news, expansions, or tender participation
          • Physical operations verifiable via Google Maps, directory listings, or cross-platform profiles
          • Buyer type matches: ${application.buyerTypes.join(", ")}

          ═══════════════════════════════════════════
          🔵 SEARCH STRATEGY — execute in this order
          ═══════════════════════════════════════════
          1. PRIMARY: ${application.searchTerms.join(" | ")}
          2. SOCIAL-FIRST: ${(application.socialSearchTerms || []).join(" | ") || "site:facebook.com \"" + product.name + "\" \"" + application.country + "\"; site:instagram.com \"" + product.name + "\" \"" + application.country + "\"; site:linkedin.com/company \"" + product.name + "\" \"" + application.country + "\""}
          3. MAPS & DIRECTORIES: Google Maps business listings, chambers of commerce, industry association member directories in ${application.country}

          ═══════════════════════════════════════════
          ⛔ AVOID — do NOT include companies that match these
          ═══════════════════════════════════════════
          ${application.badFitSignals.map(s => `• ${s}`).join("\n          ")}

          ═══════════════════════════════════════════
          OUTPUT — up to ${leadTarget} real companies
          ═══════════════════════════════════════════
          Social profiles are valid source leads. A website is NOT required if social evidence shows clear business identity, target-country fit, application fit, contact/location hints, and activity/verification signals.

          Return only a JSON array. Each item:
          {
            "companyName": "...",
            "website": "...",
            "reason": "specific fit to this application, referencing qualification signals",
            "confidenceScore": 85,
            "sourceUrl": "...",
            "googleMapsUrl": "...",
            "country": "${application.country}",
            "socialProfiles": [],
            "socialDiscovery": [
              {
                "platform": "facebook",
                "url": "...",
                "title": "...",
                "companyName": "...",
                "country": "${application.country}",
                "city": "...",
                "profileType": "company",
                "activityLevel": "HIGH",
                "contactHints": ["WhatsApp", "phone"],
                "productFitSignals": ["product photos", "installer language"],
                "verificationSignals": ["Google Maps match", "same phone on directory"],
                "badFitSignals": [],
                "confidence": 0.82,
                "sourceQuery": "site:facebook.com ..."
              }
            ],
            "socialOrigin": { "originType": "social-first", "primaryProfileUrl": "...", "primaryPlatform": "facebook", "verificationStatus": "partially_verified" },
            "employeeCount": "...",
            "revenue": "...",
            "contactEmail": "...",
            "phoneNumber": "...",
            "address": "...",
            "tradeVolume": "...",
            "matchDetails": { "industryFit": "...", "sizeFit": "...", "locationFit": "..." },
            "competitors": []
          }
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
    region: application.country,
    status: LeadStatus.DISCOVERED,
    confidenceScore: normalizeScore(lead.confidenceScore),
    matchDetails: lead.matchDetails,
    summary: lead.reason || `Potential ${application.buyerTypes[0] || "end user"} match via application-led discovery.`,
    socialProfiles: Array.isArray(lead.socialProfiles) ? lead.socialProfiles : [],
    socialDiscovery: Array.isArray(lead.socialDiscovery) ? lead.socialDiscovery.map((e: any) => ({
      id: e.id || uuidv4(),
      sourceType: e.platform || "other",
      url: e.url || "",
      title: e.title || e.companyName || lead.companyName || "Social profile",
      snippet: e.snippet || e.relevanceNotes,
      confidence: typeof e.confidence === "number" ? e.confidence : normalizeScore(lead.confidenceScore) / 100,
      foundAt: Date.now(),
      foundBy: "applicationLaneSearch",
      validationStatus: "UNVERIFIED",
      platform: e.platform || "other",
      handle: e.handle,
      companyName: e.companyName || lead.companyName,
      country: e.country || application.country,
      city: e.city,
      sourceQuery: e.sourceQuery,
      isOfficialLikely: Boolean(e.isOfficialLikely),
      profileType: e.profileType || "unknown",
      activityLevel: e.activityLevel || "UNKNOWN",
      activityEvidence: e.activityEvidence,
      contactHints: Array.isArray(e.contactHints) ? e.contactHints : [],
      productFitSignals: Array.isArray(e.productFitSignals) ? e.productFitSignals : [],
      verificationSignals: Array.isArray(e.verificationSignals) ? e.verificationSignals : [],
      badFitSignals: Array.isArray(e.badFitSignals) ? e.badFitSignals : [],
      relevanceNotes: e.relevanceNotes,
    })) : [],
    socialOrigin: lead.socialOrigin?.originType === "social-first" ? {
      originType: "social-first",
      primaryProfileUrl: lead.socialOrigin.primaryProfileUrl || lead.socialDiscovery?.[0]?.url || lead.socialProfiles?.[0]?.url || "",
      primaryPlatform: lead.socialOrigin.primaryPlatform || lead.socialDiscovery?.[0]?.platform || lead.socialProfiles?.[0]?.platform || "other",
      evidence: Array.isArray(lead.socialDiscovery) ? lead.socialDiscovery : [],
      verificationStatus: lead.socialOrigin.verificationStatus || (lead.googleMapsUrl ? "partially_verified" : "unverified"),
    } : undefined,
    employeeCount: lead.employeeCount,
    revenue: lead.revenue,
    contactEmail: lead.contactEmail,
    phoneNumber: lead.phoneNumber,
    address: lead.address,
    sourceUrl: lead.sourceUrl,
    googleMapsUrl: lead.googleMapsUrl,
    tradeVolume: lead.tradeVolume,
    competitors: Array.isArray(lead.competitors) ? lead.competitors : [],
    // Application context tagging
    applicationId: application.id,
    application: application.name,
    buyerType: application.buyerTypes[0] || undefined,
    searchLane: application.searchTerms[0] || undefined,
    sources: groundingSources,
    logs: [{
      timestamp: new Date().toLocaleTimeString(),
      actor: "SYSTEM",
      message: `Lead discovered via application lane: ${application.name}.${lead.googleMapsUrl ? `\nLocation: ${lead.googleMapsUrl}` : ""}${lead.socialOrigin?.originType === "social-first" ? `\nOrigin: social-first (${lead.socialOrigin.primaryPlatform})` : ""}`
    }]
  }));
};
