export type MessageRole = "user" | "assistant";

export type ResponseMode = "research" | "system_design" | "general";

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

export type ReasoningTraceStep =
  | { type: "query"; label: string; text: string }
  | { type: "reading"; title: string };

export interface ResearchResponse {
  mode: "research";
  summary: string;
  keyInsights: string[];
  contradictions: string[];
  confidence: number;
  sources: Source[];
  reasoningTrace?: ReasoningTraceStep[];
}

export interface Tradeoff {
  component: string;
  latency: string;
  durability: string;
  throughput: string;
  complexity: string;
}

export interface ScalingMath {
  concurrentUsers: number;
  estimatedQps: number;
  redisOpsPerSecond: number;
  serviceInstances: number;
  numericReasoning: string;
}

export interface SystemDesignResponse {
  mode: "system_design";
  systemComponents: string[];
  architectureDescription: string;
  scalingAssumptions: { concurrentUsers: number; requestsPerSecond: number };
  scalingMath?: ScalingMath;
  throughputEstimation: string;
  partitionStrategy: string;
  tradeoffs: Tradeoff[];
  bottlenecks: string[];
  diagram: string;
}

export interface GeneralResponse {
  mode: "general";
  answer: string;
}

export type AdaptiveResponse = ResearchResponse | SystemDesignResponse | GeneralResponse;

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  isStreaming?: boolean;
  fromCache?: boolean;
  reasoningChain?: string[];
  responseMode?: ResponseMode;
  responseData?: AdaptiveResponse;
  /** Query that triggered this assistant response (for Save to Notebook) */
  query?: string;
  /** Shown only while streaming (thinking); cleared when result arrives */
  traceSteps?: ReasoningTraceStep[];
}
