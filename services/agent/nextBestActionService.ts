// services/agent/nextBestActionService.ts
// Client-side wrapper for next-best-action API endpoint.

import type { AgentRecommendation } from '../../types/agentTypes';
import type { Lead } from '../../types';

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

export const getNextBestActions = async (lead: Lead): Promise<AgentRecommendation[]> => {
  const { recommendations } = await postJson<{ recommendations: AgentRecommendation[] }>(
    '/api/agent/next-best-action',
    { lead }
  );
  return recommendations;
};
