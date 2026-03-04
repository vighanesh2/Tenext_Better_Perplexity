import { NextRequest } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a helpful, friendly assistant. Answer questions conversationally and clearly. Be concise when appropriate, but thorough when the topic benefits from more detail. Use markdown for formatting when helpful (bold, lists, etc.).`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, messages: history } = body as {
      query?: string;
      messages?: { role: "user" | "assistant"; content: string }[];
    };

    if (typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid query string" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(Array.isArray(history) && history.length > 0
        ? history.slice(-10).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        : []),
      { role: "user", content: query.trim() },
    ];

    const stream = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      stream: true,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "chunk", content: delta }) + "\n"
                )
              );
            }
          }
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "done" }) + "\n")
          );
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: err instanceof Error ? err.message : "Chat failed",
              }) + "\n"
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 }
    );
  }
}
