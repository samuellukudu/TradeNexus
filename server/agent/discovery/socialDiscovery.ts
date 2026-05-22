// server/agent/discovery/socialDiscovery.ts
// Phase 2 — Social media discovery for known companies and social-first lead discovery.

import type { SocialProfileEvidence, StrategicContext } from '../types.js';

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
