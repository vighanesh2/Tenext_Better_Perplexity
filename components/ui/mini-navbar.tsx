"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Navbar({
  onBack,
  notebookOpen,
  onToggleNotebook,
}: {
  onBack?: () => void;
  notebookOpen?: boolean;
  onToggleNotebook?: () => void;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/sign-in");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4"
      style={{ background: "linear-gradient(to bottom, rgba(15,15,25,0.6), transparent)" }}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors"
            aria-label="Back to home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <span className="text-sm font-medium text-white/90 tracking-tight">Research</span>
      </div>
      <div className="flex items-center gap-4">
        {onToggleNotebook != null && (
          <button
            type="button"
            onClick={onToggleNotebook}
            className={`text-sm transition-colors ${
              notebookOpen ? "text-white/90" : "text-white/60 hover:text-white/90"
            }`}
          >
            Notebook
          </button>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-white/60 hover:text-white/90 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
