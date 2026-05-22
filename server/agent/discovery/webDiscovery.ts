// server/agent/discovery/webDiscovery.ts
// Phase 1 — Wraps existing searchForLeads, attaches DiscoveryEvidence to each lead.

import { v4 as uuidv4 } from 'uuid';
import { searchForLeads as searchForLeadsRaw } from '../../geminiService.js';
import type { Lead, ProductDetails, DiscoveryEvidence } from '../types.js';

export async function discoverLeadsFromWeb(product: ProductDetails): Promise<Lead[]> {
  const leads = await searchForLeadsRaw(product);

  const now = Date.now();

  return leads.map((lead) => {
    const evidenceRecords: DiscoveryEvidence[] = [];

    // Wrap source URL as web evidence
    if (lead.sourceUrl) {
      evidenceRecords.push({
        id: uuidv4(),
        sourceType: 'web',
        url: lead.sourceUrl,
        title: lead.companyName,
        snippet: lead.summary,
        confidence: lead.confidenceScore / 100,
        foundAt: now,
        foundBy: 'webDiscovery',
        validationStatus: 'UNVERIFIED',
        extractedFields: {
          companyName: lead.companyName,
          website: lead.website || '',
          region: lead.region,
          address: lead.address || '',
        },
      });
    }

    // Wrap Google Maps URL as maps evidence
    if (lead.googleMapsUrl) {
      evidenceRecords.push({
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
          address: lead.address || '',
          companyName: lead.companyName,
        },
      });
    }

    // Wrap sources array items as additional web evidence
    if (lead.sources && lead.sources.length > 0) {
      for (const sourceUrl of lead.sources) {
        if (sourceUrl && sourceUrl !== lead.sourceUrl) {
          evidenceRecords.push({
            id: uuidv4(),
            sourceType: 'web',
            url: sourceUrl,
            confidence: 0.7,
            foundAt: now,
            foundBy: 'webDiscovery',
            validationStatus: 'UNVERIFIED',
          });
        }
      }
    }

    return {
      ...lead,
      evidence: evidenceRecords,
      lastAgentAction: 'webDiscovery',
    };
  });
}
