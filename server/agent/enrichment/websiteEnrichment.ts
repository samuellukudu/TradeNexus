// Phase 4 — Website enrichment: scrapes and extracts structured data from lead websites.
import type { Lead, DiscoveryEvidence } from '../types';

export async function enrichFromWebsite(_lead: Lead): Promise<DiscoveryEvidence[]> {
  throw new Error("Website enrichment not yet implemented (Phase 4)");
}
