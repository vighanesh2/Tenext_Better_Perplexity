import OpenAI from "openai";

export interface ScalingAssumptions {
  concurrentUsers: number;
  requestsPerSecond: number;
}

export interface ScalingMath {
  concurrentUsers: number;
  estimatedQps: number;
  redisOpsPerSecond: number;
  serviceInstances: number;
  numericReasoning: string;
}

export interface Tradeoff {
  component: string;
  latency: string;
  durability: string;
  throughput: string;
  complexity: string;
}

export interface ArchitectureResult {
  mode: "system_design";
  systemComponents: string[];
  architectureDescription: string;
  scalingAssumptions: ScalingAssumptions;
  scalingMath: ScalingMath;
  throughputEstimation: string;
  partitionStrategy: string;
  tradeoffs: Tradeoff[];
  bottlenecks: string[];
}

const SYSTEM_PROMPT = `You are a senior distributed systems engineer. Design architecture for the given system prompt.

Rules:
- Think like a senior distributed systems engineer. Be precise and quantitative.
- Assume realistic concurrency when not specified (e.g., 100k users). Always include numeric estimates.
- Estimate QPS, Redis ops/sec (use 0 if no Redis), and number of service instances. Provide short numeric reasoning.
- Never say "it depends" or use vague phrases. Every estimate must be a number or a short formula.
- Include horizontal scaling strategy and failure modes.
- Return ONLY valid JSON. No markdown, no explanation, no text outside the JSON.

Return EXACTLY this JSON structure (all fields required):
{
  "mode": "system_design",
  "systemComponents": ["string", "string"],
  "architectureDescription": "string",
  "scalingAssumptions": {
    "concurrentUsers": number,
    "requestsPerSecond": number
  },
  "scalingMath": {
    "concurrentUsers": number,
    "estimatedQps": number,
    "redisOpsPerSecond": number,
    "serviceInstances": number,
    "numericReasoning": "string"
  },
  "throughputEstimation": "string",
  "partitionStrategy": "string",
  "tradeoffs": [
    {"component": "Redis", "latency": "Low", "durability": "Weak", "throughput": "High", "complexity": "Low"},
    {"component": "PostgreSQL", "latency": "Medium", "durability": "Strong", "throughput": "Medium", "complexity": "Medium"},
    {"component": "API Gateway", "latency": "Low", "durability": "N/A", "throughput": "High", "complexity": "Low"}
  ],
  "bottlenecks": ["string"]
}

- systemComponents: List of main components (e.g., "Load Balancer", "API Gateway", "Auth Service").
- architectureDescription: 2–4 sentences describing the overall system.
- scalingAssumptions: concurrentUsers and requestsPerSecond (default to realistic scale, e.g. 100k users, 10k RPS).
- scalingMath: MANDATORY. concurrentUsers (e.g. 100000), estimatedQps (queries per second), redisOpsPerSecond (cache/db ops; 0 if no Redis), serviceInstances (number of app instances), numericReasoning (2–3 sentences: e.g. "100k users * 0.1 req/s = 10k QPS; 3 replicas per service * 4 services = 12 instances").
- throughputEstimation: Quantitative estimate (e.g., "~50K RPS with 10 shards").
- partitionStrategy: How to partition data (e.g., "Shard by user_id, consistent hashing").
- tradeoffs: REQUIRED. At least 3 entries. Each entry must have exactly: component (e.g. "Redis", "PostgreSQL"), latency ("Low" / "High" / short phrase), durability ("Strong" / "Weak" / short phrase), throughput ("High" / "Low" / short phrase), complexity ("Low" / "High" / short phrase). Example: {"component":"Redis","latency":"Low","durability":"Weak","throughput":"High","complexity":"Low"}.
- bottlenecks: Potential bottlenecks and mitigation strategies.`;

function parseTradeoff(obj: unknown): Tradeoff | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  return {
    component: typeof o.component === "string" ? o.component : "",
    latency: typeof o.latency === "string" ? o.latency : "",
    durability: typeof o.durability === "string" ? o.durability : "",
    throughput: typeof o.throughput === "string" ? o.throughput : "",
    complexity: typeof o.complexity === "string" ? o.complexity : "",
  };
}

function parseScalingAssumptions(obj: unknown): ScalingAssumptions {
  if (!obj || typeof obj !== "object") {
    return { concurrentUsers: 10000, requestsPerSecond: 1000 };
  }
  const o = obj as Record<string, unknown>;
  return {
    concurrentUsers: typeof o.concurrentUsers === "number" ? o.concurrentUsers : 10000,
    requestsPerSecond: typeof o.requestsPerSecond === "number" ? o.requestsPerSecond : 1000,
  };
}

const DEFAULT_SCALING_MATH: ScalingMath = {
  concurrentUsers: 100000,
  estimatedQps: 10000,
  redisOpsPerSecond: 0,
  serviceInstances: 12,
  numericReasoning: "Default scaling: 100k users × 0.1 req/s = 10k QPS; 12 app instances.",
};

function parseScalingMath(obj: unknown): ScalingMath {
  if (!obj || typeof obj !== "object") return DEFAULT_SCALING_MATH;
  const o = obj as Record<string, unknown>;
  return {
    concurrentUsers: typeof o.concurrentUsers === "number" ? o.concurrentUsers : DEFAULT_SCALING_MATH.concurrentUsers,
    estimatedQps: typeof o.estimatedQps === "number" ? o.estimatedQps : DEFAULT_SCALING_MATH.estimatedQps,
    redisOpsPerSecond: typeof o.redisOpsPerSecond === "number" ? o.redisOpsPerSecond : 0,
    serviceInstances: typeof o.serviceInstances === "number" ? o.serviceInstances : DEFAULT_SCALING_MATH.serviceInstances,
    numericReasoning: typeof o.numericReasoning === "string" && o.numericReasoning.trim()
      ? o.numericReasoning.trim()
      : DEFAULT_SCALING_MATH.numericReasoning,
  };
}

export async function generateArchitecture(query: string): Promise<ArchitectureResult> {
  const trimmed = query?.trim();
  if (!trimmed) {
    throw new Error("Query must be a non-empty string.");
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
      max_tokens: 4096,
    });

    const raw = response?.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("No response from LLM.");
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const content = jsonMatch ? jsonMatch[0] : raw;

    const parsed = JSON.parse(content) as {
      mode?: string;
      systemComponents?: unknown;
      architectureDescription?: string;
      scalingAssumptions?: unknown;
      scalingMath?: unknown;
      throughputEstimation?: string;
      partitionStrategy?: string;
      tradeoffs?: unknown;
      bottlenecks?: unknown;
    };

    const systemComponents = Array.isArray(parsed.systemComponents)
      ? parsed.systemComponents.filter((x): x is string => typeof x === "string")
      : [];

    const tradeoffsRaw = Array.isArray(parsed.tradeoffs) ? parsed.tradeoffs : [];
    const tradeoffs = tradeoffsRaw
      .map(parseTradeoff)
      .filter((t): t is Tradeoff => t !== null && t.component.trim() !== "");

    const bottlenecks = Array.isArray(parsed.bottlenecks)
      ? parsed.bottlenecks.filter((x): x is string => typeof x === "string")
      : [];

    return {
      mode: "system_design",
      systemComponents,
      architectureDescription: typeof parsed.architectureDescription === "string"
        ? parsed.architectureDescription
        : "",
      scalingAssumptions: parseScalingAssumptions(parsed.scalingAssumptions),
      scalingMath: parseScalingMath(parsed.scalingMath),
      throughputEstimation: typeof parsed.throughputEstimation === "string"
        ? parsed.throughputEstimation
        : "",
      partitionStrategy: typeof parsed.partitionStrategy === "string"
        ? parsed.partitionStrategy
        : "",
      tradeoffs,
      bottlenecks,
    };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error("Invalid JSON in system design response.");
    }
    const message = err instanceof Error ? err.message : "Architecture generation failed.";
    throw new Error(`System design error: ${message}`);
  }
}

const BOTTLENECK_REFLECTION_PROMPT = `You are a senior distributed systems engineer doing a second-pass review.

Given an architecture description, analyze it under peak load and identify:
- Hidden bottlenecks (single points of failure, unbounded queues, hot shards, etc.)
- Failure risks (cascades, thundering herd, network partitions, etc.)

Return ONLY a JSON array of strings. Each string is one finding (concise, actionable).
Example: ["Database connection pool exhaustion under spike", "Cache stampede on cold start"]
No commentary, no markdown, no explanation. Only valid JSON: ["string", "string", ...]`;

/**
 * Second-pass analysis: LLM reviews the architecture under peak load and returns
 * additional bottleneck / failure-risk findings to append to the main list.
 */
export async function reflectBottlenecks(arch: ArchitectureResult): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("GROQ_API_KEY is not set. Add it to your environment variables.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const context = [
    arch.architectureDescription,
    `Components: ${arch.systemComponents.join(", ")}`,
    `Scaling: ${arch.scalingAssumptions.concurrentUsers} concurrent users, ${arch.scalingAssumptions.requestsPerSecond} req/s`,
    `Throughput: ${arch.throughputEstimation}`,
    `Partition: ${arch.partitionStrategy}`,
    arch.bottlenecks.length > 0 ? `Already identified: ${arch.bottlenecks.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userPrompt = `${context}

Analyze the above architecture under peak load and identify hidden bottlenecks or failure risks. Return only a JSON array of strings.`;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: BOTTLENECK_REFLECTION_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const raw = response?.choices?.[0]?.message?.content?.trim();
    if (!raw) return [];

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const content = jsonMatch ? jsonMatch[0] : raw;
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

const MERMAID_PROMPT = `You generate valid Mermaid flowchart code from a list of components.

Rules:
- Output ONLY valid Mermaid syntax. No explanations, no markdown fences, no commentary.
- Use flowchart LR (left-to-right).
- Format: NodeA --> NodeB (one per line for each connection).
- Use alphanumeric node IDs (e.g., LB, API, DB). Replace spaces with underscores.
- Connect components in a logical flow (left to right: Client -> LB -> API -> DB).
- Do not use brackets, parentheses, or special chars in node IDs.
- Minimum 2 components, connect each to the next in sequence.
- Example output:
flowchart LR
  Client --> LB
  LB --> API
  API --> DB`;

function sanitizeMermaid(raw: string): string {
  return raw
    .replace(/```mermaid?\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();
}

export async function generateMermaidDiagram(
  components: string[]
): Promise<string> {
  const valid = components.filter(
    (c): c is string => typeof c === "string" && c.trim().length > 0
  );
  if (valid.length < 2) {
    throw new Error("At least 2 components are required for a diagram.");
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

  const userPrompt = `Components: ${valid.join(", ")}

Generate ONLY valid Mermaid flowchart LR code. No other text.`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: MERMAID_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0,
    max_tokens: 512,
  });

  const raw = response?.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("No Mermaid output from LLM.");
  }

  const sanitized = sanitizeMermaid(raw);
  if (!sanitized.startsWith("flowchart")) {
    const lines = sanitized.split("\n").filter((l) => l.trim());
    if (lines.length > 0) {
      return ["flowchart LR", ...lines].join("\n");
    }
    throw new Error("Invalid Mermaid output: missing flowchart declaration.");
  }

  return sanitized;
}
