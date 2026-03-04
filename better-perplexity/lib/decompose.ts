import OpenAI from "openai";

const SYSTEM_PROMPT = `You decompose research questions into subqueries for parallel search.

Rules:
- If the query is simple (single factual question, one topic), return it unchanged as the only element.
- If the query is complex (multiple aspects, comparisons, "and", "versus", several parts), split it into 3-5 focused subqueries that together cover the full question.
- Each subquery should be self-contained and searchable on its own.
- Return ONLY valid JSON in this exact format: {"subqueries":["query1","query2",...]}
- No commentary, no markdown, no explanation.`;

export async function decomposeQuery(query: string): Promise<string[]> {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
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
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return [trimmed];
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0] : raw;

    const parsed = JSON.parse(content) as { subqueries?: unknown };
    const subqueries = parsed?.subqueries;

    if (!Array.isArray(subqueries) || subqueries.length === 0) {
      return [trimmed];
    }

    const valid = subqueries.filter(
      (q): q is string => typeof q === "string" && q.trim().length > 0
    );

    return valid.length > 0 ? valid : [trimmed];
  } catch (err) {
    if (err instanceof SyntaxError) {
      return [trimmed];
    }
    const message = err instanceof Error ? err.message : "Decomposition failed.";
    throw new Error(`Query decomposition error: ${message}`);
  }
}
