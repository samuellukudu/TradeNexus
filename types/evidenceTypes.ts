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
  | 'whatsapp'
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

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'x' | 'whatsapp' | 'maps' | 'other';

export type SocialProfileType = 'company' | 'employee' | 'founder' | 'reseller' | 'community' | 'unknown';

export type SocialActivityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface SocialProfileEvidence extends DiscoveryEvidence {
  platform: SocialPlatform;
  handle?: string;
  companyName?: string;
  country?: string;
  city?: string;
  sourceQuery?: string;
  isOfficialLikely: boolean;
  profileType: SocialProfileType;
  activityLevel: SocialActivityLevel;
  activityEvidence?: string;
  contactHints?: string[];
  productFitSignals?: string[];
  verificationSignals?: string[];
  badFitSignals?: string[];
  relevanceNotes?: string;
}

export interface LeadSocialOrigin {
  originType: 'social-first';
  primaryProfileUrl: string;
  primaryPlatform: SocialPlatform;
  evidence: SocialProfileEvidence[];
  verificationStatus: 'unverified' | 'partially_verified' | 'verified' | 'rejected';
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
