// Phase 4 — Contact enrichment: finds email/phone/contact details for leads.
import type { Lead } from '../types';

export interface ContactInfo {
  email?: string;
  phone?: string;
  contactName?: string;
  source: string;
  confidence: number;
}

export async function enrichContactInfo(_lead: Lead): Promise<ContactInfo[]> {
  throw new Error("Contact enrichment not yet implemented (Phase 4)");
}
