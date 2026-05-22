// services/agent/outreachService.ts
// Client-side wrapper for outreach drafting API endpoints.

import type { OutreachDraft, OutreachDraftType } from '../../types/agentTypes';
import type { Lead, StrategicContext } from '../../types';
import type { ClosingStrategy } from '../../server/agent/outreach/closingStrategy';
import type { OutreachSequence } from '../../server/agent/outreach/followUpPlanning';

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

export const getClosingStrategy = async (
  lead: Lead,
  product?: { name?: string }
): Promise<ClosingStrategy> => {
  const { strategy } = await postJson<{ strategy: ClosingStrategy }>(
    '/api/agent/closing-strategy',
    { lead, product }
  );
  return strategy;
};

export const generateOutreachDraft = async (
  lead: Lead,
  type: OutreachDraftType,
  strategy: ClosingStrategy,
  context?: StrategicContext
): Promise<OutreachDraft> => {
  const { draft } = await postJson<{ draft: OutreachDraft }>(
    '/api/agent/outreach-draft',
    { lead, type, strategy, context }
  );
  return draft;
};

export const getFollowUpSequence = async (
  lead: Lead,
  draftId: string,
  strategy: ClosingStrategy
): Promise<OutreachSequence> => {
  const { sequence } = await postJson<{ sequence: OutreachSequence }>(
    '/api/agent/follow-up-sequence',
    { lead, draftId, strategy }
  );
  return sequence;
};
