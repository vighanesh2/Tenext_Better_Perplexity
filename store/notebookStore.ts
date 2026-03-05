import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdaptiveResponse, ResponseMode } from "@/components/chat/types";

export interface NotebookItem {
  id: string;
  createdAt: string;
  query: string;
  mode: ResponseMode;
  payload: AdaptiveResponse;
  userNotes: string;
  pinned?: boolean;
}

interface NotebookState {
  items: NotebookItem[];
  addItem: (item: Omit<NotebookItem, "id" | "createdAt">) => void;
  removeItem: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  togglePin: (id: string) => void;
  clearAll: () => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const useNotebookStore = create<NotebookState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              ...item,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateNotes: (id, notes) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, userNotes: notes } : i
          ),
        })),

      togglePin: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, pinned: !(i.pinned ?? false) } : i
          ),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: "research-notebook-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
