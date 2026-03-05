"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNotebookTextStore } from "@/store/notebookTextStore";
import { NotebookEditor } from "./NotebookEditor";
import { exportToPdf, exportToDoc } from "@/lib/notebookExport";

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

function formatLastSaved(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function downloadMarkdown(content: string, filename: string) {
  const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "No notes yet";
  const blob = new Blob([plain], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NotebookPanel() {
  const text = useNotebookTextStore((s) => s.text);
  const setText = useNotebookTextStore((s) => s.setText);
  const lastSavedAt = useNotebookTextStore((s) => s.lastSavedAt);
  const scrollRequested = useNotebookTextStore((s) => s.scrollRequested);
  const clearScrollRequest = useNotebookTextStore((s) => s.clearScrollRequest);

  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDoc, setExportingDoc] = useState(false);
  const persistNow = useNotebookTextStore((s) => s.persistNow);
  const mounted = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hydrate = useNotebookTextStore((s) => s.hydrate);

  useEffect(() => {
    mounted.current = true;
    hydrate();
    try {
      if (localStorage.getItem("notebook-focus-mode") === "1") {
        setFocusMode(true);
      }
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => {
      try {
        const current = useNotebookTextStore.getState().text;
        if (!current || !current.trim()) {
          const legacy = localStorage.getItem("notebook-panel-notes");
          if (legacy && typeof legacy === "string" && legacy.trim()) {
            setText(`<p>${legacy.replace(/\n/g, "</p><p>")}</p>`);
            localStorage.removeItem("notebook-panel-notes");
          }
        }
      } catch {
        /* ignore */
      }
    }, 100);
    return () => {
      clearTimeout(t);
      mounted.current = false;
    };
  }, [hydrate, setText]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Escape" && fullScreenOpen) {
        e.preventDefault();
        persistNow();
        setFullScreenOpen(false);
        return;
      }
      if (mod && e.key === "s") {
        e.preventDefault();
        useNotebookTextStore.getState().persistNow();
      }
      if (mod && e.shiftKey && e.key === "C") {
        e.preventDefault();
        const plain = useNotebookTextStore.getState().text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (plain) navigator.clipboard.writeText(plain);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullScreenOpen, persistNow]);

  useEffect(() => {
    if (scrollRequested && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      clearScrollRequest();
    }
  }, [scrollRequested, text, clearScrollRequest]);

  const performCopy = useCallback(async () => {
    if (!text) return;
    try {
      const plain = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      await navigator.clipboard.writeText(plain || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [text]);

  const handleClear = useCallback(() => {
    if (!text) return;
    if (!window.confirm("Clear all notes? This cannot be undone.")) return;
    setText("");
  }, [text, setText]);

  const handleExportMd = useCallback(() => {
    downloadMarkdown(text || "---\n*No notes yet*\n---", "notebook.md");
  }, [text]);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      await exportToPdf(text || "<p><em>No notes yet</em></p>", "notebook.pdf");
    } finally {
      setExportingPdf(false);
    }
  }, [text]);

  const handleExportDoc = useCallback(async () => {
    setExportingDoc(true);
    try {
      await exportToDoc(text || "<p><em>No notes yet</em></p>", "notebook.docx");
    } finally {
      setExportingDoc(false);
    }
  }, [text]);

  const words = countWords(text);
  const chars = text.replace(/<[^>]*>/g, "").length;

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("notebook-focus-mode", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openFullScreen = useCallback(() => {
    setFullScreenOpen(true);
  }, []);

  const closeFullScreenAndSave = useCallback(() => {
    persistNow();
    setFullScreenOpen(false);
  }, [persistNow]);

  const panelContent = (
    <>
      <header className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-gray-400">
          Notebook
        </h2>
        <div className="flex items-center gap-2">
          {fullScreenOpen && (
            <>
              {lastSavedAt != null && (
                <span className="text-[11px] text-gray-500" aria-live="polite">
                  Saved {formatLastSaved(new Date(lastSavedAt))}
                </span>
              )}
              <button
                type="button"
                onClick={closeFullScreenAndSave}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Close & save
              </button>
            </>
          )}
          {!fullScreenOpen && (
            <button
              type="button"
              onClick={openFullScreen}
              aria-label="Open notebook in full screen"
              title="Open in full screen (like Google Docs)"
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Full screen
            </button>
          )}
          <button
            type="button"
            onClick={toggleFocusMode}
            aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
            title={focusMode ? "Exit focus mode" : "Focus mode"}
            className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
              focusMode ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            Focus
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col gap-4 p-4">
        <NotebookEditor
          content={text}
          onChange={setText}
          placeholder="Write your notes..."
          focusMode={focusMode}
          scrollContainerRef={scrollContainerRef}
        />

        {!focusMode && lastSavedAt != null && (
          <p className="text-[11px] text-gray-600 -mt-2" aria-live="polite">
            Last saved {formatLastSaved(new Date(lastSavedAt))}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          {!focusMode && (
            <div className="flex items-center gap-4 text-[12px] text-gray-500">
              <span>{words} {words === 1 ? "word" : "words"}</span>
              <span>{chars} characters</span>
            </div>
          )}
          <div className={`flex items-center gap-2 flex-wrap ${focusMode ? "w-full justify-end" : ""}`}>
            <button
              type="button"
              onClick={performCopy}
              disabled={!text}
              className="rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            {!focusMode && (
              <button
                type="button"
                onClick={handleClear}
                disabled={!text}
                className="rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleExportMd}
              className="rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Export .md
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {exportingPdf ? "Exporting…" : "Export PDF"}
            </button>
            <button
              type="button"
              onClick={handleExportDoc}
              disabled={exportingDoc}
              className="rounded-lg px-3 py-2 text-[13px] font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {exportingDoc ? "Exporting…" : "Export DOC"}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (fullScreenOpen && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f] overflow-hidden">
        {panelContent}
      </div>,
      document.body
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0f] pt-0 lg:pt-14">
      {panelContent}
    </div>
  );
}
