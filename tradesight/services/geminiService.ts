import { GoogleGenAI, Type } from '@google/genai';
import type { Recommendation } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const DEFAULT_MODEL = (import.meta.env.VITE_GEMINI_DEFAULT_MODEL as string | undefined) || 'gemini-2.5-flash';

export const hasTradesightGeminiKey = Boolean(apiKey);

const getAiClient = () => {
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey });
};

interface RecommendationParams {
  countryName: string;
  segment: 'founder' | 'merchant';
  gdp: string;
  tradeM: string;
  tradeX: string;
  fdi: string;
  commodity: string;
  gdpCapitaPpp: string;
  inflation: string;
}

export const generateRecommendations = async (
  params: RecommendationParams
): Promise<{ recommendations: Recommendation[]; isAiGenerated: boolean; error?: string }> => {
  const {
    countryName, segment, gdp, tradeM, tradeX, fdi, commodity, gdpCapitaPpp, inflation
  } = params;

  // Fallback data when no API key
  if (!hasTradesightGeminiKey) {
    return { recommendations: getFallbackRecommendations(countryName, commodity, segment, gdp, tradeM, tradeX, fdi), isAiGenerated: false };
  }

  try {
    const ai = getAiClient();
    const prompt = `A founder or small business in ${countryName} is seeking advice.
Our active commodity/industry group is: "${commodity}".
The current macroeconomic status indicators are:
- GDP: ${gdp}
- Total Imports: ${tradeM}
- Total Exports: ${tradeX}
- FDI net inflows: ${fdi}
- GDP per Capita (PPP, constant 2017 international $): ${gdpCapitaPpp}
- Consumer Inflation Rate (annual %): ${inflation}

Segment parameter: "${segment}" (${segment === 'founder' ? 'Founders & tech-focused Startups' : 'Small, traditional brick-and-mortar Local Businesses & Merchants'}).

Please generate exactly 4 highly tactical, insightful, and realistic recommendations for this segment.
Make them deeply specific to the country's macroeconomic context, competitive advantages, or trade flows. Reference real concepts like leveraging FDI inflows to build support ecosystems, using high imports to justify import-substitution startups, or exporting premium local goods.
Each recommendation must list exactly 3 actionable steps and explain which macroeconomic metric (like purchasing power, local consumer inflation, or FDI) inspired the concept.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: segment === 'founder'
          ? 'You are an elite B2B venture designer and macroeconomic investment consultant. Your focus is identifying lucrative startup niches, import-substitutions, and technology platform opportunities that fuel job creation and scaling.'
          : 'You are a master small business advisor and retail operations expert. Your focus is giving hyper-practical, street-smart, concrete survival, resilience, and growth recommendations to everyday storefronts, merchants, and local services.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  metricsLink: { type: Type.STRING }
                },
                required: ['id', 'title', 'category', 'impact', 'timeframe', 'description', 'actionSteps', 'metricsLink']
              }
            }
          },
          required: ['recommendations']
        }
      }
    });

    const responseText = response.text || '';
    const parsedData = JSON.parse(responseText.trim());
    if (parsedData && Array.isArray(parsedData.recommendations)) {
      return { recommendations: parsedData.recommendations, isAiGenerated: true };
    }
    return { recommendations: getFallbackRecommendations(countryName, commodity, segment, gdp, tradeM, tradeX, fdi), isAiGenerated: false };
  } catch (error: any) {
    console.error('Gemini Recommendations error:', error.message);
    return { recommendations: getFallbackRecommendations(countryName, commodity, segment, gdp, tradeM, tradeX, fdi), isAiGenerated: false, error: error.message };
  }
};

export const generateAdvisorChat = async (
  countryName: string,
  segment: 'founder' | 'merchant',
  message: string,
  history: { role: string; text: string }[],
  gdp: string,
  fdi: string,
  commodity: string,
  gdpCapitaPpp: string,
  inflation: string
): Promise<{ text: string; isAiGenerated: boolean; error?: string }> => {
  if (!hasTradesightGeminiKey) {
    return { text: getFallbackChatResponse(countryName, commodity, segment), isAiGenerated: false };
  }

  try {
    const ai = getAiClient();
    const systemInstruction = `You are a world-class strategic business advisor specializing in ${countryName}.
The client is in the segment: "${segment === 'founder' ? 'Founders & Startups' : 'Small Local Businesses & Retailers'}".
The current industry/commodity focus is: "${commodity}".
GDP context: ${gdp || 'N/A'}. FDI context: ${fdi || 'N/A'}.
GDP per Capita (PPP): ${gdpCapitaPpp || 'N/A'}. Consumer Inflation Rate: ${inflation || 'N/A'}.

Your goal is to answer the user's specific query. Give structured, professional, motivating, and incredibly insightful business intelligence regarding international trade, retail growth, pricing, funding or business design in ${countryName}. Reference actual trade dynamics. Keep answers scannable with bullet points and bold headers. Limit responses to around 250-300 words.`;

    let prompt = '';
    if (history && history.length > 0) {
      prompt += 'Conversation history:\n';
      history.forEach((h) => {
        prompt += `${h.role === 'user' ? 'Client' : 'Advisor'}: ${h.text}\n`;
      });
    }
    prompt += `\nLatest Client message: ${message}\nAdvisor response:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { systemInstruction, temperature: 0.7 }
    });

    return { text: response.text || getFallbackChatResponse(countryName, commodity, segment), isAiGenerated: true };
  } catch (error: any) {
    console.error('Gemini Advisor Chat error:', error.message);
    return { text: getFallbackChatResponse(countryName, commodity, segment), isAiGenerated: false, error: error.message };
  }
};

// --- Fallback data (from server.ts) ---

function getFallbackRecommendations(
  countryName: string, commodity: string, segment: string,
  gdp: string, tradeM: string, tradeX: string, fdi: string
): Recommendation[] {
  const activeCommodity = commodity || 'All Commodities (TOTAL)';
  if (segment === 'founder') {
    return [
      {
        id: 'f1', title: `Localization of ${activeCommodity.split(' - ').pop()} Imports`,
        category: 'Import Substitution', impact: 'High', timeframe: '6-12 months',
        description: `Verify the heavy import levels of ${activeCommodity}. Moving manufacturing or finishing of raw inputs to a domestic plant inside ${countryName} shortens logistic loops, secures margins, and protects local buyers from customs and tariff shifts.`,
        actionSteps: [
          `Analyze the exact subcomponents of ${activeCommodity} imported into ${countryName}.`,
          'Establish local prototyping hubs utilizing high-precision tooling to support local manufacturing.',
          'Pitch your localized parts to existing high-volume buyers as a supply-chain assurance policy.'
        ],
        metricsLink: `Directly targets ${activeCommodity} imports (valued at ${tradeM})`
      },
      {
        id: 'f2', title: `B2B FDI Integration Landing Pad`,
        category: 'Services Platform', impact: 'High', timeframe: '3-6 months',
        description: `With FDI inflows registered at ${fdi}, outside enterprise players entering ${countryName} struggle with local regulatory networks, procurement, and operations. Building a compliance concierge platform caters directly to this growing trend.`,
        actionSteps: [
          'Map out local logistics, real estate, and customs compliance requirements.',
          'Design an effortless compliance onboarding platform for multinational companies.',
          'Partner with regional business chambers as the designated soft-landing companion.'
        ],
        metricsLink: `Derived from FDI inflows of ${fdi}`
      },
      {
        id: 'f3', title: `HS Tariff Classification Optimization SaaS`,
        category: 'Trade Tech SaaS', impact: 'Medium', timeframe: '2-4 months',
        description: `Automate classification for ${countryName}'s small-and-medium importers. Using intelligent categorization, businesses can lower tariffs, claim refunds, and streamline clearing procedures.`,
        actionSteps: [
          'Create a lightweight categorization tool linking HS descriptions directly to customs codes.',
          'Offer pre-audit compliance analytics to customs agents and importers.',
          'Base monetization around a risk-reduction metric or a percentage of saved duties.'
        ],
        metricsLink: `Inspired by import levels and the active trade matrix`
      },
      {
        id: 'f4', title: `${countryName} Premium Commodity Export Hub`,
        category: 'Global Aggregation', impact: 'Medium', timeframe: '6-9 months',
        description: `While primary bulk exports are dominated by massive conglomerates, small-scale local micro-mills and boutique manufacturing lack structural export routes. An aggregator network handles international branding, quality controls, and export clearance.`,
        actionSteps: [
          `Source high-quality regional outputs in the sector of ${activeCommodity}.`,
          'Create unified packaging, traceability, and global trade certifications.',
          'Partner with bulk cargo containers to bundle micro-consignments to European and US buyers.'
        ],
        metricsLink: `Targets export optimization for ${activeCommodity} (currently ${tradeX})`
      }
    ];
  }
  return [
    {
      id: 'm1', title: 'Insulating Trade volatility with Micro-Sourcing',
      category: 'Procurement Resilience', impact: 'High', timeframe: 'Immediate',
      description: `In ${countryName}, fluctuating import volumes can result in inventory bottlenecks. Shifting critical parts or retail materials to local micro-suppliers shields your boutique retail operation from global logistics delays.`,
      actionSteps: [
        'Perform a strategic inventory review to locate parts vulnerable to international freight delays.',
        'Collaborate with domestic craftspeople and manufacturers to design an exchange-rate-safe supply line.',
        'Promote your short, local turnaround speeds and low carbon footprints in customer marketing.'
      ],
      metricsLink: `Provides buffer against import friction`
    },
    {
      id: 'm2', title: 'Offering Ancillary Logistics Services for Inbound FDI Projects',
      category: 'B2B Outreach', impact: 'High', timeframe: '1-3 months',
      description: `Large corporations pouring investment into ${countryName} have vast budgets but lack regional personnel and depot stations. Small merchants and warehouses can rent portions of their physical footprint or route networks to these incoming partners.`,
      actionSteps: [
        'Track public FDI entries in your region.',
        'Propose temporary regional warehousing, delivery handling, and installation partnerships.',
        'Leverage incoming corporate contracts to obtain better credit lines from banks.'
      ],
      metricsLink: `Leverages a portion of the ${fdi} in FDI Inflows`
    },
    {
      id: 'm3', title: 'Unlocking Export Markets via Micro-Sales E-Commerce',
      category: 'Retail Expansion', impact: 'Medium', timeframe: '1-2 months',
      description: `Local merchants are no longer limited to foot-traffic. Digital cross-border trade platforms allow small boutique owners to ship artisanal crafts, clothing, and processed items directly to international retail customers.`,
      actionSteps: [
        'Enable localized Shopify or Etsy outlets targeting key purchasing nations.',
        'Incorporate international credit card networks and flat-rate international mailing options.',
        'Leverage short behind-the-scenes social videos explaining the heritage of your product.'
      ],
      metricsLink: `Supported by national trade infrastructure`
    },
    {
      id: 'm4', title: 'Proactive Raw Material Stockpiling during Currency Rallies',
      category: 'Strategic Finance', impact: 'Medium', timeframe: 'Immediate',
      description: `With GDP recorded at ${gdp}, pricing trends change rapidly. Hedging raw costs protects local bakers, builders, and fabricators from sudden procurement shocks.`,
      actionSteps: [
        'Identify imported primary inputs heavily affected by domestic currency swings.',
        'Secure working credit agreements to lock in bulk prices with trade partners.',
        'Form local purchase groups with neighboring merchants to secure volume discounts.'
      ],
      metricsLink: `Insulates business inputs from global market swings`
    }
  ];
}

function getFallbackChatResponse(countryName: string, commodity: string, segment: string): string {
  if (segment === 'founder') {
    return `Based on **${countryName}**'s current economic profile (focusing on **${commodity}**), here are some immediate tactical paths you can explore:\n\n1. **Leveraging Supply Chain Crises**: If you see high import numbers, localizing assembly or blending is your best fast-mover advantage. Focus on supplying parts to existing industrial importers.\n2. **Financing Options**: Anchor your startup funding around supply chain trade finance. High commerce nations often have robust regional export-import banks or credit lines willing to back certified purchase orders.\n3. **FDI Integration**: If FDI is growing, multinational corps need localized service providers. Offer outsourcing in logistics, workspace compliance, or talent sourcing.\n\n*Is there a particular commodity, input material, or raw resource you are planning to utilize for your startup? Let me know and we can build a launch blueprint!*`;
  }
  return `As a local merchant in **${countryName}**, here is how to navigate the current commercial climate:\n\n1. **Procurement Hedges**: Shifting even 20% of your primary inventory sourcing to local producers shields your pricing from global supply bottlenecks and container charge-ups.\n2. **Global Consumer Channels**: Can your storefront introduce unique local artisanal goods? Standard shipping tools can make exporting small items to buyers abroad extremely practical and high margin.\n3. **Service Partnerships**: Incoming global entities need foot-soldiers. Pitch your store or team as the authorized local repair facility or partner point to capture passive commercial traffic.\n\n*What kind of storefront or merchant business do you currently run? Tell me, and we can map out a cost-saving and customer acquisition plan!*`;
}
