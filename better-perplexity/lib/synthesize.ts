import OpenAI from "openai";

export interface SynthesisSource {
  title: string;
  url: string;
  snippet?: string;
  content?: string;
}

export interface SynthesisResult {
  summary: string;
  keyInsights: string[];
  contradictions: string[];
  limitations: string[];
}

const SYSTEM_PROMPT = `You are a rigorous research analyst. Your job is to synthesize multiple sources into clear, evidence-based conclusions.

Rules:
- Base every claim strictly on the provided source content. Quote or paraphrase only what the sources say.
- Do not speculate, infer beyond the evidence, or add information not present in the sources.
- When sources disagree, explicitly flag it in contradictions. Cite which sources say what.
- Be concise and analytical. Prioritize clarity and precision over length.
- If sources are silent on a topic, note it in limitations.
- Return ONLY valid JSON in this exact format:
{"summary":"string","keyInsights":["string","string"],"contradictions":["string"],"limitations":["string"]}
- No commentary, no markdown, no explanation outside the JSON.`;

function buildSourcesContext(sources: SynthesisSource[]): string {
  return sources
    .map((s, i) => {
      const body = s.content?.trim() || s.snippet?.trim() || "";
      return `[Source ${i + 1}] ${s.title} (${s.url})\n${body}`;
    })
    .join("\n\n---\n\n");
}

export async function synthesizeResearch(
  query: string,
  sources: SynthesisSource[]
): Promise<SynthesisResult> {
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

  const sourcesContext = buildSourcesContext(sources);
  const userPrompt = `Research question: ${query}

Sources to synthesize:

${sourcesContext}

Provide a structured synthesis based only on the evidence above.`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = response?.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return {
      summary: "Unable to generate synthesis from sources.",
      keyInsights: [],
      contradictions: [],
      limitations: ["Synthesis failed to produce output."],
    };
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const content = jsonMatch ? jsonMatch[0] : raw;

  const parsed = JSON.parse(content) as {
    summary?: string;
    keyInsights?: unknown;
    contradictions?: unknown;
    limitations?: unknown;
  };

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    keyInsights: Array.isArray(parsed.keyInsights)
      ? parsed.keyInsights.filter((x): x is string => typeof x === "string")
      : [],
    contradictions: Array.isArray(parsed.contradictions)
      ? parsed.contradictions.filter((x): x is string => typeof x === "string")
      : [],
    limitations: Array.isArray(parsed.limitations)
      ? parsed.limitations.filter((x): x is string => typeof x === "string")
      : [],
  };
}
