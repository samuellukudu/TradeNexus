// Phase 5 — Campaign memory: records and retrieves campaign-level learning events.
import type { CampaignMemory, MemoryEvent } from '../types.js';

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

export function recordMemoryEvent(event: MemoryEvent): void {
  _memory.events.push(event);
  _memory.updatedAt = Date.now();

  // Derive patterns from accumulated events
  if (event.type === 'LEAD_ACCEPTED' && event.details) {
    if (!_memory.preferredLeadPatterns.includes(event.details)) {
      _memory.preferredLeadPatterns.push(event.details);
    }
  }

  if (event.type === 'LEAD_REJECTED' && event.details) {
    if (!_memory.rejectedLeadPatterns.includes(event.details)) {
      _memory.rejectedLeadPatterns.push(event.details);
    }
  }

  if (event.type === 'SOCIAL_PROFILE_USEFUL' && event.details) {
    const platform = event.details;
    _memory.platformUsefulness[platform] = (_memory.platformUsefulness[platform] || 0) + 1;
  }

  if (event.type === 'SOCIAL_PROFILE_IRRELEVANT' && event.details) {
    const platform = event.details;
    _memory.platformUsefulness[platform] = (_memory.platformUsefulness[platform] || 0) - 1;
  }
}

export function resetCampaignMemory(): void {
  _memory = {
    events: [],
    preferredLeadPatterns: [],
    rejectedLeadPatterns: [],
    strongRegions: [],
    weakRegions: [],
    platformUsefulness: {},
    buyerTypePerformance: {},
    updatedAt: Date.now(),
  };
}
