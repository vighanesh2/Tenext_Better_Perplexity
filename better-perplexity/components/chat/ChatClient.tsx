"use client";

import { useState, useRef, useEffect } from "react";
import type { Message, Source } from "./types";

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [showReasoning, setShowReasoning] = useState(false);

  const hasExplainability =
    !message.isStreaming &&
    message.sources &&
    message.sources.length > 0 &&
    (message.reasoningChain?.length ?? 0) > 0;

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-neutral-800 text-white"
            : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        }`}
      >
        {message.fromCache && !message.isStreaming && (
          <p className="mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Served from cache
          </p>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {message.content}
          {message.isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current" />
          )}
        </p>
        {message.sources && message.sources.length > 0 && !message.isStreaming && (
          <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Sources
            </p>
            <ul className="space-y-2">
              {message.sources.map((source, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {source.title}
                  </a>
                  {source.snippet && (
                    <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                      {source.snippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {hasExplainability && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowReasoning((v) => !v)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showReasoning ? "Hide" : "Explain reasoning"}
                </button>
                {showReasoning && (
                  <div className="mt-3 space-y-3 rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Reasoning chain
                      </p>
                      <ol className="list-inside list-decimal space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                        {message.reasoningChain?.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Key source excerpts
                      </p>
                      <ul className="space-y-2">
                        {message.sources?.map((source, i) => (
                          <li key={i} className="border-l-2 border-neutral-200 pl-2 text-sm dark:border-neutral-600">
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {source.title}
                            </span>
                            {source.snippet && (
                              <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
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
      </div>
    </div>
  );
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    streamResearchResponse(trimmed);
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <h1 className="text-xl font-medium text-neutral-800 dark:text-neutral-200">
                Research Assistant
              </h1>
              <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
                Ask a question to get started. Responses include structured
                source citations.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
