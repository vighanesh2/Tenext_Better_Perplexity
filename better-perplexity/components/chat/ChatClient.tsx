"use client";

import { useState, useRef, useEffect } from "react";
import type { Message, Source } from "./types";

const MOCK_SOURCES: Source[] = [
  { title: "Research paper on topic", url: "https://example.com/paper", snippet: "Relevant excerpt from the source..." },
  { title: "Documentation reference", url: "https://example.com/docs", snippet: "Another relevant snippet..." },
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

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

  const simulateStreamingResponse = async (userContent: string) => {
    const assistantId = crypto.randomUUID();
    const sampleResponse =
      "This is a simulated streaming response. In a real implementation, this would connect to an API and stream tokens as they arrive. The design supports both real-time streaming and structured source citations below each response.";

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);

    for (let i = 0; i <= sampleResponse.length; i += 2) {
      await new Promise((r) => setTimeout(r, 20));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: sampleResponse.slice(0, i), isStreaming: true }
            : m
        )
      );
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              content: sampleResponse,
              sources: MOCK_SOURCES,
              isStreaming: false,
            }
          : m
      )
    );
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
    simulateStreamingResponse(trimmed);
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
