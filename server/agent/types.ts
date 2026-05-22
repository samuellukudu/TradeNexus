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
