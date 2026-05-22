# Design: Modular Agent Architecture

## Overview

Evolve TradeNexus from a monolithic search-grounded lead generation app into a modular sales agent with composable discovery, enrichment, verification, scoring, memory, and outreach modules. Implemented in 6 phases following the agent-modularization PRD, using a pure modular architecture (Approach A).

## Architecture

### File Structure

```
tradenexus-ai-sales-agent/
├── types/
│   ├── types.ts              (MODIFY - add optional evidence fields to Lead/SearchSession)
│   ├── evidenceTypes.ts      (NEW - DiscoveryEvidence, SocialProfileEvidence, VerificationCheck, LeadVerification, LeadScoreBreakdown)
│   └── agentTypes.ts         (NEW - AgentPlan, AgentPlanState, AgentRecommendation, OutreachDraft, MemoryEvent, CampaignMemory)

├── server/
│   ├── index.ts              (MODIFY - add new /api/agent/* routes)
│   ├── geminiService.ts      (MODIFY - shrink as logic migrates to agent modules)
│   └── agent/
│       ├── types.ts          (NEW - server-side re-exports of shared types)
│       ├── planner/
│       │   ├── campaignPlanner.ts   (Phase 5 stub)
│       │   └── nextBestAction.ts    (Phase 5 stub)
│       ├── discovery/
│       │   ├── webDiscovery.ts      (Phase 1 - wraps existing searchForLeads)
│       │   ├── mapsDiscovery.ts     (Phase 1 - wraps existing maps verification logic)
│       │   ├── socialDiscovery.ts   (Phase 2 - real implementation)
│       │   └── directoryDiscovery.ts (Phase 3+ stub)
│       ├── enrichment/
│       │   ├── websiteEnrichment.ts  (Phase 4 stub)
│       │   ├── socialEnrichment.ts   (Phase 2 stub)
│       │   └── contactEnrichment.ts  (Phase 4 stub)
│       ├── verification/
│       │   ├── leadVerification.ts   (Phase 4 - migrates existing verifyLead)
│       │   ├── socialProfileVerification.ts (Phase 4 stub)
│       │   └── evidenceValidation.ts (Phase 4 stub)
│       ├── scoring/
│       │   ├── leadScoring.ts        (Phase 4 stub)
│       │   └── scoreBreakdown.ts     (Phase 4 stub)
│       ├── outreach/
│       │   ├── messageDrafting.ts    (Phase 6 stub)
│       │   └── followUpPlanning.ts   (Phase 6 stub)
│       └── memory/
│           ├── campaignMemory.ts     (Phase 5 stub)
│           ├── supplierMemory.ts     (Phase 5 stub)
│           └── rejectionPatterns.ts  (Phase 5 stub)

├── services/agent/           (NEW - client-side API wrappers)
│   ├── socialDiscoveryService.ts
│   ├── leadScoringService.ts
│   └── verificationService.ts

└── components/
    ├── InteractionViewer.tsx  (MODIFY - integrate social/evidence into Dossier tab)
    ├── LeadCard.tsx          (MODIFY - compact evidence indicator badges)
    └── Dashboard.tsx         (MODIFY - new sort/filter options in Phase 4)
```

### Module Pattern

Each module exports typed async functions. Modules are stateless — they receive inputs and return structured outputs:

```ts
// Example: server/agent/discovery/socialDiscovery.ts
export async function discoverSocialForCompany(
  companyName: string,
  region: string,
  website?: string,
  productContext?: StrategicContext
): Promise<SocialProfileEvidence[]>
```

Stubs for future phases return a typed placeholder:

```ts
export async function generateOutreachDraft(...): Promise<OutreachDraft> {
  throw new Error("Outreach module not yet implemented (Phase 6)");
}
```

### Data Flow

```
PLANNER → DISCOVERY (web/maps/social) → ENRICHMENT → VERIFICATION → SCORING → LEAD + EVIDENCE
```

Each stage appends structured evidence to the lead. The lead becomes an aggregation of evidence records, each with source type, URL, confidence, timestamp, and module provenance.

## Data Model

### New Fields on Lead (all optional, backward-compatible)

| Field | Type | Phase |
|---|---|---|
| evidence | DiscoveryEvidence[] | 1 |
| verification | LeadVerification \| null | 4 |
| scoreBreakdown | LeadScoreBreakdown \| null | 4 |
| recommendations | AgentRecommendation[] | 5 |
| socialDiscovery | SocialProfileEvidence[] | 2 |
| outreachDrafts | OutreachDraft[] | 6 |
| lastAgentAction | string | 1 |

### New Fields on SearchSession (all optional)

| Field | Type | Phase |
|---|---|---|
| agentPlan | AgentPlan \| null | 5 |
| memory | CampaignMemory \| null | 5 |
| lastAgentRunAt | number | 5 |
| agentVersion | string | 5 |

### Key New Types

- `DiscoveryEvidence` — source type, URL, title/snippet, extracted fields, confidence, timestamp, foundBy module, validation status
- `SocialProfileEvidence extends DiscoveryEvidence` — platform, handle, isOfficialLikely, profileType, activityLevel, activityEvidence, contactHints
- `LeadVerification` — overall status (VERIFIED/PARTIAL/FAILED/UNVERIFIED), confidence, array of VerificationCheck
- `VerificationCheck` — type (LOCATION/WEBSITE/PRODUCT_FIT/SOCIAL_OWNERSHIP/CONTACT/DUPLICATE/COUNTRY_EXCLUSION), status (PASS/FAIL/WARNING/UNKNOWN), confidence, notes, evidenceIds
- `LeadScoreBreakdown` — overall, locationFit, productFit, buyerTypeFit, companySizeFit, evidenceQuality, socialActivity, contactability, competitiveOpportunity, freshness, rationale
- `AgentRecommendation` — type (VERIFY/ENRICH/DRAFT_OUTREACH/PRIORITIZE/REJECT/USER_REVIEW/EXPORT), priority, title, reason

## API Endpoints

Added to `server/index.ts` following the existing `asyncRoute` pattern. Each handler validates input, calls the agent module, returns typed result.

| Endpoint | Phase | Module Called |
|---|---|---|
| POST /api/agent/social-discovery/company | 2 | discovery/socialDiscovery |
| POST /api/agent/social-discovery/region | 3 | discovery/socialDiscovery |
| POST /api/agent/verify-lead | 4 | verification/leadVerification |
| POST /api/agent/score-lead | 4 | scoring/leadScoring |
| POST /api/agent/next-best-action | 5 | planner/nextBestAction |
| POST /api/agent/outreach-draft | 6 | outreach/messageDrafting |

Existing endpoints remain untouched during Phase 1. `/api/ai/verify-lead` is deprecated in Phase 4 in favor of `/api/agent/verify-lead`.

## UI Changes

### Tab Layout (InteractionViewer)

Keep the existing 3-tab layout. Evidence and social data are integrated into the Intelligence Dossier tab:

- **Chat** — Prospecting Assistant (unchanged, renamed from "Prospecting Assistant")
- **Dossier** — Company info + status + match details + social profiles + evidence trail + verification status
- **Logs** — Discovery logs (unchanged)

### LeadCard

Add compact icon indicator badges:
- Location verified (📍)
- Website found (🌐)
- Social active (👥)
- Contact found (✉️)

### Dashboard

Phase 4 adds sort/filter: overall score, verification status, social activity level, contactability, region, platform found, buyer type.

## Error Handling

- All modules return typed fallback values (empty arrays, UNKNOWN status) on failure — never throw
- Failures logged to terminal
- Existing try/catch patterns from geminiService.ts replicated in each module
- Social discovery runs sequentially per platform to avoid rate limits
- Evidence stored as metadata only (URLs, snippets, scores) — never full page content
- Firestore sources array capped at ~20 entries

## Phased Implementation

### Phase 1: Data Model + Modular Shell
- Create types/evidenceTypes.ts and types/agentTypes.ts
- Create server/agent/ directory with all module stubs
- Add optional evidence/verification/scoreBreakdown fields to Lead
- Wrap existing searchForLeads output into DiscoveryEvidence objects
- Create services/agent/ client wrappers
- Add new API route stubs to server/index.ts
- Keep UI unchanged; verify existing search still works

### Phase 2: Social Discovery
- Implement server/agent/discovery/socialDiscovery.ts (known-company lookup)
- Add POST /api/agent/social-discovery/company endpoint
- Add services/agent/socialDiscoveryService.ts client wrapper
- Attach SocialProfileEvidence to leads
- Show social profiles in Dossier tab

### Phase 3: Social-First Discovery
- Add regional social-first lead discovery
- Add POST /api/agent/social-discovery/region endpoint
- Social-first candidates convert to leads with source vector labels
- Run verification before adding to main pipeline

### Phase 4: Verification + Scoring
- Migrate verifyLead logic into verification/leadVerification.ts
- Implement scoring/leadScoring.ts with score breakdown
- Deprecate old /api/ai/verify-lead
- Add Dashboard sort/filter UI
- Update Dossier tab with verification status and score breakdown

### Phase 5: Planner + Memory + Next Actions
- Implement planner/campaignPlanner.ts (deterministic)
- Implement planner/nextBestAction.ts
- Implement memory/ modules (campaignMemory, supplierMemory, rejectionPatterns)
- Add recommendations to lead detail
- Terminal logs show planned steps and module results

### Phase 6: Outreach Drafting
- Implement outreach/messageDrafting.ts
- Generate platform-specific drafts (email, LinkedIn, WhatsApp)
- Drafts cite lead-specific evidence
- User approval required before any external send
- No automatic sending

## Backward Compatibility

- All new fields optional — existing sessions load without migration
- Old socialProfiles ({platform, url}) continues to populate
- Existing endpoints untouched until explicitly deprecated
- Existing search flow unchanged during Phase 1
