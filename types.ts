import { DiscoveryEvidence, SocialProfileEvidence, LeadSocialOrigin, LeadVerification, LeadScoreBreakdown } from './types/evidenceTypes';
import { AgentRecommendation, OutreachDraft, AgentPlan, CampaignMemory } from './types/agentTypes';
import { ProductRole } from './types/applicationTypes';

export interface ProductAsset {
  data: string; // Base64 string without data prefix
  mimeType: string;
  fileName?: string;
}

export type TargetAudienceType = 'Distributors/Importers' | 'OEMs/Manufacturers' | 'End Users' | 'All';

export interface SupplierProfile {
  companyName: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyDescription?: string;
  valueProposition?: string;
}

// NEW: Structured Memory Block
export interface StrategicContext {
  productIdentity: string;
  technicalSpecs: string[];
  certifications: string[];
  idealBuyer: string;
  exclusions: string;
  valueProposition: string;
}

export interface ProductDetails {
  name: string;
  description?: string;
  targetRegion?: string;
  pricePoint?: string;
  targetCompanySize?: string; 
  targetLeadCount?: number;
  targetAudience?: TargetAudienceType;
  supplierCountry?: string;
  assets?: ProductAsset[]; 
  // REPLACED: searchContext (string) -> strategicContext (Structured Object)
  strategicContext?: StrategicContext;
  // Application-Led Discovery: product role classification for search targeting
  productRole?: ProductRole;
}

export interface MarketReportSource {
  title: string;
  url: string;
}

export interface StatPoint {
  label: string;
  value: number; // Percentage or Absolute value
}

export interface MarketStats {
  competitorShare: StatPoint[];
  growthTrend: StatPoint[];
  userSegments: StatPoint[];
}

export interface MarketReport {
  region: string;
  overview: string;
  marketSize: string;
  buyingHabits: string;
  competitors: string[];
  regulations: string;
  entryStrategy: string;
  hsCode: string;
  importDuty: string;
  shippingTime: string;
  priceStructure: string;
  tradeShows: string[];
  localization: string;
  sources?: MarketReportSource[];
  stats?: MarketStats;
}

export interface RegionSuggestion {
  region: string;
  reason: string;
  demandLevel: 'High' | 'Medium' | 'Low';
  targetLeadCount?: number;
  reportStatus?: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  report?: MarketReport;
}

export enum LeadStatus {
  DISCOVERED = 'DISCOVERED',
  CONTACTING = 'CONTACTING',
  NEGOTIATING = 'NEGOTIATING',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export interface InteractionLog {
  timestamp: string;
  actor: 'AGENT' | 'CLIENT' | 'SYSTEM';
  message: string;
  tactic?: string;
}

export interface MatchDetails {
  industryFit: string;
  sizeFit: string;
  locationFit: string;
}

export interface SocialProfile {
  platform: string;
  url: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Competitor {
  name: string;
  strengths: string;
  weaknesses: string;
  displacementStrategy: string;
}

export interface Lead {
  id: string;
  companyName: string;
  website?: string;
  region: string;
  status: LeadStatus;
  confidenceScore: number;
  matchDetails?: MatchDetails;
  logs: InteractionLog[];
  chatHistory?: ChatMessage[];
  contactInfo?: string;
  summary?: string;
  socialProfiles?: SocialProfile[];
  employeeCount?: string;
  revenue?: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  sourceUrl?: string;
  googleMapsUrl?: string;
  isNew?: boolean;
  searchVector?: string;
  tradeVolume?: string;
  manufacturingVolume?: string;
  nextSteps?: string;
  applicationId?: string;
  application?: string;
  buyerType?: string;
  searchLane?: string;
  competitors?: Competitor[];
  verificationStatus?: 'UNVERIFIED' | 'VERIFYING' | 'VERIFIED' | 'FAILED';
  verificationNotes?: string;
  sources?: string[];
  // Phase 1+ — Modular agent evidence fields
  evidence?: DiscoveryEvidence[];
  socialDiscovery?: SocialProfileEvidence[];
  socialOrigin?: LeadSocialOrigin;
  // Phase 4
  verification?: LeadVerification | null;
  scoreBreakdown?: LeadScoreBreakdown | null;
  // Phase 5
  recommendations?: AgentRecommendation[];
  // Phase 6
  outreachDrafts?: OutreachDraft[];
  lastAgentAction?: string;
}

export interface AgentAction {
  type: 'SEARCHING' | 'ANALYZING' | 'DRAFTING' | 'IDLE';
  details: string;
}

export interface SearchSession {
  id: string;
  createdAt: number;
  name: string;
  productDescription?: string;
  config: {
    continent: string;
    countries: string[];
    targetCompanySize?: string;
    targetLeadCount?: number;
    targetAudience?: TargetAudienceType;
    supplierCountry?: string;
  };
  suggestions: RegionSuggestion[];
  leads: Lead[];
  isAutoPilotEnabled?: boolean;
  lastScoutTime?: number;
  // NEW: Store the structured memory map
  strategicContext?: StrategicContext;
  // Application-Led Discovery: product role classification persists on the session
  // so deployScout and autopilot can reuse it without re-classifying.
  productRole?: ProductRole;
  // Phase 5+ — Agent pipeline fields
  agentPlan?: AgentPlan | null;
  memory?: CampaignMemory | null;
  lastAgentRunAt?: number;
  agentVersion?: string;
}
