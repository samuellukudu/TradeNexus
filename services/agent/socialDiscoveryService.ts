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
