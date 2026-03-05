import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/intent";
import { runResearchMode } from "@/lib/researchPipeline";
import { generateArchitecture } from "@/lib/systemDesignPipeline";

/**
 * Test endpoint for intent classifier, research pipeline, and system design.
 *
 * GET /api/test?q=your+query&mode=intent         → classifyIntent
 * GET /api/test?q=your+query&mode=research       → runResearchMode
 * GET /api/test?q=your+query&mode=system_design  → generateArchitecture
 *
 * Or POST with JSON body: { query: string, mode?: "intent" | "research" | "system_design" }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const mode = searchParams.get("mode") || "intent";

  if (!q) {
    return NextResponse.json(
      { error: "Missing query. Use ?q=your+query&mode=intent|research|system_design" },
      { status: 400 }
    );
  }

  try {
    if (mode === "research") {
      const result = await runResearchMode(q);
      return NextResponse.json(result);
    }
    if (mode === "system_design") {
      const result = await generateArchitecture(q);
      return NextResponse.json(result);
    }
    const intent = await classifyIntent(q);
    return NextResponse.json({ query: q, intent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const q = (body?.query ?? body?.q ?? "").toString().trim();
    const mode = body?.mode || "intent";

    if (!q) {
      return NextResponse.json(
        { error: "Missing query in body. Use { query: string, mode?: 'intent' | 'research' }" },
        { status: 400 }
      );
    }

    if (mode === "research") {
      const result = await runResearchMode(q);
      return NextResponse.json(result);
    }
    if (mode === "system_design") {
      const result = await generateArchitecture(q);
      return NextResponse.json(result);
    }
    const intent = await classifyIntent(q);
    return NextResponse.json({ query: q, intent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
