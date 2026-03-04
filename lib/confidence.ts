import type { SynthesisResult } from "./synthesize";

export interface ConfidenceSource {
  title?: string;
  url?: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const RECENT_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];

/**
 * Calculates a confidence score (1–10) for research synthesis based on
 * source quality and synthesis characteristics.
 *
 * Heuristics:
 * - Source count: More sources → higher confidence (triangulation)
 * - Contradictions: Flagged disagreements → lower confidence
 * - Recency: Sources mentioning recent years → higher confidence
 * - Synthesis depth: More key insights → higher confidence
 */
export function calculateConfidence(
  sources: ConfidenceSource[],
  synthesis: SynthesisResult
): number {
  const sourceCount = sources.length;
  const contradictionCount = synthesis.contradictions?.length ?? 0;
  const keyInsightCount = synthesis.keyInsights?.length ?? 0;

  // Base score: 5/10 (neutral starting point)
  let score = 5;

  // --- Source count (triangulation)
  // More independent sources → stronger evidence base
  if (sourceCount >= 7) score += 2;
  else if (sourceCount >= 5) score += 1;
  else if (sourceCount <= 2) score -= 2;
  else if (sourceCount === 3) score -= 0.5;

  // --- Contradictions (consensus)
  // Flagged disagreements indicate uncertain or conflicting evidence
  if (contradictionCount >= 2) score -= 2;
  else if (contradictionCount === 1) score -= 1;

  // --- Recency (relevance)
  // Sources with recent years in title/url suggest up-to-date info
  const recentSourceCount = sources.filter((s) => {
    const text = `${s.title ?? ""} ${s.url ?? ""}`;
    return RECENT_YEARS.some((y) => text.includes(String(y)));
  }).length;
  if (recentSourceCount >= 3) score += 1;
  else if (recentSourceCount >= 1) score += 0.5;

  // --- Synthesis depth (analytical quality)
  // More key insights suggests substantive synthesis
  if (keyInsightCount >= 3) score += 1;
  else if (keyInsightCount === 0 && sourceCount > 0) score -= 1;

  // Clamp to 1–10
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}
