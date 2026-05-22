// Phase 5 — Campaign planner: determines which modules to run based on campaign state.
import type { AgentPlan, SearchSession, StrategicContext } from '../types';

export async function createCampaignPlan(
  _session: SearchSession,
  _context?: StrategicContext
): Promise<AgentPlan> {
  throw new Error("Campaign planner not yet implemented (Phase 5)");
}
