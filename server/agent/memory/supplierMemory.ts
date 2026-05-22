// Phase 5 — Supplier memory: captures supplier preferences and patterns across campaigns.
import type { CampaignMemory } from '../types.js';

export async function mergeSupplierMemory(
  existing: CampaignMemory,
  campaignMemory: CampaignMemory
): Promise<CampaignMemory> {
  const now = Date.now();

  // Merge events (newest first), deduplicate by id
  const seenIds = new Set(existing.events.map(e => e.id));
  const newEvents = campaignMemory.events.filter(e => !seenIds.has(e.id));
  const mergedEvents = [...campaignMemory.events, ...existing.events].slice(0, 500);

  // Merge string arrays with dedup
  const mergeStrings = (base: string[], incoming: string[]): string[] => {
    const set = new Set([...incoming, ...base]);
    return Array.from(set);
  };

  // Merge platform usefulness scores (add values)
  const mergedPlatforms: Record<string, number> = { ...existing.platformUsefulness };
  for (const [platform, score] of Object.entries(campaignMemory.platformUsefulness)) {
    mergedPlatforms[platform] = (mergedPlatforms[platform] || 0) + score;
  }

  // Merge buyer type performance scores
  const mergedBuyerTypes: Record<string, number> = { ...existing.buyerTypePerformance };
  for (const [buyerType, score] of Object.entries(campaignMemory.buyerTypePerformance)) {
    mergedBuyerTypes[buyerType] = (mergedBuyerTypes[buyerType] || 0) + score;
  }

  return {
    events: mergedEvents,
    preferredLeadPatterns: mergeStrings(existing.preferredLeadPatterns, campaignMemory.preferredLeadPatterns),
    rejectedLeadPatterns: mergeStrings(existing.rejectedLeadPatterns, campaignMemory.rejectedLeadPatterns),
    strongRegions: mergeStrings(existing.strongRegions, campaignMemory.strongRegions),
    weakRegions: mergeStrings(existing.weakRegions, campaignMemory.weakRegions),
    platformUsefulness: mergedPlatforms,
    buyerTypePerformance: mergedBuyerTypes,
    updatedAt: now,
  };
}
