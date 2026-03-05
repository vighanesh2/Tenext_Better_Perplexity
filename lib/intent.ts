import OpenAI from "openai";

export type Intent = "research" | "system_design" | "general";

const SYSTEM_PROMPT = `You classify user queries into exactly one intent. Return ONLY one word, nothing else.

Valid outputs (choose exactly one):
- research
- system_design
- general

Classification rules (apply in order):
1. system_design: If the query contains or implies words like "design", "scale", "architecture", "throughput", "concurrent users", "scalability", "distributed", "microservices", "load balancing", "high availability", "system design", "system architecture" → return "system_design"
2. research: If the query asks for comparison, analysis, market info, current events, "vs", "versus", "best", "top", "trends", "statistics", "research", "investigate", "find out about" → return "research"
3. general: Otherwise → return "general"

Be strict. Output exactly one word: research, system_design, or general. No punctuation, no explanation, no quotes.`;

export async function classifyIntent(query: string): Promise<Intent> {
  const trimmed = query?.trim();
  if (!trimmed) {
    return "general";
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to your environment variables."
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: trimmed },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const raw = response?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return "general";
    }

    const normalized = raw.toLowerCase().replace(/[^a-z_]/g, "");
    if (normalized === "system_design" || normalized === "systemdesign") return "system_design";
    if (normalized === "research") return "research";
    if (normalized === "general") return "general";

    return "general";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Intent classification failed.";
    throw new Error(`Intent classification error: ${message}`);
  }
}
