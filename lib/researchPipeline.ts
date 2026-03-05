import { decomposeQuery } from "@/lib/decompose";
import { search } from "@/lib/search";
import { synthesizeResearch } from "@/lib/synthesize";
import { calculateConfidence } from "@/lib/confidence";

export type ReasoningTraceStep =
  | { type: "query"; label: string; text: string }
  | { type: "reading"; title: string };

export interface ResearchPipelineResult {
  mode: "research";
  summary: string;
  keyInsights: string[];
  contradictions: string[];
  confidence: number;
  sources: { title: string; url: string }[];
  reasoningTrace: ReasoningTraceStep[];
}

function deduplicateByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/**
 * Main research pipeline: decompose → search (per subquery) → deduplicate → synthesize.
 * Builds a reasoning trace (queries + sources read) and returns structured result.
 */
export async function runResearchMode(query: string): Promise<ResearchPipelineResult> {
  const trimmed = query?.trim();
  if (!trimmed) {
    throw new Error("Query must be a non-empty string.");
  }

  const subqueries = await decomposeQuery(trimmed);
  const reasoningTrace: ReasoningTraceStep[] = subqueries.map((q, i) => ({
    type: "query",
    label: `Query ${i + 1}`,
    text: q,
  }));

  const resultsArrays = await Promise.all(subqueries.map((q) => search(q)));
  const combined = resultsArrays.flat();
  const deduplicated = deduplicateByUrl(combined);
  const topSources = deduplicated.slice(0, 5);

  topSources.forEach((s) => {
    reasoningTrace.push({ type: "reading", title: s.title });
  });

  if (topSources.length === 0) {
    return {
      mode: "research",
      summary: "No sources found for this query.",
      keyInsights: [],
      contradictions: [],
      confidence: 0,
      sources: [],
      reasoningTrace,
    };
  }

  const synthesis = await synthesizeResearch(trimmed, topSources);
  const confidenceScore = calculateConfidence(topSources, synthesis);
  const confidence = Math.round((confidenceScore / 10) * 100) / 100;

  return {
    mode: "research",
    summary: synthesis.summary,
    keyInsights: synthesis.keyInsights,
    contradictions: synthesis.contradictions,
    confidence,
    sources: topSources.map((s) => ({ title: s.title, url: s.url })),
    reasoningTrace,
  };
}
