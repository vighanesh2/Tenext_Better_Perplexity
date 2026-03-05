import { create } from "zustand";

const PERSIST_KEY = "notebook-text-store";
const DEBOUNCE_MS = 300;

interface NotebookTextState {
  text: string;
  lastSavedAt: number | null;
  setText: (text: string) => void;
  appendText: (textToAppend: string) => void;
  setLastSavedAt: (timestamp: number | null) => void;
  persistNow: () => void;
  /** Load from localStorage. Call in useEffect (client-only) to avoid hydration mismatch. */
  hydrate: () => void;
  // For Insert buttons: append + request scroll
  scrollRequested: boolean;
  appendAndScroll: (textToAppend: string) => void;
  requestScrollToBottom: () => void;
  clearScrollRequest: () => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function persistText(text: string) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(PERSIST_KEY, text);
      return Date.now();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadText(): string {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PERSIST_KEY);
      return stored ?? "";
    }
  } catch {
    /* ignore */
  }
  return "";
}

const useNotebookTextStore = create<NotebookTextState>()((set, get) => ({
  text: "",
  lastSavedAt: null,
  scrollRequested: false,

  hydrate: () => {
    const loaded = loadText();
    if (loaded) set({ text: loaded });
  },

  setText: (text) => {
    set({ text });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const ts = persistText(get().text);
      if (ts != null) set({ lastSavedAt: ts });
    }, DEBOUNCE_MS);
  },

  appendText: (textToAppend) => {
    const state = get();
    const next = state.text ? `${state.text}\n\n${textToAppend}` : textToAppend;
    set({ text: next });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const ts = persistText(get().text);
      if (ts != null) set({ lastSavedAt: ts });
    }, DEBOUNCE_MS);
  },

  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),

  persistNow: () => {
    const ts = persistText(get().text);
    if (ts != null) set({ lastSavedAt: ts });
  },

  appendAndScroll: (textToAppend) => {
    const state = get();
    const next = state.text ? `${state.text}\n\n${textToAppend}` : textToAppend;
    set({ text: next, scrollRequested: true });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const ts = persistText(get().text);
      if (ts != null) set({ lastSavedAt: ts });
    }, DEBOUNCE_MS);
  },

  requestScrollToBottom: () => set({ scrollRequested: true }),

  clearScrollRequest: () => set({ scrollRequested: false }),
}));

export { useNotebookTextStore };
export const useNotebookStore = useNotebookTextStore;
