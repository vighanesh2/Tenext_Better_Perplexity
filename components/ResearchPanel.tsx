"use client";

import { useState } from "react";
import { marked } from "marked";
import { useNotebookStore, type NotebookItem } from "@/store/notebookStore";
import { NotebookItemRenderer } from "@/components/NotebookItemRenderer";

function formatTimestampExport(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ModeBadge({ mode }: { mode: NotebookItem["mode"] }) {
  const styles =
    mode === "research"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : mode === "system_design"
        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
        : "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider border ${styles}`}
    >
      {mode.replace("_", " ")}
    </span>
  );
}

function notebookItemToMarkdown(item: NotebookItem): string {
  const p = item.payload;
  const lines: string[] = [];

  lines.push(`## ${item.query || "Untitled"}`);
  lines.push("");
  lines.push(`- **Mode:** ${item.mode.replace("_", " ")}`);
  lines.push(`- **Saved:** ${formatTimestampExport(item.createdAt)}`);
  lines.push("");

  if (p.mode === "research") {
    lines.push("### Summary");
    lines.push("");
    lines.push(p.summary);
    lines.push("");
    if (p.keyInsights.length > 0) {
      lines.push("### Key Insights");
      lines.push("");
      p.keyInsights.forEach((k) => lines.push(`- ${k}`));
      lines.push("");
    }
    if (p.contradictions.length > 0) {
      lines.push("### Contradictions");
      lines.push("");
      p.contradictions.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }
    if (p.sources.length > 0) {
      lines.push("### Sources");
      lines.push("");
      p.sources.forEach((s) => lines.push(`- [${s.title}](${s.url})`));
      lines.push("");
    }
  } else if (p.mode === "system_design") {
    lines.push("### Architecture");
    lines.push("");
    lines.push(p.architectureDescription);
    lines.push("");
    if (p.systemComponents.length > 0) {
      lines.push("### Components");
      lines.push("");
      p.systemComponents.forEach((c) => lines.push(`- ${c}`));
      lines.push("");
    }
    lines.push("### Scaling");
    lines.push("");
    lines.push(`- Concurrent users: ${p.scalingAssumptions.concurrentUsers.toLocaleString()}`);
    lines.push(`- Requests/sec: ${p.scalingAssumptions.requestsPerSecond.toLocaleString()}`);
    if (p.scalingMath) {
      lines.push(`- ${p.scalingMath.numericReasoning}`);
    }
    lines.push("");
    if (p.throughputEstimation) {
      lines.push("### Throughput");
      lines.push("");
      lines.push(p.throughputEstimation);
      lines.push("");
    }
    if (p.partitionStrategy) {
      lines.push("### Partition Strategy");
      lines.push("");
      lines.push(p.partitionStrategy);
      lines.push("");
    }
    if (p.tradeoffs.length > 0) {
      lines.push("### Tradeoffs");
      lines.push("");
      p.tradeoffs.forEach((t) => {
        lines.push(`- **${t.component}:** Latency ${t.latency}, Throughput ${t.throughput}`);
      });
      lines.push("");
    }
    if (p.bottlenecks.length > 0) {
      lines.push("### Bottlenecks");
      lines.push("");
      p.bottlenecks.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    }
    if (p.diagram) {
      lines.push("### Diagram");
      lines.push("");
      lines.push("```mermaid");
      lines.push(p.diagram);
      lines.push("```");
      lines.push("");
    }
  } else if (p.mode === "general") {
    lines.push("### Answer");
    lines.push("");
    lines.push(p.answer);
    lines.push("");
  }

  if (item.userNotes?.trim()) {
    lines.push("### Notes");
    lines.push("");
    lines.push(item.userNotes);
    lines.push("");
  }

  return lines.join("\n");
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPrintableHtml(markdownContent: string): string {
  const bodyHtml = marked(markdownContent, { async: false });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Research Notebook Export</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.5; color: #1a1a1a; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.75rem; margin: 0 0 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; }
    h3 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
    p { margin: 0 0 0.75rem; }
    ul, ol { margin: 0 0 0.75rem; padding-left: 1.5rem; }
    li { margin-bottom: 0.25rem; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
    code { background: #f4f4f4; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; border-radius: 4px; font-size: 11px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ccc; margin: 0 0 0.75rem; padding-left: 1rem; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f8f8f8; font-weight: 600; }
    .sources a { display: block; margin-bottom: 0.25rem; }
    @media print { body { margin: 1rem; } h2 { page-break-after: avoid; } }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

interface ResearchPanelProps {
  onClose?: () => void;
  /** When true, panel fills its container (for embedded layout) */
  embedded?: boolean;
}

export function ResearchPanel({ onClose, embedded }: ResearchPanelProps) {
  const { items, removeItem, updateNotes, togglePin, addItem } = useNotebookStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quickCapture, setQuickCapture] = useState("");

  const sortedItems = [...items].sort((a, b) => {
    const aPin = a.pinned ?? false;
    const bPin = b.pinned ?? false;
    if (aPin !== bPin) return bPin ? 1 : -1; // pinned first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const selected = selectedId ? items.find((i) => i.id === selectedId) : null;

  const handleExportSelected = () => {
    if (!selected) return;
    const md = `# Research Notebook Export\n\n${notebookItemToMarkdown(selected)}`;
    downloadMarkdown(md, `research-notebook-${selected.id.slice(0, 8)}.md`);
    setExportOpen(false);
  };

  const handleExportAll = () => {
    if (items.length === 0) return;
    const header = "# Research Notebook Export\n\n";
    const body = sortedItems.map((item) => notebookItemToMarkdown(item)).join("\n---\n\n");
    downloadMarkdown(header + body, `research-notebook-export-${new Date().toISOString().slice(0, 10)}.md`);
    setExportOpen(false);
  };

  const getMarkdownContent = () => {
    if (selected) {
      return `# Research Notebook Export\n\n${notebookItemToMarkdown(selected)}`;
    }
    const header = "# Research Notebook Export\n\n";
    const body = sortedItems.map((item) => notebookItemToMarkdown(item)).join("\n---\n\n");
    return header + body;
  };

  const handleCopyMarkdown = async () => {
    if (items.length === 0) return;
    try {
      await navigator.clipboard.writeText(getMarkdownContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickCapture.trim();
    if (!text) return;
    addItem({
      query: text.length > 80 ? `${text.slice(0, 77)}...` : text,
      mode: "general",
      payload: { mode: "general", answer: text },
      userNotes: "",
    });
    setQuickCapture("");
  };

  const handleExportPdf = () => {
    if (items.length === 0) return;
    const html = buildPrintableHtml(getMarkdownContent());
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    // Leave window open so user can review / Save as PDF; they close when done
  };

  return (
    <aside
      className={`shrink-0 flex flex-col border-l border-white/10 bg-[#0a0a0f] ${
        embedded ? "w-full h-full min-h-0" : "w-[420px] h-screen"
      }`}
    >
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-gray-500">Research document</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {copied ? "Copied" : "Copy as Markdown"}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Export PDF
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Export Markdown
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-white/10 bg-[#0f0f14] py-1 shadow-xl">
                  <button
                    type="button"
                    onClick={handleExportSelected}
                    disabled={!selected}
                    className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Export selected
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAll}
                    className="w-full text-left px-4 py-2 text-[13px] text-gray-300 hover:bg-white/5"
                  >
                    Export all
                  </button>
                </div>
              </>
            )}
          </div>
          {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-[13px] text-gray-500 hover:text-gray-300"
              >
                ← Back to list
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePin(selected.id)}
                  aria-label={selected.pinned ? "Unpin" : "Pin"}
                  className={`p-1 rounded transition-colors ${selected.pinned ? "text-amber-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  <svg className="w-4 h-4" fill={selected.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeItem(selected.id);
                    setSelectedId(null);
                  }}
                  className="text-[13px] text-red-400/90 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[420px]">
              {/* Document layout */}
              <article className="space-y-8 text-[15px] leading-relaxed">
                <header>
                  <h1 className="text-[20px] font-semibold text-gray-100 leading-tight mb-2">
                    {selected.query || "Untitled"}
                  </h1>
                  <div className="flex items-center gap-3 text-[12px] text-gray-500">
                    <ModeBadge mode={selected.mode} />
                    <span>{formatTimestampExport(selected.createdAt)}</span>
                  </div>
                </header>

                <section>
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-4">Findings</h2>
                  <div className="text-gray-300 [&_h4]:mt-6 [&_h4]:first:mt-0">
                    <NotebookItemRenderer item={selected} />
                  </div>
                </section>

                <section className="pt-6 border-t border-white/10">
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    Your notes
                  </h2>
                  <p className="text-[12px] text-gray-500 mb-3">
                    Document your analysis, conclusions, and next steps.
                  </p>
                  <textarea
                    value={selected.userNotes}
                    onChange={(e) => updateNotes(selected.id, e.target.value)}
                    placeholder="Add your research notes, insights, and follow-up questions..."
                    rows={6}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-gray-200 placeholder:text-gray-500/80 outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-y min-h-[140px] leading-relaxed"
                  />
                </section>
              </article>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <form onSubmit={handleQuickCapture} className="px-4 py-3 border-b border-white/10 shrink-0">
              <input
                type="text"
                value={quickCapture}
                onChange={(e) => setQuickCapture(e.target.value)}
                placeholder="Paste URL or note..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-gray-200 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-white/20"
              />
            </form>
            <div className="flex-1 overflow-y-auto">
              {sortedItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-[14px] text-gray-500">
                No items yet. Save research from the chat or use Quick Capture above to start your document.
                </div>
              ) : (
                <ul className="py-2">
                  {sortedItems.map((item) => (
                    <li key={item.id} className="group flex items-stretch border-b border-white/5">
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="flex-1 text-left px-4 py-3 hover:bg-white/5 transition-colors min-w-0"
                      >
                        <p className="text-[14px] font-medium text-gray-200 line-clamp-2 mb-1">{item.query || "Untitled"}</p>
                        <div className="flex items-center gap-2">
                          <ModeBadge mode={item.mode} />
                          <span className="text-[11px] text-gray-500">{formatTimestamp(item.createdAt)}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                        aria-label={item.pinned ? "Unpin" : "Pin"}
                        className={`shrink-0 px-2 flex items-center transition-opacity ${item.pinned ? "opacity-100 text-amber-400" : "opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300"}`}
                      >
                        <svg className="w-4 h-4" fill={item.pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}