// Phase 4 — Evidence validation: cross-references evidence for conflicts.
import type { DiscoveryEvidence } from '../types';

export interface EvidenceConflict {
  evidenceA: string;
  evidenceB: string;
  field: string;
  description: string;
}

export async function validateEvidence(
  _evidence: DiscoveryEvidence[]
): Promise<EvidenceConflict[]> {
  throw new Error("Evidence validation not yet implemented (Phase 4)");
}
