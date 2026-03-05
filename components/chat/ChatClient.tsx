"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";
import { exportToPdf } from "@/lib/notebookExport";
import type { Message, ResearchResponse, SystemDesignResponse, GeneralResponse, AdaptiveResponse, ReasoningTraceStep } from "./types";
import type { Source } from "./types";
import { Navbar } from "@/components/ui/mini-navbar";
import { useNotebookStore } from "@/store/notebookStore";
import { useNotebookTextStore } from "@/store/notebookTextStore";
import { MermaidDiagram } from "./MermaidDiagram";

const HeroWave = dynamic(() => import("@/components/hero/HeroWave").then((m) => m.HeroWave), {
  ssr: false,
});

function ResearchContent({ data }: { data: ResearchResponse }) {
  return (
    <div className="space-y-6">
      <div className="text-[19px] leading-[1.75]">
        <ReactMarkdown>{data.summary}</ReactMarkdown>
      </div>
      {data.keyInsights.length > 0 && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Key insights</h3>
          <ul className="list-disc pl-6 space-y-2 text-[17px] text-gray-200">
            {data.keyInsights.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}
      {data.contradictions.length > 0 && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-amber-400/90 mb-3">Contradictions</h3>
          <ul className="list-disc pl-6 space-y-2 text-[17px] text-gray-300">
            {data.contradictions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {data.sources.length > 0 && (
        <div className="pt-6 border-t border-white/10">
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Sources</h3>
          <div className="grid gap-3">
            {data.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 text-[13px] font-medium text-gray-300 flex items-center justify-center group-hover:bg-[#1f3dbc]/50 group-hover:text-white">
                  {i + 1}
                </span>
                <p className="text-[17px] font-medium text-[#7ba3ff] group-hover:underline line-clamp-2 flex-1">{s.title}</p>
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SystemDesignContent({ data, diagramId }: { data: SystemDesignResponse; diagramId: string }) {
  return (
    <div className="space-y-6">
      <div className="text-[19px] leading-[1.75]">
        <ReactMarkdown>{data.architectureDescription}</ReactMarkdown>
      </div>
      {data.systemComponents.length > 0 && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-3">System components</h3>
          <ul className="list-disc pl-6 space-y-1 text-[17px] text-gray-200">
            {data.systemComponents.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Scaling assumptions</h3>
        <div className="flex gap-6 text-[17px] text-gray-200">
          <span>Concurrent users: <strong>{data.scalingAssumptions.concurrentUsers.toLocaleString()}</strong></span>
          <span>Requests/sec: <strong>{data.scalingAssumptions.requestsPerSecond.toLocaleString()}</strong></span>
        </div>
      </div>
      {data.scalingMath && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Scaling math</h3>
          <div className="grid gap-2 text-[17px] text-gray-200 mb-3">
            <span>Concurrent users: <strong>{data.scalingMath.concurrentUsers.toLocaleString()}</strong></span>
            <span>Estimated QPS: <strong>{data.scalingMath.estimatedQps.toLocaleString()}</strong></span>
            <span>Redis ops/sec: <strong>{data.scalingMath.redisOpsPerSecond.toLocaleString()}</strong></span>
            <span>Service instances: <strong>{data.scalingMath.serviceInstances.toLocaleString()}</strong></span>
          </div>
          <p className="text-[15px] text-gray-400 leading-relaxed">{data.scalingMath.numericReasoning}</p>
        </div>
      )}
      {data.throughputEstimation && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Throughput estimation</h3>
          <p className="text-[17px] text-gray-200">{data.throughputEstimation}</p>
        </div>
      )}
      {data.partitionStrategy && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Partition strategy</h3>
          <p className="text-[17px] text-gray-200">{data.partitionStrategy}</p>
        </div>
      )}
      {data.tradeoffs.length > 0 && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Tradeoffs</h3>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-[15px] text-gray-200">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-semibold">Component</th>
                  <th className="text-left py-3 px-4 font-semibold">Latency</th>
                  <th className="text-left py-3 px-4 font-semibold">Durability</th>
                  <th className="text-left py-3 px-4 font-semibold">Throughput</th>
                  <th className="text-left py-3 px-4 font-semibold">Complexity</th>
                </tr>
              </thead>
              <tbody>
                {data.tradeoffs.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 px-4">{t.component}</td>
                    <td className="py-3 px-4">{t.latency}</td>
                    <td className="py-3 px-4">{t.durability}</td>
                    <td className="py-3 px-4">{t.throughput}</td>
                    <td className="py-3 px-4">{t.complexity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {data.bottlenecks.length > 0 && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-amber-400/90 mb-3">Bottlenecks</h3>
          <ul className="list-disc pl-6 space-y-2 text-[17px] text-gray-300">
            {data.bottlenecks.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
      {data.diagram && (
        <div>
          <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Architecture diagram</h3>
          <MermaidDiagram code={data.diagram} id={diagramId} />
        </div>
      )}
    </div>
  );
}

function GeneralContent({ data }: { data: GeneralResponse }) {
  return (
    <div className="text-[19px] leading-[1.75] prose prose-invert prose-lg max-w-none [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4">
      <ReactMarkdown>{data.answer}</ReactMarkdown>
    </div>
  );
}

function formatSourcesMarkdown(sources: Source[]): string {
  if (!sources?.length) return "";
  return [
    "## Sources",
    "",
    ...sources.map((s, i) => `- [${s.title}](${s.url})`),
  ].join("\n");
}

function getInsertContent(
  message: Message
): { summary: string; sources: string; full: string } {
  const data = message.responseData;
  const query = message.query ?? "Notes";

  if (data?.mode === "research") {
    const d = data as ResearchResponse;
    const summary = d.summary;
    const sources = formatSourcesMarkdown(d.sources ?? []);
    const full = [
      `## ${query}`,
      "",
      "### Summary",
      "",
      summary,
      "",
      ...(d.keyInsights?.length
        ? ["### Key insights", "", ...d.keyInsights.map((k) => `- ${k}`), ""]
        : []),
      ...(d.contradictions?.length
        ? ["### Contradictions", "", ...d.contradictions.map((c) => `- ${c}`), ""]
        : []),
      sources ? [sources, ""] : [],
    ]
      .flat()
      .join("\n");
    return { summary, sources, full };
  }

  if (data?.mode === "system_design") {
    const d = data as SystemDesignResponse;
    const summary = d.architectureDescription;
    const sources = "";
    const full = [
      `## ${query}`,
      "",
      "### Architecture",
      "",
      summary,
      "",
      ...(d.systemComponents?.length
        ? ["### Components", "", ...d.systemComponents.map((c) => `- ${c}`), ""]
        : []),
      "### Scaling",
      "",
      `- Concurrent users: ${d.scalingAssumptions?.concurrentUsers?.toLocaleString() ?? "—"}`,
      `- Requests/sec: ${d.scalingAssumptions?.requestsPerSecond?.toLocaleString() ?? "—"}`,
      "",
      ...(d.bottlenecks?.length
        ? ["### Bottlenecks", "", ...d.bottlenecks.map((b) => `- ${b}`), ""]
        : []),
    ]
      .flat()
      .join("\n");
    return { summary, sources, full };
  }

  if (data?.mode === "general") {
    const d = data as GeneralResponse;
    const summary = d.answer;
    const sources = "";
    const full = [`## ${query}`, "", summary].join("\n");
    return { summary, sources, full };
  }

  const content = message.content ?? "";
  const sources = formatSourcesMarkdown(message.sources ?? []);
  const summary = content.length > 500 ? `${content.slice(0, 500)}...` : content;
  const full = [content, "", sources].filter(Boolean).join("\n");
  return { summary, sources, full };
}

function markdownToHtml(md: string): string {
  if (!md?.trim()) return "";
  return (marked.parse(md, { async: false }) as string) || "";
}

function InsertButtons({ message }: { message: Message }) {
  const appendAndScroll = useNotebookTextStore((s) => s.appendAndScroll);
  const { summary, sources, full } = getInsertContent(message);
  const hasSources = sources.length > 0;
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    const html = markdownToHtml(full);
    if (!html.trim()) return;
    setExportingPdf(true);
    try {
      const slug = (message.query ?? "response").slice(0, 40).replace(/[^a-z0-9]/gi, "-");
      await exportToPdf(html, `response-${slug}-${message.id.slice(0, 8)}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => appendAndScroll(markdownToHtml(summary))}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        Insert Summary
      </button>
      {hasSources && (
        <button
          type="button"
          onClick={() => appendAndScroll(markdownToHtml(sources))}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          Insert Sources
        </button>
      )}
      <button
        type="button"
        onClick={() => appendAndScroll(markdownToHtml(full))}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        Insert Full Answer
      </button>
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={!full.trim() || exportingPdf}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {exportingPdf ? "Exporting…" : "Export PDF"}
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const data = message.responseData;
  const addItem = useNotebookStore((s) => s.addItem);
  const [saved, setSaved] = useState(false);

  const handleSaveToNotebook = () => {
    if (!data) return;
    addItem({
      query: message.query ?? "",
      mode: data.mode,
      payload: data,
      userNotes: "",
    });
    setSaved(true);
  };

  return (
    <div className={`w-full ${isUser ? "flex justify-center" : ""}`}>
      <div className={`w-full max-w-3xl ${isUser ? "text-center" : ""}`}>
        {isUser ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-[18px] text-gray-200">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{message.content}</span>
          </div>
        ) : (
          <article className="prose prose-invert prose-lg max-w-none">
            {message.isStreaming ? (
              <>
                {message.traceSteps && message.traceSteps.length > 0 && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 mb-4">
                    <h3 className="text-[14px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
                      Search reasoning trace
                    </h3>
                    <ul className="space-y-2 text-[15px] text-gray-300">
                      {message.traceSteps.map((step, i) =>
                        step.type === "query" ? (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[16px] shrink-0" aria-hidden="true">🔎</span>
                            <span>
                              <span className="font-medium text-gray-400">{step.label}:</span> {step.text}
                            </span>
                          </li>
                        ) : (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[16px] shrink-0" aria-hidden="true">📄</span>
                            <span>Reading: {step.title}</span>
                          </li>
                        )
                      )}
                    </ul>
                    <span className="mt-2 inline-block h-4 w-0.5 animate-pulse bg-gray-500 align-middle" />
                  </div>
                )}
                {(!message.traceSteps || message.traceSteps.length === 0) && (
                  <div className="text-[19px] leading-[1.75]">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-current align-middle" />
                  </div>
                )}
              </>
            ) : data ? (
              <>
                {data.mode === "research" && <ResearchContent data={data} />}
                {data.mode === "system_design" && <SystemDesignContent data={data} diagramId={message.id} />}
                {data.mode === "general" && <GeneralContent data={data} />}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveToNotebook}
                    disabled={saved}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {saved ? (
                      <>Saved</>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save to Notebook
                      </>
                    )}
                  </button>
                  <InsertButtons message={message} />
                </div>
              </>
            ) : (
              <>
                <div className="text-[19px] leading-[1.75] [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-6 [&_strong]:font-semibold">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Sources</h3>
                      <div className="grid gap-3">
                        {message.sources.map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/[0.06] group">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 text-[13px] font-medium text-gray-300 flex items-center justify-center">{i + 1}</span>
                            <p className="text-[17px] font-medium text-[#7ba3ff] group-hover:underline line-clamp-2">{s.title}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <InsertButtons message={message} />
                </div>
              </>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

export default function ChatClient({
  notebookOpen = true,
  onToggleNotebook,
}: {
  notebookOpen?: boolean;
  onToggleNotebook?: () => void;
} = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [researchMode, setResearchMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchResearchResponse = async (userContent: string) => {
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "Classifying intent…",
        isStreaming: true,
      },
    ]);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userContent }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? res.statusText ?? "Request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as {
              type?: string;
              message?: string;
              trace?: { step: ReasoningTraceStep };
              step?: ReasoningTraceStep;
              data?: AdaptiveResponse;
              error?: string;
            };
            if (parsed.type === "status" && parsed.message) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: parsed.message!, isStreaming: true } : m
                )
              );
            } else if (parsed.type === "trace" && parsed.step) {
              const step = parsed.step;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, traceSteps: [...(m.traceSteps ?? []), step], isStreaming: true }
                    : m
                )
              );
            } else if (parsed.type === "result" && parsed.data) {
              const data = parsed.data;
              const mode = data.mode;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: mode === "general" ? (data as { answer: string }).answer : "",
                        responseMode: mode,
                        responseData: data,
                        query: userContent,
                        isStreaming: false,
                        traceSteps: undefined,
                      }
                    : m
                )
              );
            } else if (parsed.type === "error" || parsed.error) {
              throw new Error(parsed.error ?? "Request failed");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer) as {
            type?: string;
            data?: AdaptiveResponse;
            error?: string;
          };
          if (parsed.type === "result" && parsed.data) {
            const data = parsed.data;
            const mode = data.mode;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: mode === "general" ? (data as { answer: string }).answer : "",
                      responseMode: mode,
                      responseData: data,
                      query: userContent,
                      isStreaming: false,
                      traceSteps: undefined,
                    }
                  : m
              )
            );
          } else if (parsed.type === "error" || parsed.error) {
            throw new Error(parsed.error ?? "Request failed");
          }
        } catch {
          /* ignore parse errors for trailing buffer */
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${message}`, isStreaming: false } : m
        )
      );
    }
    setIsStreaming(false);
  };

  const streamChatResponse = async (userContent: string) => {
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userContent, messages: history }),
      });

      if (!res.ok) {
        throw new Error(res.statusText || "Chat failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as {
              type?: string;
              content?: string;
              error?: string;
            };
            if (parsed.type === "chunk" && typeof parsed.content === "string") {
              fullContent += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: fullContent, isStreaming: true }
                    : m
                )
              );
            } else if (parsed.type === "error" || parsed.error) {
              throw new Error(parsed.error ?? "Chat failed");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer) as { type?: string; content?: string; error?: string };
          if (parsed.type === "chunk" && typeof parsed.content === "string") {
            fullContent += parsed.content;
          } else if (parsed.type === "error" || parsed.error) {
            throw new Error(parsed.error ?? "Chat failed");
          }
        } catch {
          /* ignore parse errors */
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: fullContent, isStreaming: false } : m
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${message}`, isStreaming: false } : m
        )
      );
    }
    setIsStreaming(false);
  };

  const handlePromptSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    if (researchMode) {
      fetchResearchResponse(trimmed);
    } else {
      streamChatResponse(trimmed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    handlePromptSubmit(trimmed);
    setInput("");
  };

  const chatContent = (
    <div className="flex h-screen bg-[#0a0a0f] flex-col">
      <div className="relative flex flex-col min-h-0 min-w-0 flex-1">
        <Navbar
          onBack={() => setMessages([])}
          notebookOpen={notebookOpen}
          onToggleNotebook={onToggleNotebook}
        />
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-20 pb-6 min-h-0">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-white/5 bg-[#0a0a0f] px-4 py-4 shrink-0">
        <div className="mx-auto max-w-3xl mb-3 flex items-center gap-2">
          <span className="text-[13px] text-gray-500 mr-2">Mode:</span>
          <button
            type="button"
            onClick={() => setResearchMode(false)}
            className={`rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
              !researchMode
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setResearchMode(true)}
            className={`rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
              researchMode
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Research
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl gap-3"
        >
          <div className="relative flex-1 rounded-2xl p-[2px] bg-gradient-to-br from-white/10 via-white/5 to-black/20">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={researchMode ? "Describe what you want to research..." : "Ask anything..."}
              disabled={isStreaming}
              className="w-full rounded-2xl bg-[rgba(15,15,20,0.55)] border border-white/10 px-5 py-3.5 text-[17px] text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#1f3dbc]/40 focus:border-[#1f3dbc]/40 backdrop-blur-md disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#f0f2ff] text-black hover:bg-white transition-colors disabled:opacity-50 shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </button>
        </form>
        </div>
      </div>
    </div>
  );

  if (messages.length > 0) {
    return chatContent;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] flex-col">
      <div className="relative flex flex-col min-h-0 min-w-0 flex-1">
        <div className="flex-1 min-w-0">
          <HeroWave
            title="Research with AI."
            subtitle="Ask anything. Use Chat for quick answers, or Research for in-depth analysis with sources."
            onPromptSubmit={handlePromptSubmit}
            researchMode={researchMode}
            onResearchModeChange={setResearchMode}
            notebookOpen={notebookOpen}
            onToggleNotebook={onToggleNotebook}
          />
        </div>
      </div>
    </div>
  );
}
