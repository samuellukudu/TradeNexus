# Application-Led Discovery — Integration Design

**Date:** 2026-06-01
**Status:** Approved
**Product:** TradeNexus AI Sales Agent
**Approach:** C — Structured Pipeline, Terminal-Only Visibility

## Summary

Integrate the Application-Led Discovery workflow into the existing browser-based Gemini service layer (`browserGeminiService.ts`). The agent will decompose a supplier's exact product into country-specific applications before searching for companies, then search each application lane proportionally by priority. The application map is an internal agent reasoning artifact surfaced through terminal logs — no new user-facing UI components.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Integration point | After market analysis, before scout deployment |
| User editability | None — internal agent workflow |
| Lane search strategy | All lanes, proportional budget |
| Supplier memory influence | Yes — past maps and profile affect ranking |
| Application map persistence | Stored in `CampaignMemory.applicationMapHistory` |

## Data Model

### New Types

```ts
type ApplicationSourceType = "seed" | "adapted" | "discovered";

interface ProductRole {
  role: string;
  resellerTypes: string[];
  installerTypes: string[];
  operatorTypes: string[];
  maintainerTypes: string[];
  financierTypes: string[];
}

interface ProductApplication {
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
  priorityScore: number;     // 0-1, drives proportional lead budget
  confidence: number;        // 0-1
  sourceType: ApplicationSourceType;
  evidence?: string[];
}

interface CountryApplicationMap {
  productName: string;
  country: string;
  productRole: ProductRole;
  applications: ProductApplication[];  // sorted by priorityScore desc
  generatedAt: number;
}
```

### Changes to Existing Types

`Lead` gains:
```ts
applicationId?: string;
application?: string;    // denormalized for display
buyerType?: string;
searchLane?: string;
```

`CampaignMemory` (in `types/agentTypes.ts`) gains:
```ts
applicationMapHistory?: CountryApplicationMap[];
```

## Service Layer (`browserGeminiService.ts`)

### New Functions

**`classifyProductRole(product, context?) → ProductRole`**
- Uses default model (no grounding — reasoning task)
- Classifies the product into one of: finished system, machine/equipment, component, consumable, raw material, spare part, installation/service, software-enabled system
- Identifies who resells, installs, operates, maintains, and finances the product

**`generateApplicationMap(product, country, productRole, context?, pastMaps?, supplierCountry?) → CountryApplicationMap`**
- Uses Google Search grounding to research country-specific conditions
- Factors: climate, dominant industries, infrastructure gaps, import dependency, local terminology, regulations, regional clusters
- Past application maps from campaign memory are passed as few-shot inspiration (not copied)
- Applications are sorted by priorityScore descending
- Priority scoring blends market signals with supplier-fit signals from memory

**`searchApplicationLane(product, application, leadTarget) → Lead[]`**
- Uses Google Search grounding
- Searches for companies within a single application lane using `application.searchTerms`
- Returns leads tagged with `applicationId`, `application`, `buyerType`, and `searchLane`

### Helper

**`allocateLeadBudget(applications, totalBudget) → Map<string, number>`**
- Each lane gets `floor(totalBudget * score / sumOfScores)`
- Remainder distributed to highest-priority lanes one at a time

### Modified Functions

**`generateProspectingMessage`** — Enriched to include `lead.application`, `lead.buyerType`, and `lead.searchLane` in the system instruction when present, so outreach adapts to the lead's application context.

**`searchForLeads`** — Kept unchanged for backward compatibility (autopilot fallback, direct searches).

## App Integration (`App.tsx`)

### `deployScout` — New Flow

```
deployScout(region, scoutLeadCount):
  1. Check session.memory?.applicationMapHistory for existing CountryApplicationMap for region
  2. If missing:
     a. Call classifyProductRole() → log "[App Map] Classifying product role..."
     b. Call generateApplicationMap(pastMaps=memory.applicationMapHistory) → log map
     c. Save map to memory
  3. allocateLeadBudget(map.applications, scoutLeadCount)
  4. For each application (priority desc):
     a. Call searchApplicationLane() → log "[Scout] Searching lane: ..."
     b. Collect leads
  5. Deduplicate across all lanes (existing dedup engine)
  6. Merge into leads state → updateActiveSession()
  7. On failure at any step: fall back to existing searchForLeads()
```

### Terminal Logs

```
[App Map] Classifying product: 50HP solar irrigation pump system → machine/equipment
[App Map] Generating application map for Kenya...
[App Map] 5 applications identified:
[App Map]   1. commercial irrigation farms (score: 0.92) → 5 leads
[App Map]   2. greenhouse operations (score: 0.85) → 4 leads
[App Map]   3. municipal water projects (score: 0.71) → 3 leads
[App Map]   4. hotel/resort landscaping (score: 0.63) → 3 leads
[App Map]   5. livestock watering systems (score: 0.48) → 2 leads
[Scout-KEN] Searching lane "Kenya greenhouse farms irrigation"...
[Scout-KEN] Lane complete: 3 leads found, 1 duplicate skipped
```

## Error Handling

- **Application map generation fails** → Fall back to existing `searchForLeads`
- **Single lane fails** → Other lanes proceed; failed lane logged
- **Zero applications returned** → Fall back to direct search
- **All lanes fail** → Same error behavior as current `searchForLeads` failure
- **Cross-lane duplicates** → Existing dedup engine handles, keeping first occurrence
- **Memory cap** → `applicationMapHistory` capped at 20 most recent maps

## Autopilot Integration

The autopilot cycle follows the same flow: when it picks a region, it checks memory for an existing map, generates one if missing, then searches lanes proportionally. The existing interval-based autopilot structure is unchanged.

## Scope

### In Scope
- New types in `types.ts` and `types/agentTypes.ts`
- New functions in `services/browserGeminiService.ts`
- `deployScout` refactor in `App.tsx`
- Terminal log enrichment
- `generateProspectingMessage` application-awareness
- Application map memory in `CampaignMemory`

### Out of Scope
- User-facing Application Map UI component
- Editing/deleting individual applications
- Backend/Express server integration
- Per-application lead status tracking
- Changes to `LeadCard` or `InteractionViewer` (application fields render naturally via existing summary/status displays)
