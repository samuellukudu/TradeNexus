// Phase 5 — Campaign planner: determines which modules to run based on campaign state.
import type { AgentPlan, AgentPlanStep, SearchSession, StrategicContext } from '../types.js';

export async function createCampaignPlan(
  session: SearchSession,
  _context?: StrategicContext
): Promise<AgentPlan> {
  const now = Date.now();
  const steps: AgentPlanStep[] = [];
  const leads = session.leads || [];

  const addStep = (state: AgentPlanStep['state'], label: string): AgentPlanStep => ({
    state,
    label,
    status: 'PENDING',
  });

  // Step 1: Always analyze context first
  steps.push(addStep('ANALYZE_CONTEXT', 'Analyze product context and target markets'));

  // Step 2: Discover markets if no region suggestions exist
  if (!session.regionSuggestions || session.regionSuggestions.length === 0) {
    steps.push(addStep('DISCOVER_MARKETS', 'Discover target markets and regions'));
  }

  // Step 3: Discover leads if none exist or all are DISCOVERED with low count
  if (leads.length === 0) {
    steps.push(addStep('DISCOVER_LEADS', 'Search for potential leads'));
    steps.push(addStep('DISCOVER_SOCIAL', 'Find leads through social platforms'));
  } else if (leads.length < 10) {
    steps.push(addStep('DISCOVER_LEADS', 'Expand lead pool — currently under 10 leads'));
  }

  // Step 4: Enrich leads that lack evidence or social profiles
  const unenrichedCount = leads.filter(l => !l.evidence || l.evidence.length === 0).length;
  const noSocialCount = leads.filter(l => !l.socialDiscovery || l.socialDiscovery.length === 0).length;
  if (unenrichedCount > 0 || noSocialCount > 0) {
    steps.push(addStep('ENRICH_LEADS', `Enrich ${unenrichedCount + noSocialCount} leads with evidence and social data`));
  }

  // Step 5: Verify leads that haven't been verified
  const unverifiedCount = leads.filter(l => !l.verification).length;
  if (unverifiedCount > 0) {
    steps.push(addStep('VERIFY_LEADS', `Verify ${unverifiedCount} unverified leads`));
  }

  // Step 6: Score leads that haven't been scored
  const unscoredCount = leads.filter(l => !l.scoreBreakdown).length;
  if (unscoredCount > 0) {
    steps.push(addStep('SCORE_LEADS', `Score ${unscoredCount} unscored leads`));
  }

  // Step 7: Draft outreach for verified, scored leads with no outreach
  const readyForOutreach = leads.filter(
    l => l.verification && l.scoreBreakdown && (!l.outreachDrafts || l.outreachDrafts.length === 0)
  ).length;
  if (readyForOutreach > 0) {
    steps.push(addStep('DRAFT_OUTREACH', `Draft outreach for ${readyForOutreach} qualified leads`));
  }

  // Step 8: Always end with user approval gate
  steps.push(addStep('AWAIT_USER_APPROVAL', 'Review and approve next actions'));

  const plan: AgentPlan = {
    id: `plan-${session.id || 'unknown'}-${now}`,
    campaignId: session.id || 'unknown',
    steps,
    currentStep: 0,
    createdAt: now,
    updatedAt: now,
  };

  return plan;
}
