// Phase 2 — Social enrichment: enriches leads with social profile details.
import type { Lead, SocialProfileEvidence } from '../types';

export async function enrichSocialProfiles(_lead: Lead): Promise<SocialProfileEvidence[]> {
  throw new Error("Social enrichment not yet implemented (Phase 2)");
}
