// Phase 6 — Message drafting: generates platform-specific outreach drafts from evidence.
import type { Lead, StrategicContext, OutreachDraft, OutreachDraftType } from '../types';

export async function generateOutreachDraft(
  _lead: Lead,
  _type: OutreachDraftType,
  _context?: StrategicContext
): Promise<OutreachDraft> {
  throw new Error("Outreach drafting not yet implemented (Phase 6)");
}
