// Phase 5 — Next best action: recommends next action for a given lead.
import type { Lead, AgentRecommendation } from '../types';

export async function recommendNextActions(_lead: Lead): Promise<AgentRecommendation[]> {
  throw new Error("Next best action not yet implemented (Phase 5)");
}
