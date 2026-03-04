import { NextRequest, NextResponse } from "next/server";
import { decomposeQuery } from "@/lib/decompose";
import { search } from "@/lib/search";

function deduplicateByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid query string" },
        { status: 400 }
      );
    }

    const trimmed = query.trim();

    // 1. Decompose query into subqueries
    const subqueries = await decomposeQuery(trimmed);

    // 2. Run searches in parallel
    const resultsArrays = await Promise.all(
      subqueries.map((sub) => search(sub))
    );

    // 3. Combine all results
    const combined = resultsArrays.flat();

    // 4. Remove duplicate URLs
    const deduplicated = deduplicateByUrl(combined);

    // 5. Limit to top 8 sources
    const sources = deduplicated.slice(0, 8).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }));

    // Placeholder for synthesis (step 7+)
    const response = {
      summary: `Research results for: "${trimmed}". Synthesis step not yet implemented.`,
      keyInsights: [
        "First key insight based on retrieved sources",
        "Second notable finding",
        "Third important point",
      ],
      contradictions: ["Some sources disagree on this aspect"],
      confidence: 0.75,
      sources,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
