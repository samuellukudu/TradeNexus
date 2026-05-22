// server/agent/discovery/socialToLead.ts
// Phase 3 — Converts SocialProfileEvidence[] to Lead[] objects.

import { v4 as uuidv4 } from 'uuid';
import type { Lead, SocialProfileEvidence } from '../types.js';
import { LeadStatus } from '../../../types.js';

export const SOCIAL_VECTOR_PREFIX = 'Social:';

export function socialProfilesToLeads(
  profiles: SocialProfileEvidence[],
  region: string
): Lead[] {
  const now = Date.now();

  // Group profiles by company name to avoid duplicates
  const byCompany = new Map<string, SocialProfileEvidence[]>();
  for (const profile of profiles) {
    const name = (profile.extractedFields?.companyName as string) ||
                 profile.title ||
                 'Unknown Company';
    const key = name.toLowerCase().trim();
    if (!byCompany.has(key)) {
      byCompany.set(key, []);
    }
    byCompany.get(key)!.push(profile);
  }

  return Array.from(byCompany.entries()).map(([_, companyProfiles]) => {
    const primary = companyProfiles[0];
    const companyName = (primary.extractedFields?.companyName as string) ||
                        primary.title ||
                        'Unknown Company';
    const website = (primary.extractedFields?.website as string) || undefined;

    // Collect unique platforms for the search vector
    const platforms = [...new Set(companyProfiles.map(p => p.platform))];
    const vectorName = `${SOCIAL_VECTOR_PREFIX} ${platforms.join('/')}`;

    // Extract contact hints from all profiles
    const allContactHints = companyProfiles.flatMap(p => p.contactHints || []);
    const contactInfo = [...new Set(allContactHints)].join(', ') || undefined;

    // Best confidence across all profiles
    const bestConfidence = Math.max(...companyProfiles.map(p => p.confidence));

    // Activity level — best across profiles
    const activityOrder: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'UNKNOWN': 0 };
    const bestActivity = companyProfiles.reduce((best, p) => {
      const score = activityOrder[p.activityLevel] || 0;
      return score > (activityOrder[best] || 0) ? p.activityLevel : best;
    }, 'UNKNOWN' as string);

    const lead: Lead = {
      id: uuidv4(),
      companyName,
      website,
      region,
      status: LeadStatus.DISCOVERED,
      confidenceScore: Math.round(bestConfidence * 100),
      summary: primary.relevanceNotes || primary.snippet,
      socialProfiles: companyProfiles.map(p => ({
        platform: p.platform,
        url: p.url,
      })),
      socialDiscovery: companyProfiles,
      searchVector: vectorName,
      contactInfo,
      employeeCount: (primary.extractedFields?.employeeCount as string) || undefined,
      lastAgentAction: 'socialDiscovery',
      logs: [{
        timestamp: new Date().toLocaleTimeString(),
        actor: 'SYSTEM',
        message: `Lead discovered via social media on ${platforms.join(', ')}.\nActivity Level: ${bestActivity}\nPlatforms found: ${companyProfiles.length} profile(s)`,
      }],
    };

    return lead;
  });
}
