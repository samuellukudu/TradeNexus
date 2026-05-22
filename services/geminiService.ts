import {
  Lead,
  ProductDetails,
  ProductAsset,
  RegionSuggestion,
  MarketReport,
  StrategicContext,
  ChatMessage
} from "../types";

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

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

  return response.json() as Promise<T>;
};

export const generateProspectingMessage = async (
  history: ChatMessage[],
  lead: Lead,
  productContext?: StrategicContext
): Promise<string> => {
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
  supplierCountry?: string
): Promise<RegionSuggestion[]> => {
  const { suggestions } = await postJson<{ suggestions: RegionSuggestion[] }>("/api/ai/analyze-markets", {
    productName,
    productDescription,
    continent,
    countries,
    productAssets,
    preComputedContext,
    supplierCountry
  });
  return suggestions;
};

export const generateMarketReport = async (
  product: ProductDetails,
  region: string
): Promise<MarketReport> => {
  const { report } = await postJson<{ report: MarketReport }>("/api/ai/market-report", {
    product,
    region
  });
  return report;
};

export const searchForLeads = async (product: ProductDetails): Promise<Lead[]> => {
  const { leads } = await postJson<{ leads: Lead[] }>("/api/ai/search-leads", {
    product
  });
  return leads;
};

export const verifyLead = async (
  lead: Lead,
  product: ProductDetails
): Promise<Partial<Lead>> => {
  const { result } = await postJson<{ result: Partial<Lead> }>("/api/ai/verify-lead", {
    lead,
    product
  });
  return result;
};
