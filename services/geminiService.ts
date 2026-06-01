import {
  Lead,
  ProductDetails,
  ProductAsset,
  RegionSuggestion,
  MarketReport,
  StrategicContext,
  ChatMessage
} from "../types";
import * as browserGemini from "./browserGeminiService";
import { CountryApplicationMap, ProductApplication, ProductRole, LaneQualificationReport } from "../types/applicationTypes";

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      "AI backend is not reachable. The deployed host returned the frontend HTML for an API request."
    );
  }

  return response.json() as Promise<T>;
};

export const generateProspectingMessage = async (
  history: ChatMessage[],
  lead: Lead,
  productContext?: StrategicContext
): Promise<string> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.generateProspectingMessage(history, lead, productContext);
  }

  const { text } = await postJson<{ text: string }>("/api/ai/prospecting-message", {
    history,
    lead,
    productContext
  });
  return text;
};

export const extractSearchStrategyFromAssets = async (
  product: ProductDetails
): Promise<StrategicContext> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.extractSearchStrategyFromAssets(product);
  }

  const { context } = await postJson<{ context: StrategicContext }>("/api/ai/extract-search-strategy", {
    product
  });
  return context;
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
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.analyzeMarkets(
      productName,
      productDescription,
      continent,
      countries,
      productAssets,
      preComputedContext,
      supplierCountry,
      productRole
    );
  }

  const { suggestions } = await postJson<{ suggestions: RegionSuggestion[] }>("/api/ai/analyze-markets", {
    productName,
    productDescription,
    continent,
    countries,
    productAssets,
    preComputedContext,
    supplierCountry,
    productRole
  });
  return suggestions;
};

export const generateMarketReport = async (
  product: ProductDetails,
  region: string
): Promise<MarketReport> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.generateMarketReport(product, region);
  }

  const { report } = await postJson<{ report: MarketReport }>("/api/ai/market-report", {
    product,
    region
  });
  return report;
};

export const searchForLeads = async (product: ProductDetails): Promise<Lead[]> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.searchForLeads(product);
  }

  const { leads } = await postJson<{ leads: Lead[] }>("/api/ai/search-leads", {
    product
  });
  return leads;
};

export const classifyProductRole = async (
  product: ProductDetails,
  context?: StrategicContext
): Promise<ProductRole> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.classifyProductRole(product, context);
  }

  const { productRole } = await postJson<{ productRole: ProductRole }>("/api/ai/classify-product-role", {
    product,
    context
  });
  return productRole;
};

export const generateApplicationMap = async (
  product: ProductDetails,
  country: string,
  productRole: ProductRole,
  context?: StrategicContext,
  pastMaps?: CountryApplicationMap[],
  supplierCountry?: string
): Promise<CountryApplicationMap> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.generateApplicationMap(product, country, productRole, context, pastMaps, supplierCountry);
  }

  const { applicationMap } = await postJson<{ applicationMap: CountryApplicationMap }>("/api/ai/application-map", {
    product,
    country,
    productRole,
    context,
    pastMaps,
    supplierCountry
  });
  return applicationMap;
};

export const allocateLeadBudget = browserGemini.allocateLeadBudget;

export const searchApplicationLane = async (
  product: ProductDetails,
  application: ProductApplication,
  leadTarget: number
): Promise<Lead[]> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.searchApplicationLane(product, application, leadTarget);
  }

  const { leads } = await postJson<{ leads: Lead[] }>("/api/ai/search-application-lane", {
    product,
    application,
    leadTarget
  });
  return leads;
};

export const verifyLead = async (
  lead: Lead,
  product: ProductDetails
): Promise<Partial<Lead>> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.verifyLead(lead, product);
  }

  const { result } = await postJson<{ result: Partial<Lead> }>("/api/ai/verify-lead", {
    lead,
    product
  });
  return result;
};

export const qualifyLeadsForApplication = async (
  leads: Lead[],
  application: ProductApplication,
  productName: string
): Promise<LaneQualificationReport> => {
  if (browserGemini.hasBrowserGeminiKey) {
    return browserGemini.qualifyLeadsForApplication(leads, application, productName);
  }

  const { report } = await postJson<{ report: LaneQualificationReport }>("/api/ai/qualify-leads", {
    leads,
    application,
    productName
  });
  return report;
};
