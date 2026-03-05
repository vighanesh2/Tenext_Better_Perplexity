import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { classifyIntent } from "@/lib/intent";
import { decomposeQuery } from "@/lib/decompose";
import { search } from "@/lib/search";
import { synthesizeResearch } from "@/lib/synthesize";
import { calculateConfidence } from "@/lib/confidence";
import { generateArchitecture, generateMermaidDiagram, reflectBottlenecks } from "@/lib/systemDesignPipeline";

function deduplicateByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function streamLine(
  controller: ReadableStreamDefaultController<Uint8Array>,
  data: object
) {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + "\n"));
}

async function getGeneralAnswer(query: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("GROQ_API_KEY is not set.");
  }
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer questions concisely. Be direct and informative. Use markdown when helpful.",
      },
      { role: "user", content: query },
    ],
    temperature: 0.5,
    max_tokens: 1024,
  });
  return response?.choices?.[0]?.message?.content?.trim() ?? "";
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
          streamLine(controller, { type: "status", message: "Classifying intent…" });
          const intent = await classifyIntent(trimmed);

          if (intent === "research") {
            streamLine(controller, { type: "status", message: "Decomposing query…" });
            const subqueries = await decomposeQuery(trimmed);
            for (let i = 0; i < subqueries.length; i++) {
              streamLine(controller, {
                type: "trace",
                step: { type: "query", label: `Query ${i + 1}`, text: subqueries[i] },
              });
            }
            const resultsArrays = await Promise.all(subqueries.map((q) => search(q)));
            const combined = resultsArrays.flat();
            const deduplicated = deduplicateByUrl(combined);
            const topSources = deduplicated.slice(0, 5);
            for (const s of topSources) {
              streamLine(controller, { type: "trace", step: { type: "reading", title: s.title } });
            }
            if (topSources.length === 0) {
              streamLine(controller, {
                type: "result",
                data: {
                  mode: "research",
                  summary: "No sources found for this query.",
                  keyInsights: [],
                  contradictions: [],
                  confidence: 0,
                  sources: [],
                },
              });
              controller.close();
              return;
            }
            const synthesis = await synthesizeResearch(trimmed, topSources);
            const confidenceScore = calculateConfidence(topSources, synthesis);
            const confidence = Math.round((confidenceScore / 10) * 100) / 100;
            streamLine(controller, {
              type: "result",
              data: {
                mode: "research",
                summary: synthesis.summary,
                keyInsights: synthesis.keyInsights,
                contradictions: synthesis.contradictions,
                confidence,
                sources: topSources.map((s) => ({ title: s.title, url: s.url })),
              },
            });
            controller.close();
            return;
          }

          if (intent === "system_design") {
            streamLine(controller, { type: "status", message: "Generating architecture…" });
            const arch = await generateArchitecture(trimmed);
            streamLine(controller, { type: "status", message: "Calculating scaling math…" });
            streamLine(controller, { type: "status", message: "Reflecting bottlenecks…" });
            const reflectionFindings = await reflectBottlenecks(arch);
            arch.bottlenecks = [...arch.bottlenecks, ...reflectionFindings];
            streamLine(controller, { type: "status", message: "Generating diagram…" });
            const diagram = await generateMermaidDiagram(arch.systemComponents);
            streamLine(controller, { type: "result", data: { ...arch, diagram } });
            controller.close();
            return;
          }

          // general
          streamLine(controller, { type: "status", message: "Answering…" });
          const answer = await getGeneralAnswer(trimmed);
          streamLine(controller, { type: "result", data: { mode: "general", answer } });
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Request failed.";
          streamLine(controller, { type: "error", error: message });
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
