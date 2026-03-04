"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Message, Source } from "./types";
import { Navbar } from "@/components/ui/mini-navbar";

const HeroWave = dynamic(() => import("@/components/hero/HeroWave").then((m) => m.HeroWave), {
  ssr: false,
});

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [showReasoning, setShowReasoning] = useState(false);

  const hasExplainability =
    !message.isStreaming &&
    message.sources &&
    message.sources.length > 0 &&
    (message.reasoningChain?.length ?? 0) > 0;

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
          <>
            {message.fromCache && !message.isStreaming && (
              <p className="mb-4 text-sm font-medium text-emerald-400">
                Served from cache
              </p>
            )}
            <article className="prose prose-invert prose-lg max-w-none">
              <div className="markdown-output text-[19px] leading-[1.75] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:mb-4 [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-[19px] [&_ol]:list-decimal [&_ol]:mb-4 [&_ol]:pl-6 [&_ol]:space-y-2 [&_strong]:font-semibold [&_strong]:text-white [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3">
                {message.isStreaming ? (
                  <>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-current align-middle" />
                  </>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
            </article>
            {message.sources && message.sources.length > 0 && !message.isStreaming && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-[16px] font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  Sources
                </h3>
                <div className="grid gap-3">
                  {message.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 text-[13px] font-medium text-gray-300 flex items-center justify-center group-hover:bg-[#1f3dbc]/50 group-hover:text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-medium text-[#7ba3ff] group-hover:text-[#a3c4ff] group-hover:underline line-clamp-2">
                          {source.title}
                        </p>
                        {source.snippet && (
                          <p className="mt-1 text-[15px] text-gray-400 leading-snug line-clamp-2">
                            {source.snippet}
                          </p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
            {hasExplainability && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowReasoning((v) => !v)}
                  className="text-[15px] font-medium text-gray-400 hover:text-gray-200"
                >
                  {showReasoning ? "Hide" : "Explain reasoning"}
                </button>
                {showReasoning && (
                  <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div>
                      <p className="mb-2 text-[14px] font-semibold uppercase tracking-wider text-gray-400">
                        Reasoning chain
                      </p>
                      <ol className="list-inside list-decimal space-y-2 text-[16px] text-gray-300 leading-relaxed">
                        {message.reasoningChain?.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="mb-2 text-[14px] font-semibold uppercase tracking-wider text-gray-400">
                        Key source excerpts
                      </p>
                      <ul className="space-y-3">
                        {message.sources?.map((source, i) => (
                          <li key={i} className="border-l-2 border-white/10 pl-4 text-[16px]">
                            <span className="font-medium text-gray-300">
                              {source.title}
                            </span>
                            {source.snippet && (
                              <p className="mt-1 text-gray-400 text-[15px] leading-snug">
                                {source.snippet}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [researchMode, setResearchMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamResearchResponse = async (userContent: string) => {
    const assistantId = crypto.randomUUID();
    let statusMessages: string[] = [];

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
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userContent }),
      });

      if (!res.ok) {
        throw new Error(res.statusText || "Research failed");
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
              data?: {
                summary: string;
                keyInsights: string[];
                contradictions: string[];
                confidence: number;
                sources: Source[];
                limitations: string[];
                reasoningChain?: string[];
              };
              fromCache?: boolean;
              error?: string;
            };

            if (parsed.type === "status" && parsed.message) {
              statusMessages = [...statusMessages, parsed.message];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: statusMessages.join("\n"),
                        isStreaming: true,
                      }
                    : m
                )
              );
            } else if (parsed.type === "result" && parsed.data) {
              const { summary, keyInsights, contradictions, sources, limitations, reasoningChain } =
                parsed.data;
              const parts: string[] = [summary];
              if (keyInsights.length > 0) {
                parts.push("\n\n**Key insights:**\n" + keyInsights.map((k) => `• ${k}`).join("\n"));
              }
              if (contradictions.length > 0) {
                parts.push("\n\n**Contradictions:**\n" + contradictions.map((c) => `• ${c}`).join("\n"));
              }
              if (limitations.length > 0) {
                parts.push("\n\n**Limitations:**\n" + limitations.map((l) => `• ${l}`).join("\n"));
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: parts.join(""),
                        sources,
                        reasoningChain: reasoningChain ?? [],
                        isStreaming: false,
                        fromCache: parsed.fromCache ?? false,
                      }
                    : m
                )
              );
            } else if (parsed.type === "error" || parsed.error) {
              throw new Error(parsed.error ?? "Research failed");
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
            data?: { summary: string; keyInsights: string[]; contradictions: string[]; sources: Source[]; limitations: string[] };
            error?: string;
          };
          if (parsed.type === "result" && parsed.data) {
            const parsedWithCache = parsed as { data: typeof parsed.data & { reasoningChain?: string[] }; fromCache?: boolean };
            const { summary, keyInsights, contradictions, sources, limitations, reasoningChain } = parsedWithCache.data;
            const parts = [summary];
            if (keyInsights.length) parts.push("\n\n**Key insights:**\n" + keyInsights.map((k) => `• ${k}`).join("\n"));
            if (contradictions.length) parts.push("\n\n**Contradictions:**\n" + contradictions.map((c) => `• ${c}`).join("\n"));
            if (limitations.length) parts.push("\n\n**Limitations:**\n" + limitations.map((l) => `• ${l}`).join("\n"));
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: parts.join(""), sources, reasoningChain: reasoningChain ?? [], isStreaming: false, fromCache: parsedWithCache.fromCache ?? false }
                  : m
              )
            );
          }
        } catch {
          /* ignore parse errors for trailing buffer */
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Research failed.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${message}`, isStreaming: false }
            : m
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
      streamResearchResponse(trimmed);
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
    <div className="flex h-screen flex-col bg-[#0a0a0f]">
      <div className="flex flex-1 flex-col min-h-0">
        <Navbar onBack={() => setMessages([])} />
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
    <HeroWave
      title="Research with AI."
      subtitle="Ask anything. Use Chat for quick answers, or Research for in-depth analysis with sources."
      onPromptSubmit={handlePromptSubmit}
      researchMode={researchMode}
      onResearchModeChange={setResearchMode}
    />
  );
}
