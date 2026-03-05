"use client";

import { useState } from "react";
import ChatClient from "@/components/chat/ChatClient";
import NotebookPanel from "@/components/NotebookPanel";

export default function WorkspaceLayout() {
  const [notebookOpen, setNotebookOpen] = useState(true);
  const [mobileNotebookOpen, setMobileNotebookOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0f] flex-col lg:flex-row">
      {/* Left pane: Chat (65-70%) */}
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col transition-[flex] duration-200 ease-out pb-20 lg:pb-0 ${
          notebookOpen ? "lg:basis-[67%]" : "lg:flex-1"
        }`}
      >
        <ChatClient
          notebookOpen={notebookOpen}
          onToggleNotebook={() => setNotebookOpen((o) => !o)}
        />
      </div>

      {/* Right pane: Notebook (desktop) */}
      <div
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-200 ease-out overflow-hidden ${
          notebookOpen ? "w-[35%] min-w-[320px] max-w-[480px]" : "w-0 min-w-0 max-w-0"
        }`}
      >
        {notebookOpen && (
          <div className="flex-1 min-w-0 min-h-0 flex w-full">
            <NotebookPanel />
          </div>
        )}
      </div>

      {/* Mobile: Notebook drawer */}
      {mobileNotebookOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileNotebookOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md lg:hidden flex flex-col shadow-xl border-l border-white/10 bg-[#0a0a0f]">
            <NotebookPanel />
          </div>
        </>
      )}

      {/* Mobile FAB: Open notebook (hidden when drawer is open) */}
      {!mobileNotebookOpen && (
      <button
        type="button"
        onClick={() => setMobileNotebookOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 flex items-center justify-center shadow-lg transition-colors"
        aria-label="Open notebook"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </button>
      )}
    </div>
  );
}
