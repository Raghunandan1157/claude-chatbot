"use client";

import { useState, useRef } from "react";

const CATEGORIES = [
  { id: "thought", label: "Thought", key: "t" },
  { id: "task", label: "Task", key: "k" },
  { id: "idea", label: "Idea", key: "i" },
  { id: "meeting", label: "Meeting", key: "m" },
  { id: "reminder", label: "Reminder", key: "r" },
];

type Props = {
  onSubmit: (content: string, category: string) => void;
  disabled: boolean;
};

export default function EntryInput({ onSubmit, disabled }: Props) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("thought");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed, category);
    setContent("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--border)] px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-all ${
              category === cat.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-40 resize-none text-sm"
          style={{ minHeight: "42px", maxHeight: "120px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "42px";
            target.style.height = target.scrollHeight + "px";
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          className="p-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
