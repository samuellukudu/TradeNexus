
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { Lead, LeadStatus, ProductDetails, ProductAsset, RegionSuggestion, MarketReport, StrategicContext, ChatMessage } from "../types";
import { v4 as uuidv4 } from 'uuid';

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

      const value = rawValue
        .replace(/^['"]|['"]$/g, "")
        .trim();
      process.env[key] = value;
    }
  }
};

loadLocalEnv();

const getEnv = (key: string, fallback?: string) => {
  return process.env[key] || process.env[`VITE_${key}`] || fallback;
};

// .env is the source of truth for all API keys and model names
const getAiClient = () => {
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const DEFAULT_MODEL = getEnv("GEMINI_DEFAULT_MODEL", "gemma-4-31b-it") || "gemma-4-31b-it";
const GROUNDING_MODEL = getEnv("GEMINI_GROUNDING_MODEL", "gemma-4-31b-it") || "gemma-4-31b-it";
const THINKING_BUDGET = parseInt(getEnv("GEMINI_THINKING_BUDGET", "0") || "0") || 0;

console.log("[GeminiService] Initialized with Models:");
console.log(`- Default Model: ${DEFAULT_MODEL}`);
console.log(`- Grounding Model: ${GROUNDING_MODEL}`);
console.log(`- Thinking Budget: ${THINKING_BUDGET || "disabled"}`);

// Different model families require different thinking config formats:
// - Gemma 4: thinkingLevel ("high" | "low" | "medium" | "minimal")
// - Gemini 3: thinkingLevel ("high" | "low" | "medium" | "minimal")
// - Gemini 2.5: thinkingBudget (0=off, -1=dynamic, N=token budget)
const buildThinkingConfig = (model: string) => {
  if (THINKING_BUDGET <= 0) return {};
  if (model.startsWith('gemma-4')) {
    return { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } };
  }
  if (model.startsWith('gemini-3')) {
    return { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } };
  }
  return { thinkingConfig: { thinkingBudget: THINKING_BUDGET } };
};

// Gemini API doesn't support tools + responseMimeType together.
// When using Google Search, we must parse JSON from the text response manually.
const extractJsonFromText = (text: string | undefined): any => {
  if (!text) return null;
  // Try direct parse first
  try { return JSON.parse(text); } catch {}
  // Try extracting from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  // Try finding JSON object or array boundaries
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch {}
  }
  console.error("[ExtractJson] Failed to parse JSON from:", text.substring(0, 500));
  return null;
};

const FALLBACK_CONTEXT: StrategicContext = {
    productIdentity: "Unspecified Product",
    technicalSpecs: [],
    certifications: [],
    idealBuyer: "General Importers",
    exclusions: "None",
    valueProposition: "Standard Quality"
};

export const generateProspectingMessage = async (
  history: ChatMessage[],
  lead: Lead,
  productContext?: StrategicContext
): Promise<string> => {
  const ai = getAiClient();
  
  const context = productContext || FALLBACK_CONTEXT;

  const systemInstruction = `
    You are an expert Sales Development Representative (SDR) and Prospecting Assistant.
    Your goal is to help the user (a sales agent) craft the perfect outreach strategy for a specific lead.
    
    LEAD CONTEXT:
    Company: ${lead.companyName}
    Region: ${lead.region}
    Industry Fit: ${lead.matchDetails?.industryFit || 'N/A'}
    Website: ${lead.website || 'N/A'}
    City/Country: ${lead.address || lead.region}
    Summary: ${lead.summary || 'N/A'}
    Current Status: ${lead.status}
    Next Steps / Notes: ${lead.nextSteps || 'None'}
    
    PRODUCT CONTEXT:
    Product: ${context.productIdentity}
    Value Prop: ${context.valueProposition}
    Ideal Buyer: ${context.idealBuyer}
    
    STRATEGIC APPROACH:
    - **Tone**: Confident, professional, and authoritative. Do NOT sound needy or pleading.
    - **Urgency**: Frame the opportunity based on supply and demand. Implication: "We are selecting key partners in ${lead.region} for ${context.productIdentity} distribution, and we are evaluating if ${lead.companyName} is the right fit."
    - **Relevance**: Connect the product's value proposition directly to the lead's business model (e.g., if they are a distributor, focus on margin/volume; if a manufacturer, focus on supply chain efficiency).
    
    TOOLS AVAILABLE:
    - Use Google Search to find recent news, press releases, or specific contact details about the company. Look for "hooks" like recent expansions, new product lines, or leadership changes.
    - Use Google Maps to verify their location or find nearby competitors/distributors if relevant.
    
    YOUR TASKS:
    1. Answer questions about the lead.
    2. Draft email sequences or LinkedIn messages using the "Supply & Demand" urgency frame.
    3. Research the lead's current activities to find "hooks" for outreach.
    4. Advise on the best angle to approach this specific company based on the product context.
    
    Keep responses concise, professional, and actionable.
  `;

  // Convert history to Gemini format
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: GROUNDING_MODEL,
      contents: contents,
      config: {
        ...buildThinkingConfig(GROUNDING_MODEL),
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    let text = response.text || "I couldn't generate a response. Please try again.";

    // Extract and append grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        const links = groundingChunks
            .map((chunk: any) => {
                if (chunk.web?.uri) return `- [${chunk.web.title}](${chunk.web.uri})`;
                if (chunk.maps?.uri) return `- [Google Maps: ${chunk.maps.title}](${chunk.maps.uri})`;
                return null;
            })
            .filter(Boolean)
            .join('\n');
        
        if (links) {
            text += `\n\n### Sources\n${links}`;
        }
    }

    return text;
  } catch (error) {
    console.error("Error generating prospecting message:", error);
    return "I encountered an error while processing your request. Please try again.";
  }
};


// Helper to construct parts with assets
const buildPartsWithAssets = (promptText: string, assets?: ProductAsset[]) => {
    const parts: any[] = [{ text: promptText }];
    if (assets && assets.length > 0) {
        assets.forEach(asset => {
            parts.push({
                inlineData: {
                    mimeType: asset.mimeType,
                    data: asset.data
                }
            });
        });
    }
    return parts;
};



/**
 * DEEP DOCUMENT ANALYSIS -> STRUCTURED MEMORY
 * Extracts a dictionary of strategic data points instead of a text blob.
 */
export const extractSearchStrategyFromAssets = async (product: ProductDetails): Promise<StrategicContext> => {
    if (!product.assets || product.assets.length === 0) return FALLBACK_CONTEXT;

    const ai = getAiClient();
    const prompt = `
        You are a Senior Technical Sales Engineer. 
        I have uploaded product catalogues/spec sheets.
        
        TASK: Perform a deep analysis and extract a STRATEGIC MEMORY OBJECT.
        
        We need structured data to guide our search agents.
        
        EXTRACT THE FOLLOWING INTO JSON:
        1. productIdentity: A concise 3-5 word name (e.g. "Lithium Iron Phosphate Battery Cell 280Ah").
        2. technicalSpecs: Array of top 5 critical specs (e.g. "Cycle life > 6000", "IP67 Rated").
        3. certifications: Array of ALL compliance codes found (UL, CE, IEC, UN38.3).
        4. idealBuyer: A specific description of the perfect B2B customer.
        5. exclusions: Negative constraints. Who should we NOT contact? (e.g. "Do not contact retailers", "No residential inquiries").
        6. valueProposition: One powerful sentence on why this product wins.
    `;

    const parts = buildPartsWithAssets(prompt, product.assets);

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: { parts: parts },
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
                    required: ["productIdentity", "idealBuyer", "certifications"]
                }
            }
        });
        
        if (!response.text) {
            console.error("[ExtractStrategy] Empty response from model");
            return FALLBACK_CONTEXT;
        }
        return JSON.parse(response.text) as StrategicContext;

    } catch (e) {
        console.error("Asset analysis failed:", e);
        return { ...FALLBACK_CONTEXT, productIdentity: product.name };
    }
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

  let targetingContext = "Analyze global trade data and trends.";
  if (continent && continent !== 'All') {
    targetingContext += ` Focus strictly on markets within the continent of ${continent}.`;
  }
  if (countries && countries.length > 0) {
    targetingContext += ` Prioritize analysis for these specific countries: ${countries.join(', ')}. If these are valid markets, include them. Fill remaining slots with high-potential neighbors or related markets to reach exactly 9 suggestions.`;
  }

  // OPTIMIZATION: Retrieve specific memory keys to augment input query
  const hasContext = !!preComputedContext;
  let contextInjection = "";
  
  if (hasContext && preComputedContext) {
      contextInjection = `
      MEMORY RETRIEVAL:
      - Product Core: ${preComputedContext.productIdentity}
      - Key Certifications: ${preComputedContext.certifications.join(", ")} (Ensure target markets accept these)
      - Specs: ${preComputedContext.technicalSpecs.join(", ")}
      `;
  }
  
  const prompt = `
    I am a supplier in ${supplierCountry || "China"} selling: "${productName}".
    
    PRODUCT SPECIFICATIONS:
    "${productDescription || "Standard " + productName}"

    ${contextInjection}
    
    ${!hasContext && productAssets && productAssets.length > 0 ? 'CRITICAL INSTRUCTION: Read attached docs for priority markets and specs.' : ''}
    
    ${targetingContext}
    
    Task: Identify the top 9 best international regions/countries to target for exporting this product from ${supplierCountry || "China"}.
    
    Analysis Instructions:
    1. Align suggestions with the certifications and specs retrieved from memory.
    2. Consider import tariffs, shipping logistics, and market size based on the origin country.
    
    Return a JSON array of 9 suggestions.
    Ensure 'reason' is specific to the product details provided.
  `;

  // Only send assets if we don't have the text summary yet
  const parts = hasContext ? [{ text: prompt }] : buildPartsWithAssets(prompt, productAssets);

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts: parts },
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
              demandLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
            }
          }
        }
      }
    });
    
    if (!response.text) {
      console.error("[AnalyzeMarkets] Empty response from model");
      throw new Error("Model returned empty response for market analysis");
    }
    const parsed = JSON.parse(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error analyzing markets:", error);
    return [
      { region: "United States", reason: "High consumer demand fallback.", demandLevel: "High" },
      { region: "Germany", reason: "Strong industrial base fallback.", demandLevel: "Medium" },
      { region: "Australia", reason: "Proximity fallback.", demandLevel: "Medium" }
    ];
  }
};

export const generateMarketReport = async (product: ProductDetails, region: string): Promise<MarketReport> => {
  const ai = getAiClient();
  
  // Retrieve relevant context keys for Market Reports
  const context = product.strategicContext;
  const contextString = context 
    ? `Product: ${context.productIdentity}. Specs: ${context.technicalSpecs.join(', ')}. Certs: ${context.certifications.join(', ')}.`
    : "";

  const prompt = `
    Conduct a PROFESSIONAL SUPPLIER INTELLIGENCE REPORT for exporting "${product.name}" from ${product.supplierCountry || "China"} to "${region}".

    Product Details: ${product.description || product.name}
    ${contextString ? `Technical Memory: ${contextString}` : ''}

    TARGET AUDIENCE: International Exporter.
    OUTPUT LANGUAGE: English.

    Task: Use Google Search to find specific logistics, pricing, and compliance data.
    CRITICAL: You MUST prioritize searching Official Government Websites (Ministries of Commerce, Customs, Trade Organizations) for accurate duty and regulation data.

    Required Sections & QUANTITATIVE DATA:
    1. Market Overview: Demand summary.
    2. HS Code Strategy: Identify the most likely HS Code (Harmonized System).
    3. Logistics & Duties:
       - Estimated Import Duty rate (%) for goods from ${product.supplierCountry || "China"} entering ${region}. Check official tariff schedules.
       - Average Ocean Freight time (days) from major ${product.supplierCountry || "China"} ports.
    4. Price Structure: Estimate the markup chain (e.g., Factory -> Landed -> Retail).
    5. Localization: What needs to change? (Voltage, Plugs, Packaging languages, Sizing standards).
    6. Key Competitors: 3-5 brands.
    7. Trade Events: Name 3 major trade shows/expos in ${region} relevant to this industry. Include the City and Month (e.g. "Expo Name (City, Month)").
    8. Entry Strategy: Best channel (Direct vs Distributor).
    9. STATISTICAL DATA (Required for Charts):
       - Competitor Market Share: Estimate top 3-5 competitors and their approximate share %.
       - Growth Trend: Projected YoY growth rate (%) or Market Size ($M) for the next 3-5 years (e.g. 2025-2029).
       - User Segmentation: Approximate breakdown of end-users (e.g., "Industrial 40%", "Residential 30%", etc.).

    You MUST return ONLY a valid JSON object with these exact keys: region, overview, marketSize, buyingHabits, competitors (string array), regulations, entryStrategy, hsCode, importDuty, shippingTime, priceStructure, tradeShows (string array), localization, stats.
    stats must contain: competitorShare (array of {label, value}), growthTrend (array of {label, value}), userSegments (array of {label, value}).
    Do NOT wrap the JSON in markdown code blocks. Return raw JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        ...buildThinkingConfig(DEFAULT_MODEL),
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      console.error("[MarketReport] Empty response from model. Full response:", JSON.stringify(response, null, 2));
      throw new Error(`Model returned empty response for market report on ${region}`);
    }
    const parsed = extractJsonFromText(response.text);
    if (!parsed) {
      throw new Error(`Failed to parse JSON from model response for market report on ${region}`);
    }
    
    // Extract grounding sources from the response metadata
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Web Source",
        url: chunk.web?.uri
    })).filter((s: any) => s.url) || [];

    const uniqueSources = sources.filter((s: any, index: number, self: any[]) => 
        index === self.findIndex((t) => t.url === s.url)
    );
    
    return {
        region: parsed.region || region,
        overview: parsed.overview || "No information available.",
        marketSize: parsed.marketSize || "N/A",
        buyingHabits: parsed.buyingHabits || "N/A",
        competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
        regulations: parsed.regulations || "N/A",
        entryStrategy: parsed.entryStrategy || "N/A",
        hsCode: parsed.hsCode || "N/A",
        importDuty: parsed.importDuty || "N/A",
        shippingTime: parsed.shippingTime || "N/A",
        priceStructure: typeof parsed.priceStructure === 'object'
          ? Object.entries(parsed.priceStructure).map(([k, v]) => `${k}: ${v}`).join('\n')
          : (parsed.priceStructure || "N/A"),
        tradeShows: Array.isArray(parsed.tradeShows) ? parsed.tradeShows : [],
        localization: parsed.localization || "N/A",
        sources: uniqueSources,
        stats: parsed.stats || { competitorShare: [], growthTrend: [], userSegments: [] }
    };

  } catch (error) {
    console.error(`[MarketReport] Failed for ${region}:`, error);
    return {
        region: region,
        overview: "Analysis failed due to a temporary error. Please try again.",
        marketSize: "N/A",
        buyingHabits: "N/A",
        competitors: [],
        regulations: "N/A",
        entryStrategy: "N/A",
        hsCode: "N/A",
        importDuty: "N/A",
        shippingTime: "N/A",
        priceStructure: "N/A",
        tradeShows: [],
        localization: "N/A",
        sources: []
    };
  }
};

/**
 * 1. IDENTIFY KEY CITIES
 * Asks AI to list top 12 hubs/cities in the region for this product.
 */
const identifyStrategicHubs = async (product: ProductDetails): Promise<string[]> => {
    const ai = getAiClient();
    const prompt = `
        I am analyzing the export market for "${product.name}" in "${product.targetRegion}".
        
        Task: Identify the top 12 most important industrial hubs, cities, or trade zones in "${product.targetRegion}" specifically relevant to this product category.
        
        Rules:
        1. If "${product.targetRegion}" is a Continent (e.g. Europe, Asia), list the top 12 COUNTRIES.
        2. If "${product.targetRegion}" is a Country (e.g. Germany, USA), list the top 12 CITIES or Industrial Regions.
        3. If "${product.targetRegion}" is "All" or "Global", list the top 12 Global Trade Hubs (Countries) for this product.
        4. Prioritize locations with ports, industrial parks, or high consumption of ${product.name}.
        
        Return ONLY a JSON array of strings. Example: ["City A", "City B", "Region C", ...]
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {
                ...buildThinkingConfig(DEFAULT_MODEL),
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        if (!response.text) {
          console.error("[StrategicHubs] Empty response from model");
          throw new Error("Model returned empty response for strategic hubs");
        }
        const cities = JSON.parse(response.text);
        return Array.isArray(cities) && cities.length > 0 ? cities : ["North", "South", "East", "West"];
    } catch (e) {
        console.error("[StrategicHubs] Failed:", e);
        return ["Major Cities", "Industrial Zones", "Port Cities", "Capital Region"];
    }
};

/**
 * VERIFY LEAD
 * Uses Google Search and Maps to confirm legitimacy and relevance.
 */
export const verifyLead = async (lead: Lead, product: ProductDetails): Promise<Partial<Lead>> => {
    const ai = getAiClient();
    const prompt = `
        You are a Lead Verification Specialist.
        TASK: Verify the legitimacy and relevance of this lead: "${lead.companyName}" in "${lead.region}".
        PRODUCT CONTEXT: We are selling "${product.name}".

        CURRENT DATA:
        - Address: ${lead.address || "Unknown"}
        - Website: ${lead.website || "Unknown"}

        VERIFICATION STEPS:
        1. Search Google Maps for the company name in ${lead.region}. Does it exist? Is it a real business address?
        2. Search Google for "${lead.companyName} ${product.name} distributor" or similar. Do they actually deal with this product category?
        3. Check if the website is active and relevant.

        Return ONLY a valid JSON object with these exact keys: verificationStatus (one of "VERIFIED", "FAILED", "UNVERIFIED"), verificationNotes (string), confidenceScore (number 0-100).
        Do NOT wrap in markdown. Raw JSON only.
    `;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: { parts: [{ text: prompt }] },
            config: {
                ...buildThinkingConfig(DEFAULT_MODEL),
                tools: [{ googleSearch: {} }]
            }
        });

        if (!response.text) {
          console.error("[VerifyLead] Empty response from model");
          throw new Error("Model returned empty response for lead verification");
        }
        const parsed = extractJsonFromText(response.text);
        if (!parsed) throw new Error("Failed to parse JSON from lead verification");

        // Extract grounding sources from Google Search for verification traceability
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            const verifySources: string[] = [];
            for (const chunk of groundingChunks) {
                if ((chunk as any).web?.uri) {
                    verifySources.push((chunk as any).web.uri);
                }
            }
            if (verifySources.length > 0) {
                parsed._sources = verifySources;
            }
        }
        return parsed;
    } catch (error) {
        console.error("[VerifyLead] Failed:", error);
        return { verificationStatus: "UNVERIFIED", verificationNotes: "Verification failed due to error." };
    }
};

/**
 * EXECUTE SINGLE BATCH OF SEARCH
 * Helper function to keep request size small and avoid token limits.
 */
const executeLeadBatch = async (
    product: ProductDetails, 
    vectorName: string, 
    vectorPrompt: string, 
    targetCount: number,
    context?: StrategicContext
): Promise<any[]> => {
    const ai = getAiClient();

    // Small buffer for this specific batch
    const requestCount = targetCount + 2; 
    
    // DYNAMIC CONTEXT INJECTION: Only inject what is necessary for SEARCH
    // This avoids linear context window bloat.
    let memoryBlock = "";
    if (context) {
        memoryBlock = `
      STRATEGIC MEMORY ACTIVATED:
      - SEARCH IDENTITY: ${context.productIdentity}
      - IDEAL TARGET: ${context.idealBuyer}
      - NEGATIVE MATCH (EXCLUDE): ${context.exclusions}
      - VALUE HOOK: ${context.valueProposition}
        `;
    }

    const fullPrompt = `
      You are a TERRITORY MANAGER for a Lead Sourcing Agency.
      ASSIGNED TERRITORY: "${vectorName}"
      
      PRODUCT: ${product.name}
      REGION: ${product.targetRegion}
      TARGET: Find AT LEAST ${requestCount} verified candidates within your assigned territory.

      LOCATION ENFORCEMENT (CRITICAL):
      You are searching specifically in ${product.targetRegion}.
      - EXCLUDE companies located in other countries, even if they distribute there.
      - EXCLUDE companies with headquarters in ${product.supplierCountry || "China"} unless the target region IS explicitly ${product.supplierCountry || "China"}.
      - CHECK the "Contact Us" or "About Us" footer. If the address is not physically in ${product.targetRegion}, discard.

      INSTRUCTIONS:
      ${vectorPrompt}

      ${memoryBlock}

      STRICT VERIFICATION PROTOCOL (MANDATORY):
      1. Your goal is to find companies with a PHYSICAL PRESENCE in ${product.targetRegion}.
      2. For every potential lead, you MUST search for their "Google Maps URL" or "Street Address".
      3. If a company cannot be found on a Map, DISCARD IT. We only want verified businesses.
      4. Populate the 'googleMapsUrl' field with the direct link found.
      5. Populate the 'country' field with the physical country of the company's HQ.
      6. COMPETITIVE INTEL: Identify 1-2 likely current suppliers or competitors they might be using. If unknown, infer based on market leaders in that region. Provide a brief displacement strategy.

      Return ONLY a valid JSON array of lead objects. Each object must have these keys: companyName, website, reason, confidenceScore (number), sourceUrl, googleMapsUrl, country, socialProfiles (array of {platform, url}), employeeCount, revenue, contactEmail, phoneNumber, address, tradeVolume, manufacturingVolume, matchDetails ({industryFit, sizeFit, locationFit}), competitors (array of {name, strengths, weaknesses, displacementStrategy}).
      Do NOT wrap in markdown. Raw JSON only.
    `;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                ...buildThinkingConfig(DEFAULT_MODEL),
                tools: [{ googleSearch: {} }]
            }
        });

        if (!response.text) {
          console.error(`[ExecuteLeadBatch] Empty response from model for vector ${vectorName}`);
          return [];
        }

        let rawLeads = [];
        try {
            const parsed = extractJsonFromText(response.text);
            rawLeads = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error(`Failed to parse leads for vector ${vectorName}:`, response.text);
            return [];
        }

        // Extract grounding sources from Google Search for traceability
        const groundingSources: string[] = [];
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            for (const chunk of groundingChunks) {
                if ((chunk as any).web?.uri) {
                    groundingSources.push((chunk as any).web.uri);
                }
            }
        }

        if (!Array.isArray(rawLeads)) return [];

        // Attach grounding sources to each lead for traceability
        const leadsWithSources = rawLeads.map((l: any) => ({ ...l, _sources: groundingSources }));

        // --- STRICT VERIFICATION FILTER ---
        const verifiedLeads = leadsWithSources.filter((l: any) => {
            const hasMapsUrl = l.googleMapsUrl && (
                l.googleMapsUrl.includes('google.com/maps') ||
                l.googleMapsUrl.includes('google.co') ||
                l.googleMapsUrl.includes('goo.gl/maps') ||
                l.googleMapsUrl.includes('maps.app.goo.gl') ||
                l.googleMapsUrl.includes('maps.google')
            );
            
            if (!hasMapsUrl) {
                return false; // Discard silently to clean logs
            }

            // Geographic Sanity Check
            if (l.country && product.targetRegion) {
                 const target = product.targetRegion.toLowerCase().trim();
                 const actual = l.country.toLowerCase().trim();
                 
                 // If searching for Australia, ban USA/Texas/America results
                 if (target.includes('australia') && (actual.includes('usa') || actual.includes('texas') || actual.includes('united states'))) {
                     return false;
                 }
                 // If searching for UAE, ban India results
                 if (target.includes('uae') && (actual.includes('india') || actual.includes('mumbai'))) {
                     return false;
                 }
            }
            return true;
        });

        return verifiedLeads;

    } catch (e) {
        console.error(`Batch execution for ${vectorName} failed:`, e);
        return [];
    }
}

/**
 * Executes a single search vector by splitting it into smaller batches.
 * This prevents hitting the 8192 token output limit of the model.
 */
const runSearchVector = async (
    product: ProductDetails, 
    vectorName: string, 
    vectorPrompt: string, 
    rawCountPerVector: number
): Promise<Lead[]> => {
    
    // Retrieve structured context if available
    const searchContext = product.strategicContext;

    // BATCHING STRATEGY
    // The model typically hits token limits around 15-20 complex lead objects.
    // We set a conservative batch size of 8 to ensure stability.
    const MAX_LEADS_PER_BATCH = 8;
    const totalNeeded = rawCountPerVector;
    
    // Calculate how many batches we need
    const numberOfBatches = Math.ceil(totalNeeded / MAX_LEADS_PER_BATCH);
    const batches = [];
    
    // Distribute remainder evenly-ish
    let remaining = totalNeeded;
    for(let i=0; i<numberOfBatches; i++) {
        const take = Math.min(remaining, MAX_LEADS_PER_BATCH);
        batches.push(take);
        remaining -= take;
    }

    console.log(`[Vector: ${vectorName}] Splitting ${totalNeeded} leads into ${batches.length} batches: [${batches.join(',')}]`);

    let allRawLeads: any[] = [];

    // Execute batches SEQUENTIALLY to avoid rate limits and massive parallel token usage
    // We already run 4 vectors in parallel in the main function.
    for (const count of batches) {
        if (count <= 0) continue;
        const batchResults = await executeLeadBatch(product, vectorName, vectorPrompt, count, searchContext);
        allRawLeads = [...allRawLeads, ...batchResults];
    }

    // Map to final Lead objects
    return allRawLeads.map((l: any) => {
        // Normalize confidence score to 0-100 integer
        let rawScore = l.confidenceScore;
        let score = 85; // Default fallback

        if (typeof rawScore === 'number') {
            if (rawScore <= 1 && rawScore > 0) {
                    score = Math.round(rawScore * 100);
            } else {
                    score = Math.round(rawScore);
            }
        }

        return {
            id: uuidv4(),
            companyName: l.companyName,
            website: (l.website && l.website.toLowerCase() !== 'n/a') ? l.website : undefined,
            region: product.targetRegion || "Unknown",
            status: LeadStatus.DISCOVERED,
            confidenceScore: score, 
            matchDetails: l.matchDetails,
            summary: l.reason,
            socialProfiles: Array.isArray(l.socialProfiles) ? l.socialProfiles : [],
            employeeCount: l.employeeCount,
            revenue: l.revenue,
            contactEmail: l.contactEmail,
            phoneNumber: l.phoneNumber,
            address: l.address,
            sourceUrl: l.sourceUrl,
            googleMapsUrl: l.googleMapsUrl,
            tradeVolume: l.tradeVolume,
            manufacturingVolume: l.manufacturingVolume,
            searchVector: vectorName,
            sources: Array.isArray(l._sources) ? l._sources : [],
            logs: [{
                timestamp: new Date().toLocaleTimeString(),
                actor: 'SYSTEM',
                message: `Lead discovered via ${vectorName}.\nLocation Verified: ${l.googleMapsUrl}\nHQ: ${l.country || "Detected in Region"}${l._sources?.length ? `\nSearch Sources: ${l._sources.length} URLs` : ''}`
            }]
        };
    });
}

export const searchForLeads = async (product: ProductDetails): Promise<Lead[]> => {
  const totalCount = product.targetLeadCount || 20;
  const countPerVector = Math.ceil(totalCount / 4);

  // 1. Identify Strategic Hubs (Cities/Towns)
  console.log(`[Geo-Strategy] Mapping key cities for ${product.targetRegion}...`);
  const hubs = await identifyStrategicHubs(product);
  console.log(`[Geo-Strategy] Hubs identified:`, hubs);

  // 2. Partition Hubs into 4 Squads
  // Ensure we handle cases with fewer than 12 hubs gracefully
  const chunkSize = Math.ceil(hubs.length / 4);
  const clusterA = hubs.slice(0, chunkSize);
  const clusterB = hubs.slice(chunkSize, chunkSize * 2);
  const clusterC = hubs.slice(chunkSize * 2, chunkSize * 3);
  const clusterD = hubs.slice(chunkSize * 3);

  // If clusters are empty (fallback), use generic terms
  const squadALocs = clusterA.length > 0 ? clusterA.join(', ') : "Major Cities";
  const squadBLocs = clusterB.length > 0 ? clusterB.join(', ') : "Secondary Cities";
  const squadCLocs = clusterC.length > 0 ? clusterC.join(', ') : "Industrial Zones";
  const squadDLocs = clusterD.length > 0 ? clusterD.join(', ') : "Developing Regions";

  // --- DEFINE GEOGRAPHIC VECTORS ---
  
  const promptTemplate = (locations: string) => `
    YOUR MISSION: SATURATE THE FOLLOWING LOCATIONS: [ ${locations} ].
    
    Do not search the whole country. Focus ONLY on these specific cities/towns.
    
    EXECUTE MULTI-METHOD SEARCH IN THESE CITIES:
    1. COMMERCIAL: Search for "Wholesaler of ${product.name} in [City Name]".
    2. MAPS: Search for "Distributors near [City Name]" on Google Maps.
    3. COMPETITOR: Find who stocks rival brands in these specific towns.
    4. DIRECTORY: Check local chamber of commerce member lists for these cities.
    
    Verify every address found.
  `;

  const vectorAlpha = promptTemplate(squadALocs);
  const vectorBravo = promptTemplate(squadBLocs);
  const vectorCharlie = promptTemplate(squadCLocs);
  const vectorDelta = promptTemplate(squadDLocs);

  console.log(`[Multi-Vector Search] Launching 4 Territory Squads...`);

  try {
      const [leadsA, leadsB, leadsC, leadsD] = await Promise.all([
          runSearchVector(product, `Territory Scout: ${squadALocs.substring(0, 30)}...`, vectorAlpha, countPerVector),
          runSearchVector(product, `Territory Scout: ${squadBLocs.substring(0, 30)}...`, vectorBravo, countPerVector),
          runSearchVector(product, `Territory Scout: ${squadCLocs.substring(0, 30)}...`, vectorCharlie, countPerVector),
          runSearchVector(product, `Territory Scout: ${squadDLocs.substring(0, 30)}...`, vectorDelta, countPerVector)
      ]);

      console.log(`[Multi-Vector Search] Results: A=${leadsA.length}, B=${leadsB.length}, C=${leadsC.length}, D=${leadsD.length}`);
      
      return [...leadsA, ...leadsB, ...leadsC, ...leadsD];

  } catch (error) {
    console.error("Multi-vector search failed:", error);
    return [];
  }
};
