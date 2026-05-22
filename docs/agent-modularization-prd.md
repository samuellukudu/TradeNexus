# PRD: Modular Agent Architecture and Social Discovery

## 1. Summary

TradeNexus currently operates primarily as a search-grounded lead generation app. It analyzes product context, identifies promising markets, searches web/maps results, deduplicates leads, and presents them in a campaign dashboard. The next product step is to evolve TradeNexus into a modular sales agent that can plan work, use specialized discovery and verification tools, gather structured evidence, score leads transparently, and recommend next actions.

This PRD defines a modular agent architecture with a dedicated social discovery capability. Social media should become a first-class discovery and qualification channel because many distributors, SMEs, importers, and local buyers are more active on LinkedIn, Facebook, Instagram, YouTube, TikTok, or WhatsApp-linked pages than on their official websites.

## 2. Goals

- Convert the current search workflow into a modular agent pipeline.
- Add dedicated social media discovery for both known companies and social-first lead discovery.
- Store structured evidence for every important lead claim.
- Separate discovery, enrichment, verification, scoring, memory, and outreach into independent modules.
- Make lead quality more explainable through score breakdowns and evidence trails.
- Give the agent a clear next-best-action loop while keeping external actions behind user approval.
- Preserve the existing campaign, lead, and dashboard experience while incrementally improving it.

## 3. Non-Goals

- Do not send emails, LinkedIn messages, WhatsApp messages, or social DMs automatically in the first release.
- Do not scrape platforms in violation of terms of service.
- Do not require paid third-party data providers for the first implementation.
- Do not replace Gemini grounding immediately; wrap it behind modular service interfaces first.
- Do not build a full CRM. TradeNexus should remain a focused sales sourcing and qualification agent.

## 4. User Problems

### Supplier / Export Sales User

- "I need reliable international buyers, not random search results."
- "Some companies have weak websites but active social pages."
- "I need to know why the AI thinks this lead is real and relevant."
- "I want the system to learn from what I accept or reject."
- "I need ready-to-use outreach, but I want to approve it before anything is sent."

### Current Product Gaps

- Search and Maps are doing most of the discovery work.
- Social profiles are opportunistic fields, not a directed discovery channel.
- Confidence score is not sufficiently explainable.
- Verification is not yet a persistent multi-check object.
- Agent actions are mostly fixed workflows rather than planned tool usage.
- Leads do not store enough evidence granularity to support trust and learning.

## 5. Target Experience

1. User creates or opens a campaign.
2. Agent analyzes supplier/product context and creates a campaign plan.
3. User chooses a market or region to scout.
4. Agent runs modular tools:
   - web discovery
   - maps discovery
   - social discovery
   - directory discovery where applicable
   - enrichment
   - verification
   - scoring
5. Leads appear with transparent evidence and score breakdowns.
6. Each lead shows:
   - verified location evidence
   - website evidence
   - social evidence
   - contactability
   - product/category fit
   - recommended next action
7. User can approve, reject, save, export, or draft outreach.
8. Agent memory updates from user choices and future searches become more targeted.

## 6. Product Requirements

### 6.1 Modular Agent Pipeline

The agent must be organized as composable modules with typed inputs and outputs.

Proposed structure:

```txt
agent/
  planner/
    campaignPlanner.ts
    nextBestAction.ts

  discovery/
    webDiscovery.ts
    mapsDiscovery.ts
    socialDiscovery.ts
    directoryDiscovery.ts

  enrichment/
    websiteEnrichment.ts
    socialEnrichment.ts
    contactEnrichment.ts

  verification/
    leadVerification.ts
    socialProfileVerification.ts
    evidenceValidation.ts

  scoring/
    leadScoring.ts
    scoreBreakdown.ts

  outreach/
    messageDrafting.ts
    followUpPlanning.ts

  memory/
    campaignMemory.ts
    supplierMemory.ts
    rejectionPatterns.ts

  types/
    agentTypes.ts
    evidenceTypes.ts
```

Each module must return structured data instead of freeform text whenever possible.

### 6.2 Evidence-First Lead Model

Leads must become aggregations of evidence. A lead should not only contain fields such as `website`, `address`, or `socialProfiles`; it should also store where those fields came from and how confident the agent is.

Required evidence concepts:

- source type
- source URL
- title/snippet
- extracted fields
- confidence
- timestamp
- module that found it
- validation status

Example:

```ts
export type EvidenceSourceType =
  | 'web'
  | 'maps'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'x'
  | 'directory'
  | 'company_registry'
  | 'user_provided';

export interface DiscoveryEvidence {
  id: string;
  sourceType: EvidenceSourceType;
  url: string;
  title?: string;
  snippet?: string;
  extractedFields?: Record<string, string | number | boolean | string[]>;
  confidence: number;
  foundAt: number;
  foundBy: string;
  validationStatus: 'UNVERIFIED' | 'VALID' | 'CONFLICTING' | 'STALE' | 'REJECTED';
}
```

### 6.3 Dedicated Social Discovery

Social discovery must be separate from normal web discovery. It should support two modes:

#### Known Company Social Lookup

Given a company name, country/region, website, and product context, find official or likely social profiles.

Search examples:

- `{companyName} LinkedIn {country}`
- `{companyName} Facebook {country}`
- `{companyName} Instagram {country}`
- `{companyName} YouTube`
- `{companyName} TikTok`
- `{companyName} distributor {productName} LinkedIn`
- `{companyName} WhatsApp {country}`

#### Social-First Lead Discovery

Given a product and region, find companies whose social presence indicates they may be buyers, distributors, importers, retailers, dealers, OEMs, or end users.

Search examples:

- `{productName} distributor LinkedIn {region}`
- `{productName} importer Facebook {region}`
- `{productName} wholesaler Instagram {city}`
- `{productName} dealer YouTube {country}`
- `{competitorBrand} distributor LinkedIn {region}`

Social discovery must classify results as:

- official company profile
- likely company profile
- employee/founder profile
- reseller/distributor page
- unrelated result
- inactive or low-quality result

### 6.4 Social Activity Signals

The agent must use social activity as a lead signal. The first release can infer activity from search snippets and visible profile metadata when available.

Signals:

- recent posts or recent activity evidence
- product/category mentions
- trade show participation
- catalog/showroom content
- WhatsApp/contact info in profile or posts
- local language activity
- follower count or engagement indicators when visible
- employee or owner presence
- signs of active selling/distribution

Social activity levels:

- `HIGH`: recent and relevant business activity is visible.
- `MEDIUM`: profile exists and is relevant, but activity is unclear or moderate.
- `LOW`: profile exists but appears inactive or weak.
- `UNKNOWN`: profile found, but activity cannot be assessed.

### 6.5 Social Evidence Model

```ts
export interface SocialProfileEvidence extends DiscoveryEvidence {
  platform: 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x' | 'other';
  handle?: string;
  isOfficialLikely: boolean;
  profileType:
    | 'company'
    | 'employee'
    | 'founder'
    | 'reseller'
    | 'community'
    | 'unknown';
  activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  activityEvidence?: string;
  contactHints?: string[];
  relevanceNotes?: string;
}
```

### 6.6 Verification

Verification should become a reusable module, not a side effect inside discovery.

Required checks:

- physical location exists in target region
- website domain appears related to company
- product/category fit
- social profile ownership likelihood
- contact information consistency
- duplicate detection
- supplier-country exclusion
- wrong-country exclusion
- evidence conflict detection

Example:

```ts
export interface VerificationCheck {
  id: string;
  type:
    | 'LOCATION'
    | 'WEBSITE'
    | 'PRODUCT_FIT'
    | 'SOCIAL_OWNERSHIP'
    | 'CONTACT'
    | 'DUPLICATE'
    | 'COUNTRY_EXCLUSION';
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';
  confidence: number;
  notes: string;
  evidenceIds: string[];
}

export interface LeadVerification {
  status: 'VERIFIED' | 'PARTIAL' | 'FAILED' | 'UNVERIFIED';
  confidence: number;
  checks: VerificationCheck[];
  updatedAt: number;
}
```

### 6.7 Explainable Lead Scoring

Replace or augment the single model-generated `confidenceScore` with a score breakdown.

Required scoring dimensions:

- location fit
- industry/product fit
- target buyer type fit
- company size fit
- evidence quality
- social activity
- contactability
- competitive displacement opportunity
- freshness

Example:

```ts
export interface LeadScoreBreakdown {
  overall: number;
  locationFit: number;
  productFit: number;
  buyerTypeFit: number;
  companySizeFit: number;
  evidenceQuality: number;
  socialActivity: number;
  contactability: number;
  competitiveOpportunity: number;
  freshness: number;
  rationale: string;
  updatedAt: number;
}
```

### 6.8 Agent Planner

The planner should decide which modules to run based on campaign state.

Initial plan states:

- `ANALYZE_CONTEXT`
- `DISCOVER_MARKETS`
- `DISCOVER_LEADS`
- `DISCOVER_SOCIAL`
- `ENRICH_LEADS`
- `VERIFY_LEADS`
- `SCORE_LEADS`
- `DRAFT_OUTREACH`
- `AWAIT_USER_APPROVAL`

The first release does not need a complex autonomous loop. A deterministic planner is acceptable if it emits explicit steps and logs.

### 6.9 Next Best Action

Each lead should have a recommended next action:

- verify social profile
- enrich contact info
- draft email
- draft LinkedIn message
- prioritize for outreach
- reject due to weak evidence
- request user review
- export to CSV

Example:

```ts
export interface AgentRecommendation {
  id: string;
  type:
    | 'VERIFY'
    | 'ENRICH'
    | 'DRAFT_OUTREACH'
    | 'PRIORITIZE'
    | 'REJECT'
    | 'USER_REVIEW'
    | 'EXPORT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  reason: string;
  evidenceIds: string[];
  createdAt: number;
}
```

### 6.10 Memory

Memory should capture campaign-level learning.

Required memory events:

- user accepts lead
- user rejects lead
- user changes lead status
- user edits next steps
- user exports leads
- user generates outreach
- user marks social profile useful or irrelevant

Memory should support:

- preferred lead patterns
- rejected lead patterns
- strong countries/regions
- weak countries/regions
- platform usefulness by market
- buyer type performance

### 6.11 Outreach

The outreach module should generate drafts only. User approval is required for external sending.

Supported draft types:

- cold email
- LinkedIn connection message
- LinkedIn follow-up
- WhatsApp-style short message
- trade-show intro message
- distributor pitch

Drafts should use:

- supplier profile
- product strategic context
- lead evidence
- social activity notes
- market report insights
- likely competitor displacement angle

## 7. UI Requirements

### 7.1 Lead Card

Lead cards should show compact evidence indicators:

- location verified
- website found
- social active
- contact found
- score

### 7.2 Lead Detail / Interaction Viewer

Add or revise tabs:

- `Chat`
- `Dossier`
- `Evidence`
- `Social`
- `Outreach`
- `Logs`

The Social tab should show:

- profiles by platform
- official-likelihood indicator
- activity level
- contact hints
- social relevance notes
- source links

The Evidence tab should show:

- source type
- URL
- extracted fields
- confidence
- validation status
- module that found it

### 7.3 Dashboard

Dashboard should support filtering/sorting by:

- overall score
- verification status
- social activity level
- contactability
- region
- platform found
- buyer type

### 7.4 Agent Terminal

Logs should become more structured and transparent:

- started module
- completed module
- number of candidates found
- number rejected
- top rejection reasons
- source count
- retry/failure messages

## 8. Backend / Service Requirements

### 8.1 Service Boundaries

Current `geminiService.ts` should be gradually split. The first step can keep existing model calls but wrap them with modular functions.

Suggested files:

```txt
server/agent/
  discovery/socialDiscovery.ts
  discovery/webDiscovery.ts
  discovery/mapsDiscovery.ts
  verification/leadVerification.ts
  scoring/leadScoring.ts
  planner/campaignPlanner.ts
  types.ts
```

Client-side service wrappers can mirror these where needed:

```txt
services/agent/
  socialDiscoveryService.ts
  leadScoringService.ts
  verificationService.ts
```

### 8.2 API Endpoints

Add endpoints behind the existing Express backend pattern:

- `POST /api/agent/social-discovery/company`
- `POST /api/agent/social-discovery/region`
- `POST /api/agent/verify-lead`
- `POST /api/agent/score-lead`
- `POST /api/agent/next-best-action`
- `POST /api/agent/outreach-draft`

### 8.3 Persistence

Existing Firestore session documents should add optional fields first to avoid migration risk.

New optional fields on `Lead`:

- `evidence`
- `verification`
- `scoreBreakdown`
- `recommendations`
- `socialDiscovery`
- `outreachDrafts`
- `lastAgentAction`

New optional fields on `SearchSession`:

- `agentPlan`
- `memory`
- `lastAgentRunAt`
- `agentVersion`

## 9. Phased Rollout

### Phase 1: Data Model and Modular Shell

- Add shared agent/evidence types.
- Add optional evidence, verification, score breakdown, and recommendation fields.
- Wrap existing lead search output into evidence objects.
- Keep UI largely unchanged.

Acceptance criteria:

- Existing search still works.
- New leads include at least basic evidence records for source URL and maps URL.
- No existing sessions break when optional fields are missing.

### Phase 2: Social Discovery Module

- Add `socialDiscovery.ts`.
- Add known-company social lookup.
- Attach social profile evidence to existing leads.
- Show social evidence in lead detail.

Acceptance criteria:

- User can run social discovery for a lead.
- Results distinguish official-likely profiles from weak matches.
- Social profiles include platform, URL, confidence, and activity level.

### Phase 3: Social-First Discovery

- Add regional social-first lead discovery.
- Social-first candidates can be converted into leads.
- Run verification before adding them to the main pipeline.

Acceptance criteria:

- User can scout a region using social discovery.
- Social-first leads are clearly labeled by source vector.
- Weak/unverified social-only results are not mixed with verified leads without status labels.

### Phase 4: Verification and Scoring

- Add reusable verification module.
- Add score breakdown.
- Update dashboard and lead detail UI.

Acceptance criteria:

- Every lead can display verification status.
- Overall score is derived from subscores.
- User can see why a lead scored high or low.

### Phase 5: Planner, Memory, and Next Actions

- Add deterministic campaign planner.
- Add next-best-action recommendations.
- Add campaign memory events.

Acceptance criteria:

- Agent can recommend the next action for each lead.
- Rejected leads influence future scouting prompts.
- Terminal logs show planned steps and module results.

### Phase 6: Outreach Drafting

- Add outreach draft module.
- Generate platform-specific drafts from evidence.
- Require user approval for all external use.

Acceptance criteria:

- User can generate email, LinkedIn, and WhatsApp-style drafts.
- Drafts cite or reflect lead-specific evidence.
- No message is sent automatically.

## 10. Technical Risks

- Social platforms may limit available public information.
- Search grounding may return weak or duplicated social matches.
- Model-generated profile ownership classification can be wrong.
- Larger lead objects may increase Firestore document size.
- More model calls may increase cost and latency.
- Parallel module execution may hit rate limits.

Mitigations:

- Use confidence and validation status instead of binary truth.
- Keep social discovery as evidence until verified.
- Batch and rate-limit module calls.
- Store only necessary evidence metadata, not large page content.
- Add user-visible uncertainty.
- Keep old fields for backward compatibility.

## 11. Metrics

Product metrics:

- verified leads per campaign
- leads with at least one social profile
- leads with high social activity
- user accepted/rejected lead ratio
- outreach drafts generated
- export rate

Quality metrics:

- duplicate rate
- wrong-country rejection rate
- social false-positive rate
- lead verification pass rate
- average evidence count per lead
- average score of accepted leads

Operational metrics:

- model calls per campaign
- average discovery latency
- failed module calls
- average Firestore document size

## 12. Open Questions

- Which social platforms matter most for the first target markets?
- Should social-first leads require maps verification before appearing in the lead list?
- Should social discovery run automatically for all leads or only top-ranked leads?
- Should the app distinguish company profiles from employee/founder profiles in the main UI?
- How much evidence should be stored per lead before Firestore document size becomes a concern?
- Should rejected social profiles become negative memory for the campaign?

## 13. Recommended First Implementation Slice

Start with a narrow, high-value slice:

1. Add evidence and social evidence types.
2. Add `socialDiscovery.ts` as a dedicated module.
3. Add a server endpoint for known-company social lookup.
4. Add a "Find Social Profiles" action in the lead detail view.
5. Store returned social evidence on the lead.
6. Show a Social tab with profiles, activity level, and confidence.
7. Add a simple `socialActivity` score contribution.

This creates visible product value while laying the foundation for the broader modular agent architecture.
