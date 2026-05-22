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
