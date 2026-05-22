// Phase 5 — Campaign memory: records and retrieves campaign-level learning events.
import type { CampaignMemory, MemoryEvent } from '../types';

let _memory: CampaignMemory = {
  events: [],
  preferredLeadPatterns: [],
  rejectedLeadPatterns: [],
  strongRegions: [],
  weakRegions: [],
  platformUsefulness: {},
  buyerTypePerformance: {},
  updatedAt: Date.now(),
};

export function getCampaignMemory(): CampaignMemory {
  return _memory;
}

export function recordMemoryEvent(_event: MemoryEvent): void {
  throw new Error("Campaign memory recording not yet implemented (Phase 5)");
}

export function resetCampaignMemory(): void {
  throw new Error("Campaign memory reset not yet implemented (Phase 5)");
}
