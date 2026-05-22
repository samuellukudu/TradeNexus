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
