// server/agent/discovery/mapsDiscovery.ts
// Phase 1 — Extracts maps-related evidence from existing lead data.

import { v4 as uuidv4 } from 'uuid';
import type { Lead, DiscoveryEvidence } from '../types.js';

export async function extractMapsEvidence(lead: Lead): Promise<DiscoveryEvidence[]> {
  const evidence: DiscoveryEvidence[] = [];
  const now = Date.now();

  if (lead.googleMapsUrl) {
    evidence.push({
      id: uuidv4(),
      sourceType: 'maps',
      url: lead.googleMapsUrl,
      title: lead.companyName,
      snippet: lead.address,
      confidence: 0.9,
      foundAt: now,
      foundBy: 'mapsDiscovery',
      validationStatus: 'UNVERIFIED',
      extractedFields: {
        companyName: lead.companyName,
        address: lead.address || '',
        region: lead.region,
      },
    });
  }

  return evidence;
}
