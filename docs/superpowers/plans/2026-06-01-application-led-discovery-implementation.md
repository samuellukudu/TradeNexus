# Application-Led Discovery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate application-led discovery into the existing browser-based Gemini service layer so the agent decomposes a supplier's product into country-specific applications, searches each application lane proportionally for end users, and tags leads with application context.

**Architecture:** New types in `types/applicationTypes.ts` (to avoid circular deps between `types.ts` and `types/agentTypes.ts`). Four new functions in `browserGeminiService.ts` — `classifyProductRole`, `generateApplicationMap`, `searchApplicationLane`, `allocateLeadBudget`. Modified `deployScout` in `App.tsx` orchestrates the pipeline: check memory → classify role → generate map → allocate budget → search lanes → deduplicate. Fallback to existing `searchForLeads` on any failure.

**Tech Stack:** TypeScript, Google Gemini API (`@google/genai`), React + Vite

---

### Task 1: Create application types file

**Files:**
- Create: `types/applicationTypes.ts`

- [ ] **Step 1: Write the types file**

```ts
// types/applicationTypes.ts
// Application-Led Discovery types — separate file to avoid circular deps
// between types.ts and types/agentTypes.ts.

export type ApplicationSourceType = "seed" | "adapted" | "discovered";

export interface ProductRole {
  role: string; // finished system | machine or equipment | component | consumable | raw material | spare part | installation or service | software-enabled system
  resellerTypes: string[];
  installerTypes: string[];
  operatorTypes: string[];
  maintainerTypes: string[];
  financierTypes: string[];
}

export interface ProductApplication {
  id: string;
  name: string;
  country: string;
  buyerTypes: string[];
  whyRelevant: string;
  procurementTriggers: string[];
  searchTerms: string[];
  qualificationSignals: string[];
  badFitSignals: string[];
  decisionMakers: string[];
  priorityScore: number;
  confidence: number;
  sourceType: ApplicationSourceType;
  evidence?: string[];
}

export interface CountryApplicationMap {
  productName: string;
  country: string;
  productRole: ProductRole;
  applications: ProductApplication[];
  generatedAt: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add types/applicationTypes.ts
git commit -m "feat: add application-led discovery types

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Add application fields to Lead

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Add optional application fields to the Lead interface**

Insert after line 152 (`nextSteps?: string;`):

```ts
  applicationId?: string;
  application?: string;
  buyerType?: string;
  searchLane?: string;
```

The full `Lead` interface will have these new fields between `nextSteps` and `competitors`.

- [ ] **Step 2: Commit**

```bash
git add types.ts
git commit -m "feat: add application context fields to Lead type

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Add applicationMapHistory to CampaignMemory

**Files:**
- Modify: `types/agentTypes.ts`

- [ ] **Step 1: Add import and field**

Add import at top of file:

```ts
import { CountryApplicationMap } from './applicationTypes';
```

Add field to `CampaignMemory` interface (after `buyerTypePerformance`):

```ts
  applicationMapHistory?: CountryApplicationMap[];
```

- [ ] **Step 2: Commit**

```bash
git add types/agentTypes.ts
git commit -m "feat: add applicationMapHistory to CampaignMemory

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Add classifyProductRole to browserGeminiService.ts

**Files:**
- Modify: `services/browserGeminiService.ts`

- [ ] **Step 1: Add import for new types**

Insert after the existing import from `../types` (line 12):

```ts
import { ProductRole, ProductApplication, CountryApplicationMap } from "../types/applicationTypes";
```

- [ ] **Step 2: Add classifyProductRole function**

Insert after `normalizeScore` (end of file, before the final blank line):

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add services/browserGeminiService.ts
git commit -m "feat: add classifyProductRole to browser gemini service

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Add generateApplicationMap to browserGeminiService.ts

**Files:**
- Modify: `services/browserGeminiService.ts`

- [ ] **Step 1: Add generateApplicationMap function**

Insert after `classifyProductRole`:

```ts
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
          ${context ? `Strategic context: ${JSON.stringify(context)}` : ""}

          ${pastMapsContext}

          Use Google Search to research ${country}'s industries, infrastructure gaps, economic conditions, climate, regulations, and regional clusters relevant to this product.

          Generate a country-specific application map. Each application must describe a real operational context where companies in ${country} USE this product (not resell it).

          For each application, provide:
          - name: specific application context (e.g. "commercial irrigation farms")
          - buyerTypes: specific company types operating in this context
          - whyRelevant: why this product matters for this application in ${country}
          - procurementTriggers: events that drive purchase decisions
          - searchTerms: 3 actual Google search queries to find these companies in ${country}
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

          Return only a valid JSON object with this exact shape:
          {
            "applications": [
              {
                "name": "...",
                "buyerTypes": [...],
                "whyRelevant": "...",
                "procurementTriggers": [...],
                "searchTerms": [...],
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
  const evidence = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .map((chunk: any) => chunk.web?.uri)
    .filter(Boolean);

  const applications: ProductApplication[] = rawApps
    .map((app: any) => ({
      id: uuidv4(),
      name: app.name || "Unknown Application",
      country: country,
      buyerTypes: Array.isArray(app.buyerTypes) ? app.buyerTypes : [],
      whyRelevant: app.whyRelevant || "",
      procurementTriggers: Array.isArray(app.procurementTriggers) ? app.procurementTriggers : [],
      searchTerms: Array.isArray(app.searchTerms) ? app.searchTerms : [],
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
    productName: product.name,
    country,
    productRole,
    applications,
    generatedAt: Date.now()
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add services/browserGeminiService.ts
git commit -m "feat: add generateApplicationMap to browser gemini service

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Add searchApplicationLane and allocateLeadBudget to browserGeminiService.ts

**Files:**
- Modify: `services/browserGeminiService.ts`

- [ ] **Step 1: Add allocateLeadBudget helper**

Insert after `generateApplicationMap`:

```ts
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

  fracs.sort((a, b) => b.frac - a.frac);
  for (const { id } of fracs) {
    if (remaining <= 0) break;
    budget[id]++;
    remaining--;
  }

  return budget;
};
```

- [ ] **Step 2: Add searchApplicationLane function**

Insert after `allocateLeadBudget`:

```ts
export const searchApplicationLane = async (
  product: ProductDetails,
  application: ProductApplication,
  leadTarget: number
): Promise<Lead[]> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: GROUNDING_MODEL,
    contents: {
      parts: [{
        text: `
          You are finding OPERATIONAL END USERS for a B2B product. Do NOT search for distributors, importers, or resellers.

          Product: ${product.name}
          Description: ${product.description || product.name}
          Supplier country: ${product.supplierCountry || "China"}

          Application context:
          - Application: ${application.name}
          - Why relevant: ${application.whyRelevant}
          - Buyer types to find: ${application.buyerTypes.join(", ")}
          - Qualification signals: ${application.qualificationSignals.join("; ")}
          - Bad-fit signals (avoid these): ${application.badFitSignals.join("; ")}
          - Decision makers to note: ${application.decisionMakers.join(", ")}

          Search for up to ${leadTarget} real companies in ${application.country} that OPERATE in this application context.
          Use these search queries: ${application.searchTerms.join(" | ")}

          Return only a JSON array. Each item:
          {
            "companyName": "...",
            "website": "...",
            "reason": "why this company fits the application",
            "confidenceScore": 85,
            "sourceUrl": "...",
            "googleMapsUrl": "...",
            "country": "${application.country}",
            "socialProfiles": [],
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
      message: `Lead discovered via application lane: ${application.name}.${lead.googleMapsUrl ? `\nLocation: ${lead.googleMapsUrl}` : ""}`
    }]
  }));
};
```

- [ ] **Step 3: Commit**

```bash
git add services/browserGeminiService.ts
git commit -m "feat: add searchApplicationLane and allocateLeadBudget to browser gemini service

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Make generateProspectingMessage application-aware

**Files:**
- Modify: `services/browserGeminiService.ts`

- [ ] **Step 1: Enrich the system instruction with application context**

Replace the existing `systemInstruction` string inside `generateProspectingMessage` (currently lines 163-170) with an enriched version that includes application fields:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add services/browserGeminiService.ts
git commit -m "feat: enrich generateProspectingMessage with application context

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Refactor deployScout in App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Add new imports to App.tsx**

After line 3 (the `geminiService` import), add:

```ts
import { classifyProductRole, generateApplicationMap, searchApplicationLane, allocateLeadBudget } from './services/browserGeminiService';
```

After line 5 (the types import), add:

```ts
import { CampaignMemory } from './types/agentTypes';
```

- [ ] **Step 2: Replace the deployScout function**

Replace the entire `deployScout` function (currently lines 629-689) with:

```ts
  const deployScout = async (region: string, scoutLeadCount: number) => {
    if (deployedRegions.has(region)) return;

    setDeployedRegions(prev => new Set(prev).add(region));
    const scoutId = `Scout-${region.substring(0,3).toUpperCase()}`;
    addAgentLog(`[${scoutId}] Deploying to ${region}...`);
    
    if (window.innerWidth < 768) {
      setIsLeadsPanelOpen(true);
    }

    const productContext: ProductDetails = {
        name: productName,
        description: productDescription,
        targetRegion: region,
        targetCompanySize: targetCompanySize,
        targetLeadCount: scoutLeadCount,
        targetAudience: targetAudience,
        supplierCountry: supplierCountry,
        strategicContext: searchContext || undefined
    };

    try {
        // --- APPLICATION-LED DISCOVERY PIPELINE ---
        
        const currentSession = sessions.find(s => s.id === activeSessionId);
        const sessionMemory = currentSession?.memory;
        
        // 1. Check for existing application map in campaign memory
        let appMap = sessionMemory?.applicationMapHistory?.find(
          m => m.country === region
        );
        
        if (appMap) {
          addAgentLog(`[App Map] Using cached application map for ${region} (${appMap.applications.length} lanes)`);
        } else {
          // 2a. Classify product role
          setAgentAction({ type: 'SEARCHING', details: `Classifying product role for ${region}...` });
          addAgentLog(`[App Map] Classifying product role for ${productName}...`);
          const productRole = await classifyProductRole(productContext, searchContext || undefined);
          addAgentLog(`[App Map] Product role: ${productRole.role}`);
          
          // 2b. Generate application map
          setAgentAction({ type: 'SEARCHING', details: `Decomposing applications for ${region}...` });
          addAgentLog(`[App Map] Generating application map for ${region}...`);
          const pastMaps = sessionMemory?.applicationMapHistory || [];
          appMap = await generateApplicationMap(
            productContext, region, productRole,
            searchContext || undefined, pastMaps, supplierCountry
          );
          
          // 2c. Log the applications found
          addAgentLog(`[App Map] ${appMap.applications.length} applications identified:`);
          for (const app of appMap.applications) {
            const laneBudget = Math.max(1, Math.floor((scoutLeadCount * app.priorityScore) / 
              appMap.applications.reduce((s, a) => s + a.priorityScore, 0)));
            addAgentLog(`[App Map]   ${appMap.applications.indexOf(app) + 1}. ${app.name} (score: ${app.priorityScore.toFixed(2)}) → ~${laneBudget} leads`);
          }
          
          // 2d. Save application map to campaign memory
          const updatedMemory: CampaignMemory = {
            ...(sessionMemory || {
              events: [],
              preferredLeadPatterns: [],
              rejectedLeadPatterns: [],
              strongRegions: [],
              weakRegions: [],
              platformUsefulness: {},
              buyerTypePerformance: {},
              updatedAt: Date.now()
            }),
            applicationMapHistory: [
              ...(sessionMemory?.applicationMapHistory || []).slice(-19),
              appMap
            ],
            updatedAt: Date.now()
          };
          
          setSessions(prev => {
            const updated = prev.map(s =>
              s.id === activeSessionId ? { ...s, memory: updatedMemory } : s
            );
            if (user && activeSessionId) {
              const session = updated.find(s => s.id === activeSessionId);
              if (session) saveSession(user.uid, session);
            }
            return updated;
          });
        }
        
        // 3. Allocate budget across applications
        const budget = allocateLeadBudget(appMap.applications, scoutLeadCount);
        
        // 4. Search each application lane
        setAgentAction({ type: 'SEARCHING', details: `Searching ${appMap.applications.length} application lanes in ${region}...` });
        
        const allFoundLeads: Lead[] = [];
        for (const application of appMap.applications) {
          const laneBudget = budget[application.id] || 0;
          if (laneBudget === 0) continue;
          
          const laneLabel = application.searchTerms[0] || application.name;
          addAgentLog(`[${scoutId}] Searching lane: "${laneLabel}" (${laneBudget} leads)...`);
          
          try {
            const laneLeads = await searchApplicationLane(productContext, application, laneBudget);
            allFoundLeads.push(...laneLeads);
            addAgentLog(`[${scoutId}] Lane complete: ${laneLeads.length} leads found`);
          } catch (laneErr) {
            addAgentLog(`[${scoutId}] Lane failed: ${laneErr}. Continuing with remaining lanes.`);
          }
        }
        
        // 5. Deduplicate across all lanes
        const currentLeads = leadsRef.current;
        const { unique: newLeads, duplicates } = deduplicateLeads(currentLeads, allFoundLeads);
        
        const leadsWithContext = [...currentLeads, ...newLeads];
        setLeads(leadsWithContext);
        updateActiveSession(leadsWithContext);

        addAgentLog(`[${scoutId}] Discovery complete. ${newLeads.length} new leads across ${appMap.applications.length} application lanes${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}.`);

        if (newLeads.length === 0) {
            setAgentAction({ type: 'IDLE', details: 'No new leads found.' });
            return;
        }

    } catch (e) {
        addAgentLog(`[${scoutId}] Application-led discovery failed: ${e}. Falling back to direct search...`);
        // Fall back to existing direct search
        try {
          setAgentAction({ type: 'SEARCHING', details: `Scouting ${region} via direct search...` });
          const foundLeads = await searchForLeads(productContext);
          const currentLeads = leadsRef.current;
          const { unique: newLeads, duplicates } = deduplicateLeads(currentLeads, foundLeads);
          const leadsWithContext = [...currentLeads, ...newLeads];
          setLeads(leadsWithContext);
          updateActiveSession(leadsWithContext);
          addAgentLog(`[${scoutId}] Fallback search complete: ${newLeads.length} leads found${duplicates > 0 ? ` (${duplicates} duplicates)` : ''}.`);
        } catch (fallbackErr) {
          addAgentLog(`[${scoutId}] Fallback search also failed: ${fallbackErr}`);
        }
    } finally {
        setAgentAction({ type: 'IDLE', details: 'Awaiting orders.' });
    }
  };
```

- [ ] **Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat: refactor deployScout with application-led discovery pipeline

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Update autopilot to use application-led discovery

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Modify the autopilot useEffect to use the application-led pipeline**

Replace the autopilot's `searchForLeads` call (the block starting around line 349 with the `productContext` and `searchForLeads` call) with the application-led pipeline. The autopilot is inside a `useEffect` — we need to modify the try block within it.

Replace the section from `const foundLeads = await searchForLeads(productContext);` through the deduplication logic (approximately lines 351-382) with the same application-led pipeline pattern:

```ts
              // --- APPLICATION-LED DISCOVERY (Autopilot) ---
              const currentSessionFull = sessionsRef.current.find(s => s.id === session.id);
              const sessionMemory = currentSessionFull?.memory;
              
              let appMap = sessionMemory?.applicationMapHistory?.find(
                m => m.country === scoutRegion
              );
              
              if (!appMap) {
                addAgentLog(`[Auto-Pilot] Classifying product role for ${session.name}...`);
                const productRole = await classifyProductRole(productContext, session.strategicContext);
                
                addAgentLog(`[Auto-Pilot] Generating application map for ${scoutRegion}...`);
                appMap = await generateApplicationMap(
                  productContext, scoutRegion, productRole,
                  session.strategicContext, sessionMemory?.applicationMapHistory || [],
                  session.config.supplierCountry
                );
                
                addAgentLog(`[Auto-Pilot] ${appMap.applications.length} applications identified in ${scoutRegion}`);
                
                // Save map to memory
                const updatedMemory: CampaignMemory = {
                  ...(sessionMemory || {
                    events: [],
                    preferredLeadPatterns: [],
                    rejectedLeadPatterns: [],
                    strongRegions: [],
                    weakRegions: [],
                    platformUsefulness: {},
                    buyerTypePerformance: {},
                    updatedAt: Date.now()
                  }),
                  applicationMapHistory: [
                    ...(sessionMemory?.applicationMapHistory || []).slice(-19),
                    appMap
                  ],
                  updatedAt: Date.now()
                };
                
                const updatedSessionWithMem = { ...session, memory: updatedMemory };
                setSessions(prev => prev.map(s => s.id === session.id ? updatedSessionWithMem : s));
                if (user) saveSession(user.uid, updatedSessionWithMem);
              }
              
              const budget = allocateLeadBudget(appMap.applications, scoutLeadCount);
              
              const allFoundLeads: Lead[] = [];
              for (const application of appMap.applications) {
                const laneBudget = budget[application.id] || 0;
                if (laneBudget === 0) continue;
                
                try {
                  const laneLeads = await searchApplicationLane(productContext, application, laneBudget);
                  allFoundLeads.push(...laneLeads);
                } catch (laneErr) {
                  // Single lane failure — continue with others
                }
              }
              
              const { unique: uniqueNewLeads } = deduplicateLeads(session.leads, allFoundLeads);
```

Note: The autopilot block also needs the `classifyProductRole`, `generateApplicationMap`, `searchApplicationLane`, and `allocateLeadBudget` imports (already added in Task 8 Step 1).

Also add the `CampaignMemory` import in the autopilot — but we already imported it in Task 8.

- [ ] **Step 2: Commit**

```bash
git add App.tsx
git commit -m "feat: update autopilot to use application-led discovery pipeline

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Verify the build compiles

**Files:**
- None (verification step)

- [ ] **Step 1: Run the TypeScript compiler to check for errors**

```bash
npx tsc --noEmit
```

Expected: No type errors. If errors appear, fix them before proceeding.

- [ ] **Step 2: Run the Vite build**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 3: Start the dev server and verify the app loads**

```bash
npm run dev
```

Expected: App starts, no console errors on load. The new pipeline activates when clicking "Deploy Scout."

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix: resolve build issues from application-led discovery integration

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
