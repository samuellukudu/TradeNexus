# Phase 1: Data Model + Modular Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared agent/evidence types, create the full modular directory structure with stubs, wrap existing lead search output into evidence objects, and keep the UI unchanged.

**Architecture:** Pure modular — new types in `types/evidenceTypes.ts` and `types/agentTypes.ts`, new server modules in `server/agent/` with typed stubs for future phases, existing `geminiService.ts` logic wrapped behind `webDiscovery.ts` and `mapsDiscovery.ts` module interfaces. All new fields on `Lead` and `SearchSession` are optional for backward compatibility.

**Tech Stack:** TypeScript, Express (existing server), React + Vite (existing client), Google GenAI SDK

---

### Task 1: Create evidence types

**Files:**
- Create: `types/evidenceTypes.ts`

- [ ] **Step 1: Write evidenceTypes.ts**

```ts
// types/evidenceTypes.ts
// Shared evidence model types for the modular agent pipeline.

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

export type ValidationStatus = 'UNVERIFIED' | 'VALID' | 'CONFLICTING' | 'STALE' | 'REJECTED';

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
  validationStatus: ValidationStatus;
}

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x' | 'other';

export type SocialProfileType = 'company' | 'employee' | 'founder' | 'reseller' | 'community' | 'unknown';

export type SocialActivityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface SocialProfileEvidence extends DiscoveryEvidence {
  platform: SocialPlatform;
  handle?: string;
  isOfficialLikely: boolean;
  profileType: SocialProfileType;
  activityLevel: SocialActivityLevel;
  activityEvidence?: string;
  contactHints?: string[];
  relevanceNotes?: string;
}

export type VerificationCheckType =
  | 'LOCATION'
  | 'WEBSITE'
  | 'PRODUCT_FIT'
  | 'SOCIAL_OWNERSHIP'
  | 'CONTACT'
  | 'DUPLICATE'
  | 'COUNTRY_EXCLUSION';

export type VerificationCheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';

export interface VerificationCheck {
  id: string;
  type: VerificationCheckType;
  status: VerificationCheckStatus;
  confidence: number;
  notes: string;
  evidenceIds: string[];
}

export type LeadVerificationStatus = 'VERIFIED' | 'PARTIAL' | 'FAILED' | 'UNVERIFIED';

export interface LeadVerification {
  status: LeadVerificationStatus;
  confidence: number;
  checks: VerificationCheck[];
  updatedAt: number;
}

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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit types/evidenceTypes.ts`
Expected: No errors (file is self-contained, no imports)

- [ ] **Step 3: Commit**

```bash
git add types/evidenceTypes.ts
git commit -m "feat: add evidence types (DiscoveryEvidence, SocialProfileEvidence, LeadVerification, LeadScoreBreakdown)"
```

---

### Task 2: Create agent types

**Files:**
- Create: `types/agentTypes.ts`

- [ ] **Step 1: Write agentTypes.ts**

```ts
// types/agentTypes.ts
// Shared agent pipeline types for planning, recommendations, memory, and outreach.

import { DiscoveryEvidence, SocialProfileEvidence } from './evidenceTypes';

// --- Agent Plan ---

export type AgentPlanState =
  | 'ANALYZE_CONTEXT'
  | 'DISCOVER_MARKETS'
  | 'DISCOVER_LEADS'
  | 'DISCOVER_SOCIAL'
  | 'ENRICH_LEADS'
  | 'VERIFY_LEADS'
  | 'SCORE_LEADS'
  | 'DRAFT_OUTREACH'
  | 'AWAIT_USER_APPROVAL';

export interface AgentPlanStep {
  state: AgentPlanState;
  label: string;
  startedAt?: number;
  completedAt?: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: string;
}

export interface AgentPlan {
  id: string;
  campaignId: string;
  steps: AgentPlanStep[];
  currentStep: number;
  createdAt: number;
  updatedAt: number;
}

// --- Agent Recommendations ---

export type RecommendationType =
  | 'VERIFY'
  | 'ENRICH'
  | 'DRAFT_OUTREACH'
  | 'PRIORITIZE'
  | 'REJECT'
  | 'USER_REVIEW'
  | 'EXPORT';

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AgentRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  reason: string;
  evidenceIds: string[];
  createdAt: number;
}

// --- Outreach ---

export type OutreachDraftType =
  | 'cold_email'
  | 'linkedin_connection'
  | 'linkedin_followup'
  | 'whatsapp_short'
  | 'tradeshow_intro'
  | 'distributor_pitch';

export interface OutreachDraft {
  id: string;
  type: OutreachDraftType;
  subject?: string;
  body: string;
  evidenceIds: string[];
  createdAt: number;
  approved: boolean;
}

// --- Memory ---

export type MemoryEventType =
  | 'LEAD_ACCEPTED'
  | 'LEAD_REJECTED'
  | 'LEAD_STATUS_CHANGED'
  | 'NEXT_STEPS_EDITED'
  | 'LEADS_EXPORTED'
  | 'OUTREACH_GENERATED'
  | 'SOCIAL_PROFILE_USEFUL'
  | 'SOCIAL_PROFILE_IRRELEVANT';

export interface MemoryEvent {
  id: string;
  type: MemoryEventType;
  leadId?: string;
  details?: string;
  timestamp: number;
}

export interface CampaignMemory {
  events: MemoryEvent[];
  preferredLeadPatterns: string[];
  rejectedLeadPatterns: string[];
  strongRegions: string[];
  weakRegions: string[];
  platformUsefulness: Record<string, number>;
  buyerTypePerformance: Record<string, number>;
  updatedAt: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit types/agentTypes.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add types/agentTypes.ts
git commit -m "feat: add agent types (AgentPlan, AgentRecommendation, OutreachDraft, CampaignMemory)"
```

---

### Task 3: Add optional fields to Lead and SearchSession

**Files:**
- Modify: `types.ts:126-181`

- [ ] **Step 1: Add imports and new optional fields to Lead**

In `types.ts`, add at the top after existing imports:

```ts
import { DiscoveryEvidence, SocialProfileEvidence, LeadVerification, LeadScoreBreakdown } from './evidenceTypes';
import { AgentRecommendation, OutreachDraft, AgentPlan, CampaignMemory } from './agentTypes';
```

Modify the `Lead` interface to add these optional fields at the end (before the closing `}`):

```ts
  // Phase 1+ — Modular agent evidence fields
  evidence?: DiscoveryEvidence[];
  socialDiscovery?: SocialProfileEvidence[];
  // Phase 4
  verification?: LeadVerification | null;
  scoreBreakdown?: LeadScoreBreakdown | null;
  // Phase 5
  recommendations?: AgentRecommendation[];
  // Phase 6
  outreachDrafts?: OutreachDraft[];
  lastAgentAction?: string;
```

Modify the `SearchSession` interface to add these optional fields at the end (before the closing `}`):

```ts
  // Phase 5+ — Agent pipeline fields
  agentPlan?: AgentPlan | null;
  memory?: CampaignMemory | null;
  lastAgentRunAt?: number;
  agentVersion?: string;
```

- [ ] **Step 2: Verify TypeScript compiles across the project**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors (all new fields are optional so nothing breaks)

- [ ] **Step 3: Commit**

```bash
git add types.ts
git commit -m "feat: add optional agent pipeline fields to Lead and SearchSession"
```

---

### Task 4: Create server/agent/ directory with types re-export

**Files:**
- Create: `server/agent/types.ts`

- [ ] **Step 1: Create server/agent/types.ts**

This file re-exports shared types for server-side convenience, plus server-only types if needed:

```ts
// server/agent/types.ts
// Re-export shared types for server-side agent modules.

export type {
  EvidenceSourceType,
  ValidationStatus,
  DiscoveryEvidence,
  SocialPlatform,
  SocialProfileType,
  SocialActivityLevel,
  SocialProfileEvidence,
  VerificationCheckType,
  VerificationCheckStatus,
  VerificationCheck,
  LeadVerificationStatus,
  LeadVerification,
  LeadScoreBreakdown,
} from '../../types/evidenceTypes';

export type {
  AgentPlanState,
  AgentPlanStep,
  AgentPlan,
  RecommendationType,
  RecommendationPriority,
  AgentRecommendation,
  OutreachDraftType,
  OutreachDraft,
  MemoryEventType,
  MemoryEvent,
  CampaignMemory,
} from '../../types/agentTypes';

export type {
  Lead,
  LeadStatus,
  SearchSession,
  StrategicContext,
  ProductDetails,
  SocialProfile,
  InteractionLog,
} from '../../types';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit server/agent/types.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/agent/types.ts
git commit -m "feat: add server/agent/types.ts with shared type re-exports"
```

---

### Task 5: Create agent module stubs (planner, enrichment, verification, scoring, outreach, memory)

**Files:**
- Create: `server/agent/planner/campaignPlanner.ts`
- Create: `server/agent/planner/nextBestAction.ts`
- Create: `server/agent/enrichment/websiteEnrichment.ts`
- Create: `server/agent/enrichment/socialEnrichment.ts`
- Create: `server/agent/enrichment/contactEnrichment.ts`
- Create: `server/agent/verification/leadVerification.ts`
- Create: `server/agent/verification/socialProfileVerification.ts`
- Create: `server/agent/verification/evidenceValidation.ts`
- Create: `server/agent/scoring/leadScoring.ts`
- Create: `server/agent/scoring/scoreBreakdown.ts`
- Create: `server/agent/outreach/messageDrafting.ts`
- Create: `server/agent/outreach/followUpPlanning.ts`
- Create: `server/agent/memory/campaignMemory.ts`
- Create: `server/agent/memory/supplierMemory.ts`
- Create: `server/agent/memory/rejectionPatterns.ts`
- Create: `server/agent/discovery/directoryDiscovery.ts`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p /home/samu2505/SAAS/tradenexus-ai-sales-agent/server/agent/{planner,discovery,enrichment,verification,scoring,outreach,memory}
```

- [ ] **Step 2: Write planner stubs**

`server/agent/planner/campaignPlanner.ts`:
```ts
// Phase 5 — Campaign planner: determines which modules to run based on campaign state.
import type { AgentPlan, SearchSession, StrategicContext } from '../types';

export async function createCampaignPlan(
  _session: SearchSession,
  _context?: StrategicContext
): Promise<AgentPlan> {
  throw new Error("Campaign planner not yet implemented (Phase 5)");
}
```

`server/agent/planner/nextBestAction.ts`:
```ts
// Phase 5 — Next best action: recommends next action for a given lead.
import type { Lead, AgentRecommendation } from '../types';

export async function recommendNextActions(_lead: Lead): Promise<AgentRecommendation[]> {
  throw new Error("Next best action not yet implemented (Phase 5)");
}
```

- [ ] **Step 3: Write enrichment stubs**

`server/agent/enrichment/websiteEnrichment.ts`:
```ts
// Phase 4 — Website enrichment: scrapes and extracts structured data from lead websites.
import type { Lead, DiscoveryEvidence } from '../types';

export async function enrichFromWebsite(_lead: Lead): Promise<DiscoveryEvidence[]> {
  throw new Error("Website enrichment not yet implemented (Phase 4)");
}
```

`server/agent/enrichment/socialEnrichment.ts`:
```ts
// Phase 2 — Social enrichment: enriches leads with social profile details.
import type { Lead, SocialProfileEvidence } from '../types';

export async function enrichSocialProfiles(_lead: Lead): Promise<SocialProfileEvidence[]> {
  throw new Error("Social enrichment not yet implemented (Phase 2)");
}
```

`server/agent/enrichment/contactEnrichment.ts`:
```ts
// Phase 4 — Contact enrichment: finds email/phone/contact details for leads.
import type { Lead } from '../types';

export interface ContactInfo {
  email?: string;
  phone?: string;
  contactName?: string;
  source: string;
  confidence: number;
}

export async function enrichContactInfo(_lead: Lead): Promise<ContactInfo[]> {
  throw new Error("Contact enrichment not yet implemented (Phase 4)");
}
```

- [ ] **Step 4: Write verification stubs**

`server/agent/verification/leadVerification.ts`:
```ts
// Phase 4 — Lead verification: runs multi-check verification on a lead.
import type { Lead, ProductDetails, LeadVerification } from '../types';

export async function verifyLead(
  _lead: Lead,
  _product?: ProductDetails
): Promise<LeadVerification> {
  throw new Error("Lead verification not yet implemented (Phase 4)");
}
```

`server/agent/verification/socialProfileVerification.ts`:
```ts
// Phase 4 — Social profile verification: checks if social profiles genuinely belong to the company.
import type { SocialProfileEvidence } from '../types';

export async function verifySocialProfile(
  _profile: SocialProfileEvidence
): Promise<SocialProfileEvidence> {
  throw new Error("Social profile verification not yet implemented (Phase 4)");
}
```

`server/agent/verification/evidenceValidation.ts`:
```ts
// Phase 4 — Evidence validation: cross-references evidence for conflicts.
import type { DiscoveryEvidence } from '../types';

export interface EvidenceConflict {
  evidenceA: string;
  evidenceB: string;
  field: string;
  description: string;
}

export async function validateEvidence(
  _evidence: DiscoveryEvidence[]
): Promise<EvidenceConflict[]> {
  throw new Error("Evidence validation not yet implemented (Phase 4)");
}
```

- [ ] **Step 5: Write scoring stubs**

`server/agent/scoring/leadScoring.ts`:
```ts
// Phase 4 — Lead scoring: generates structured score breakdown from evidence.
import type { Lead, ProductDetails, LeadScoreBreakdown } from '../types';

export async function scoreLead(
  _lead: Lead,
  _product?: ProductDetails
): Promise<LeadScoreBreakdown> {
  throw new Error("Lead scoring not yet implemented (Phase 4)");
}
```

`server/agent/scoring/scoreBreakdown.ts`:
```ts
// Phase 4 — Score breakdown: utilities for computing and explaining subscores.
import type { LeadScoreBreakdown } from '../types';

export function formatScoreBreakdown(_score: LeadScoreBreakdown): string {
  throw new Error("Score breakdown formatting not yet implemented (Phase 4)");
}
```

- [ ] **Step 6: Write outreach stubs**

`server/agent/outreach/messageDrafting.ts`:
```ts
// Phase 6 — Message drafting: generates platform-specific outreach drafts from evidence.
import type { Lead, StrategicContext, OutreachDraft, OutreachDraftType } from '../types';

export async function generateOutreachDraft(
  _lead: Lead,
  _type: OutreachDraftType,
  _context?: StrategicContext
): Promise<OutreachDraft> {
  throw new Error("Outreach drafting not yet implemented (Phase 6)");
}
```

`server/agent/outreach/followUpPlanning.ts`:
```ts
// Phase 6 — Follow-up planning: suggests follow-up cadence and timing.
import type { Lead, AgentRecommendation } from '../types';

export async function planFollowUp(_lead: Lead): Promise<AgentRecommendation> {
  throw new Error("Follow-up planning not yet implemented (Phase 6)");
}
```

- [ ] **Step 7: Write memory stubs**

`server/agent/memory/campaignMemory.ts`:
```ts
// Phase 5 — Campaign memory: records and retrieves campaign-level learning events.
import type { CampaignMemory, MemoryEvent } from '../types';

let _memory: CampaignMemory = {
  events: [],
  preferredLeadPatterns: [],
  rejectedLeadPatterns: [],
  strongRegions: [],
  weakRegions: [],
  platformUsefulness: {},
  buyerTypePerformance: {},
  updatedAt: Date.now(),
};

export function getCampaignMemory(): CampaignMemory {
  return _memory;
}

export function recordMemoryEvent(_event: MemoryEvent): void {
  throw new Error("Campaign memory recording not yet implemented (Phase 5)");
}

export function resetCampaignMemory(): void {
  throw new Error("Campaign memory reset not yet implemented (Phase 5)");
}
```

`server/agent/memory/supplierMemory.ts`:
```ts
// Phase 5 — Supplier memory: captures supplier preferences and patterns across campaigns.
import type { CampaignMemory } from '../types';

export async function mergeSupplierMemory(
  _existing: CampaignMemory,
  _campaignMemory: CampaignMemory
): Promise<CampaignMemory> {
  throw new Error("Supplier memory not yet implemented (Phase 5)");
}
```

`server/agent/memory/rejectionPatterns.ts`:
```ts
// Phase 5 — Rejection patterns: analyzes rejected leads to identify patterns.
import type { Lead, CampaignMemory } from '../types';

export async function analyzeRejectionPatterns(
  _rejectedLeads: Lead[]
): Promise<Partial<CampaignMemory>> {
  throw new Error("Rejection pattern analysis not yet implemented (Phase 5)");
}
```

- [ ] **Step 8: Write directory discovery stub**

`server/agent/discovery/directoryDiscovery.ts`:
```ts
// Phase 3+ — Directory discovery: searches business directories and company registries.
import type { ProductDetails, DiscoveryEvidence } from '../types';

export async function discoverFromDirectories(
  _product: ProductDetails
): Promise<DiscoveryEvidence[]> {
  throw new Error("Directory discovery not yet implemented (Phase 3+)");
}
```

- [ ] **Step 9: Verify TypeScript compiles all stubs**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors across the project

- [ ] **Step 10: Commit**

```bash
git add server/agent/
git commit -m "feat: add agent module stubs for all 6 phases (planner, discovery, enrichment, verification, scoring, outreach, memory)"
```

---

### Task 6: Implement webDiscovery.ts (wrap existing searchForLeads in evidence)

**Files:**
- Create: `server/agent/discovery/webDiscovery.ts`
- Modify: `server/geminiService.ts` (no changes needed — webDiscovery wraps it)

- [ ] **Step 1: Write webDiscovery.ts**

```ts
// server/agent/discovery/webDiscovery.ts
// Phase 1 — Wraps existing searchForLeads, attaches DiscoveryEvidence to each lead.

import { v4 as uuidv4 } from 'uuid';
import { searchForLeads as searchForLeadsRaw } from '../../geminiService';
import type { Lead, ProductDetails, DiscoveryEvidence } from '../types';

export async function discoverLeadsFromWeb(product: ProductDetails): Promise<Lead[]> {
  const leads = await searchForLeadsRaw(product);

  const now = Date.now();

  return leads.map((lead) => {
    const evidenceRecords: DiscoveryEvidence[] = [];

    // Wrap source URL as web evidence
    if (lead.sourceUrl) {
      evidenceRecords.push({
        id: uuidv4(),
        sourceType: 'web',
        url: lead.sourceUrl,
        title: lead.companyName,
        snippet: lead.summary,
        confidence: lead.confidenceScore / 100,
        foundAt: now,
        foundBy: 'webDiscovery',
        validationStatus: 'UNVERIFIED',
        extractedFields: {
          companyName: lead.companyName,
          website: lead.website || '',
          region: lead.region,
          address: lead.address || '',
        },
      });
    }

    // Wrap Google Maps URL as maps evidence
    if (lead.googleMapsUrl) {
      evidenceRecords.push({
        id: uuidv4(),
        sourceType: 'maps',
        url: lead.googleMapsUrl,
        title: lead.companyName,
        snippet: lead.address,
        confidence: 0.9,
        foundAt: now,
        foundBy: 'mapsDiscovery',
        validationStatus: 'UNVERIFIED',
        extractedFields: {
          address: lead.address || '',
          companyName: lead.companyName,
        },
      });
    }

    // Wrap sources array items as additional web evidence
    if (lead.sources && lead.sources.length > 0) {
      for (const sourceUrl of lead.sources) {
        if (sourceUrl && sourceUrl !== lead.sourceUrl) {
          evidenceRecords.push({
            id: uuidv4(),
            sourceType: 'web',
            url: sourceUrl,
            confidence: 0.7,
            foundAt: now,
            foundBy: 'webDiscovery',
            validationStatus: 'UNVERIFIED',
          });
        }
      }
    }

    return {
      ...lead,
      evidence: evidenceRecords,
      lastAgentAction: 'webDiscovery',
    };
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/agent/discovery/webDiscovery.ts
git commit -m "feat: implement webDiscovery module wrapping searchForLeads with evidence records"
```

---

### Task 7: Implement mapsDiscovery.ts (standalone maps evidence extraction)

**Files:**
- Create: `server/agent/discovery/mapsDiscovery.ts`

- [ ] **Step 1: Write mapsDiscovery.ts**

```ts
// server/agent/discovery/mapsDiscovery.ts
// Phase 1 — Extracts maps-related evidence from existing lead data.

import { v4 as uuidv4 } from 'uuid';
import type { Lead, DiscoveryEvidence } from '../types';

export async function extractMapsEvidence(lead: Lead): Promise<DiscoveryEvidence[]> {
  const evidence: DiscoveryEvidence[] = [];
  const now = Date.now();

  if (lead.googleMapsUrl) {
    evidence.push({
      id: uuidv4(),
      sourceType: 'maps',
      url: lead.googleMapsUrl,
      title: lead.companyName,
      snippet: lead.address,
      confidence: 0.9,
      foundAt: now,
      foundBy: 'mapsDiscovery',
      validationStatus: 'UNVERIFIED',
      extractedFields: {
        companyName: lead.companyName,
        address: lead.address || '',
        region: lead.region,
      },
    });
  }

  return evidence;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/agent/discovery/mapsDiscovery.ts
git commit -m "feat: implement mapsDiscovery module for maps evidence extraction"
```

---

### Task 8: Create socialDiscovery.ts stub (Phase 2 preparation)

**Files:**
- Create: `server/agent/discovery/socialDiscovery.ts`

- [ ] **Step 1: Write socialDiscovery.ts with typed signatures**

This is a stub for Phase 2, but with the full typed interface so consumers can import it:

```ts
// server/agent/discovery/socialDiscovery.ts
// Phase 2 — Social media discovery for known companies and social-first lead discovery.

import type { SocialProfileEvidence, StrategicContext } from '../types';

export async function discoverSocialForCompany(
  _companyName: string,
  _region: string,
  _website?: string,
  _productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> {
  throw new Error("Social discovery not yet implemented (Phase 2)");
}

export async function discoverLeadsFromSocial(
  _productName: string,
  _region: string,
  _productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> {
  throw new Error("Social-first lead discovery not yet implemented (Phase 3)");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/agent/discovery/socialDiscovery.ts
git commit -m "feat: add socialDiscovery stub with typed signatures for Phase 2"
```

---

### Task 9: Create client-side service wrappers

**Files:**
- Create: `services/agent/socialDiscoveryService.ts`
- Create: `services/agent/verificationService.ts`
- Create: `services/agent/leadScoringService.ts`

- [ ] **Step 1: Create services/agent/ directory**

```bash
mkdir -p /home/samu2505/SAAS/tradenexus-ai-sales-agent/services/agent
```

- [ ] **Step 2: Write socialDiscoveryService.ts**

```ts
// services/agent/socialDiscoveryService.ts
// Client-side wrapper for social discovery API endpoints.

import type { SocialProfileEvidence } from '../../types/evidenceTypes';
import type { StrategicContext } from '../../types';

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const discoverSocialForCompany = async (
  companyName: string,
  region: string,
  website?: string,
  productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> => {
  const { profiles } = await postJson<{ profiles: SocialProfileEvidence[] }>(
    '/api/agent/social-discovery/company',
    { companyName, region, website, productContext }
  );
  return profiles;
};

export const discoverLeadsFromSocial = async (
  productName: string,
  region: string,
  productContext?: StrategicContext
): Promise<SocialProfileEvidence[]> => {
  const { profiles } = await postJson<{ profiles: SocialProfileEvidence[] }>(
    '/api/agent/social-discovery/region',
    { productName, region, productContext }
  );
  return profiles;
};
```

- [ ] **Step 3: Write verificationService.ts**

```ts
// services/agent/verificationService.ts
// Client-side wrapper for lead verification API endpoint.

import type { LeadVerification } from '../../types/evidenceTypes';
import type { Lead, ProductDetails } from '../../types';

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const verifyLead = async (
  lead: Lead,
  product?: ProductDetails
): Promise<LeadVerification> => {
  const { verification } = await postJson<{ verification: LeadVerification }>(
    '/api/agent/verify-lead',
    { lead, product }
  );
  return verification;
};
```

- [ ] **Step 4: Write leadScoringService.ts**

```ts
// services/agent/leadScoringService.ts
// Client-side wrapper for lead scoring API endpoint.

import type { LeadScoreBreakdown } from '../../types/evidenceTypes';
import type { Lead, ProductDetails } from '../../types';

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const scoreLead = async (
  lead: Lead,
  product?: ProductDetails
): Promise<LeadScoreBreakdown> => {
  const { score } = await postJson<{ score: LeadScoreBreakdown }>(
    '/api/agent/score-lead',
    { lead, product }
  );
  return score;
};
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add services/agent/
git commit -m "feat: add client-side agent service wrappers (socialDiscovery, verification, scoring)"
```

---

### Task 10: Add new API route stubs to server/index.ts

**Files:**
- Modify: `server/index.ts:26-77`

- [ ] **Step 1: Add import for agent modules**

After the existing `const ai = await import("./geminiService");` line, add:

```ts
// Agent module imports (Phase 1+ — stubs throw until their phase is implemented)
const agentSocialDiscovery = await import("./agent/discovery/socialDiscovery");
const agentVerification = await import("./agent/verification/leadVerification");
const agentScoring = await import("./agent/scoring/leadScoring");
```

- [ ] **Step 2: Add new route handlers**

After the existing `/api/ai/verify-lead` route block and before the `if (isProduction)` block, add:

```ts
// --- Agent Pipeline Routes (Phase 1+) ---

// Phase 2: Social discovery for a known company
app.post("/api/agent/social-discovery/company", asyncRoute(async (req, res) => {
  const { companyName, region, website, productContext } = req.body;
  const profiles = await agentSocialDiscovery.discoverSocialForCompany(
    companyName,
    region,
    website,
    productContext
  );
  res.json({ profiles });
}));

// Phase 3: Social-first lead discovery by region
app.post("/api/agent/social-discovery/region", asyncRoute(async (req, res) => {
  const { productName, region, productContext } = req.body;
  const profiles = await agentSocialDiscovery.discoverLeadsFromSocial(
    productName,
    region,
    productContext
  );
  res.json({ profiles });
}));

// Phase 4: Structured lead verification
app.post("/api/agent/verify-lead", asyncRoute(async (req, res) => {
  const { lead, product } = req.body;
  const verification = await agentVerification.verifyLead(lead, product);
  res.json({ verification });
}));

// Phase 4: Lead scoring with breakdown
app.post("/api/agent/score-lead", asyncRoute(async (req, res) => {
  const { lead, product } = req.body;
  const score = await agentScoring.scoreLead(lead, product);
  res.json({ score });
}));

// Phase 5: Next best action recommendation
app.post("/api/agent/next-best-action", asyncRoute(async (_req, res) => {
  res.status(501).json({ error: "Next best action not yet implemented (Phase 5)" });
}));

// Phase 6: Outreach draft generation
app.post("/api/agent/outreach-draft", asyncRoute(async (_req, res) => {
  res.status(501).json({ error: "Outreach drafting not yet implemented (Phase 6)" });
}));
```

- [ ] **Step 3: Verify TypeScript compiles and server starts**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/index.ts
git commit -m "feat: add /api/agent/* route stubs to Express server"
```

---

### Task 11: Integration smoke test

**Files:**
- No files changed — verification step only

- [ ] **Step 1: Start the dev server**

```bash
cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npm run dev &
```

Wait a few seconds for the server to start.

- [ ] **Step 2: Test health endpoint**

Run: `curl -s http://localhost:3000/api/health`
Expected: `{"ok":true}`

- [ ] **Step 3: Test that a Phase 2+ stub returns 500 (not implemented)**

Run: `curl -s -X POST http://localhost:3000/api/agent/social-discovery/company -H "Content-Type: application/json" -d '{"companyName":"test","region":"Germany"}'`
Expected: 500 error about "not yet implemented"

- [ ] **Step 4: Test that a Phase 5+ stub returns 501 (not implemented)**

Run: `curl -s -X POST http://localhost:3000/api/agent/next-best-action -H "Content-Type: application/json" -d '{}'`
Expected: `{"error":"Next best action not yet implemented (Phase 5)"}`

- [ ] **Step 5: Test that existing search endpoint still works**

Run: `curl -s -X POST http://localhost:3000/api/ai/search-leads -H "Content-Type: application/json" -d '{"product":{"name":"Solar Panels","targetRegion":"Germany"}}'`
Expected: Returns `{"leads":[...]}` with the new `evidence` field on each lead

- [ ] **Step 6: Stop the dev server**

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 7: Verify TypeScript compiles clean one final time**

Run: `cd /home/samu2505/SAAS/tradenexus-ai-sales-agent && npx tsc --noEmit`
Expected: No errors

---

## Self-Review Checklist

1. **Spec coverage:** All Phase 1 requirements from the design spec are covered — evidence types (Task 1), agent types (Task 2), optional fields on Lead/SearchSession (Task 3), server/agent/ directory with stubs (Tasks 4-5), webDiscovery wrapping existing search (Task 6), mapsDiscovery (Task 7), socialDiscovery stub (Task 8), client-side wrappers (Task 9), API routes (Task 10), smoke test (Task 11).

2. **Placeholder scan:** No TBDs, TODOs, or vague instructions. Every task has exact code and commands.

3. **Type consistency:** `DiscoveryEvidence` defined in Task 1, used in Tasks 6-8. `SocialProfileEvidence` defined in Task 1, used in Task 8. All imports consistent across server and client files. The `Lead` type extensions in Task 3 match the fields accessed in Task 6 (`evidence`, `lastAgentAction`).
