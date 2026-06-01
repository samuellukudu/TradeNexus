// types/agentTypes.ts
// Shared agent pipeline types for planning, recommendations, memory, and outreach.

import { DiscoveryEvidence, SocialProfileEvidence } from './evidenceTypes';
import { CountryApplicationMap } from './applicationTypes';

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
  applicationMapHistory?: CountryApplicationMap[];
  updatedAt: number;
}
