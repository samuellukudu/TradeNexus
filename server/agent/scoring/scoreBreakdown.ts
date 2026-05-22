// server/agent/scoring/scoreBreakdown.ts
// Phase 4 — Score breakdown formatting and utility functions.

import type { LeadScoreBreakdown } from '../types.js';

const DIMENSION_LABELS: Record<string, string> = {
  overall: 'Overall',
  locationFit: 'Location Fit',
  productFit: 'Product Fit',
  buyerTypeFit: 'Buyer Type',
  companySizeFit: 'Company Size',
  evidenceQuality: 'Evidence Quality',
  socialActivity: 'Social Activity',
  contactability: 'Contactability',
  competitiveOpportunity: 'Competitive Gap',
  freshness: 'Freshness',
  rationale: 'Rationale',
  updatedAt: 'Updated',
};

export function formatScoreBreakdown(score: LeadScoreBreakdown): string {
  const lines: string[] = [];
  const dims: (keyof LeadScoreBreakdown)[] = [
    'overall', 'locationFit', 'productFit', 'buyerTypeFit', 'companySizeFit',
    'evidenceQuality', 'socialActivity', 'contactability', 'competitiveOpportunity', 'freshness'
  ];

  for (const dim of dims) {
    const value = score[dim] as number;
    const bar = scoreBar(value);
    const label = DIMENSION_LABELS[dim] || dim;
    lines.push(`${label.padEnd(22)} ${bar} ${value}/100`);
  }

  if (score.rationale) {
    lines.push('');
    lines.push(`Rationale: ${score.rationale}`);
  }

  return lines.join('\n');
}

export function scoreBar(value: number, width: number = 10): string {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function scoreColor(value: number): string {
  if (value >= 80) return '#34d399';
  if (value >= 60) return '#fbbf24';
  if (value >= 40) return '#f97316';
  return '#ef4444';
}

export function getScoreLabel(value: number): string {
  if (value >= 80) return 'Strong';
  if (value >= 60) return 'Good';
  if (value >= 40) return 'Fair';
  return 'Weak';
}
