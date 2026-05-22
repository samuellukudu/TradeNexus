// Phase 4 — Lead scoring: generates structured score breakdown from evidence.
import type { Lead, ProductDetails, LeadScoreBreakdown } from '../types';

export async function scoreLead(
  _lead: Lead,
  _product?: ProductDetails
): Promise<LeadScoreBreakdown> {
  throw new Error("Lead scoring not yet implemented (Phase 4)");
}
