import { NextRequest, NextResponse } from "next/server";
import { calculateConfidence } from "@/lib/confidence";
import { getCached, setCached } from "@/lib/cache";
import { decomposeQuery } from "@/lib/decompose";
import { search } from "@/lib/search";
import { synthesizeResearch } from "@/lib/synthesize";

function deduplicateByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function streamChunk(
  controller: ReadableStreamDefaultController<Uint8Array>,
  data: string
) {
  controller.enqueue(new TextEncoder().encode(data));
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

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const cached = await getCached(trimmed);
          if (cached) {
            streamChunk(
              controller,
              JSON.stringify({ type: "result", data: cached, fromCache: true }) + "\n"
            );
            controller.close();
            return;
          }

          streamChunk(
            controller,
            JSON.stringify({ type: "status", message: "Decomposing query…" }) + "\n"
          );

          const subqueries = await decomposeQuery(trimmed);

          streamChunk(
            controller,
            JSON.stringify({ type: "status", message: "Retrieving sources…" }) + "\n"
          );

          const resultsArrays = await Promise.all(
            subqueries.map((sub) => search(sub))
          );
          const combined = resultsArrays.flat();
          const deduplicated = deduplicateByUrl(combined);
          const topSources = deduplicated.slice(0, 8);

          streamChunk(
            controller,
            JSON.stringify({ type: "status", message: "Synthesizing analysis…" }) + "\n"
          );

          const synthesis = await synthesizeResearch(trimmed, topSources);
          const confidenceScore = calculateConfidence(topSources, synthesis);
          const confidence =
            Math.round((confidenceScore / 10) * 100) / 100;

          const result = {
            summary: synthesis.summary,
            keyInsights: synthesis.keyInsights,
            contradictions: synthesis.contradictions,
            confidence,
            sources: topSources.map((r) => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            })),
            limitations: synthesis.limitations,
          };

          await setCached(trimmed, result);

          streamChunk(
            controller,
            JSON.stringify({ type: "result", data: result, fromCache: false }) + "\n"
          );
          controller.close();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Research failed.";
          streamChunk(
            controller,
            JSON.stringify({ type: "error", error: message }) + "\n"
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
