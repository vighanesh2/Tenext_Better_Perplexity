"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";

const BUTTON =
  "p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40";
const BUTTON_ACTIVE = "text-white bg-white/10";

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-white/10 px-2 py-1.5 shrink-0">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${BUTTON} ${editor.isActive("bold") ? BUTTON_ACTIVE : ""}`}
        title="Bold"
      >
        <span className="font-bold text-sm">B</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${BUTTON} ${editor.isActive("italic") ? BUTTON_ACTIVE : ""}`}
        title="Italic"
      >
        <span className="italic text-sm">I</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${BUTTON} ${editor.isActive("strike") ? BUTTON_ACTIVE : ""}`}
        title="Strikethrough"
      >
        <span className="line-through text-sm">S</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${BUTTON} ${editor.isActive("heading", { level: 1 }) ? BUTTON_ACTIVE : ""}`}
        title="Heading 1"
      >
        <span className="text-xs font-semibold">H1</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${BUTTON} ${editor.isActive("heading", { level: 2 }) ? BUTTON_ACTIVE : ""}`}
        title="Heading 2"
      >
        <span className="text-xs font-semibold">H2</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${BUTTON} ${editor.isActive("heading", { level: 3 }) ? BUTTON_ACTIVE : ""}`}
        title="Heading 3"
      >
        <span className="text-xs font-semibold">H3</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${BUTTON} ${editor.isActive("bulletList") ? BUTTON_ACTIVE : ""}`}
        title="Bullet list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${BUTTON} ${editor.isActive("orderedList") ? BUTTON_ACTIVE : ""}`}
        title="Numbered list"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${BUTTON} ${editor.isActive("blockquote") ? BUTTON_ACTIVE : ""}`}
        title="Quote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20v-4a7 7 0 017-7h5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={BUTTON}
        title="Horizontal rule"
      >
        —
      </button>
    </div>
  );
}

interface NotebookEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  focusMode?: boolean;
  /** Ref to the scrollable editor content area (for scroll-to-bottom) */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function NotebookEditor({
  content,
  onChange,
  placeholder = "Write your notes...",
  focusMode,
  scrollContainerRef,
}: NotebookEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: `min-h-[180px] px-4 py-3 outline-none text-gray-200 placeholder:text-gray-500 ${
          focusMode ? "text-[17px] leading-[1.8]" : "text-[15px] leading-relaxed"
        }`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const prevContentRef = useRef(content);
  useEffect(() => {
    if (editor && content !== undefined && content !== prevContentRef.current) {
      prevContentRef.current = content;
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content || "", { emitUpdate: false });
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-white/10 rounded-lg bg-white/5 overflow-hidden">
      <Toolbar editor={editor} />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
