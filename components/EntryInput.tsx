"use client";

import { useState, useRef } from "react";

const CATEGORIES = [
  { id: "thought", label: "THOUGHT", emoji: "💭", xp: 10 },
  { id: "task", label: "TASK", emoji: "⚡", xp: 15 },
  { id: "idea", label: "IDEA", emoji: "💡", xp: 20 },
  { id: "meeting", label: "MEETING", emoji: "📅", xp: 10 },
  { id: "reminder", label: "REMINDER", emoji: "🔔", xp: 10 },
];

type Props = {
  onSubmit: (content: string, category: string) => void;
  disabled: boolean;
};

export default function EntryInput({ onSubmit, disabled }: Props) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("thought");
  const [justSent, setJustSent] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedCat = CATEGORIES.find((c) => c.id === category)!;

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed, category);
    setContent("");
    setJustSent(true);
    setTimeout(() => setJustSent(false), 600);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Number keys 1-5 with Cmd/Ctrl to switch category
    if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "5") {
      e.preventDefault();
      const idx = parseInt(e.key) - 1;
      if (CATEGORIES[idx]) setCategory(CATEGORIES[idx].id);
    }
  };

  return (
    <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--bg-secondary)]">
      {/* Category pills */}
      <div className="flex items-center gap-1 mb-2.5 overflow-x-auto">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
              category === cat.id
                ? "bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)] scale-105"
                : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            {category === cat.id && (
              <span className="text-[8px] opacity-60">+{cat.xp}xp</span>
            )}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Drop a ${selectedCat.id}...`}
            disabled={disabled}
            rows={1}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_15px_var(--accent-glow)] transition-all duration-200 disabled:opacity-40 resize-none text-sm"
            style={{ minHeight: "42px", maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "42px";
              target.style.height = target.scrollHeight + "px";
            }}
          />
          {content.trim() && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-muted)] pointer-events-none"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              ⏎ send
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          className={`p-2.5 rounded-xl text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
            justSent
              ? "bg-emerald-500 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-[0_0_20px_var(--accent-glow)] hover:scale-105 active:scale-95"
          }`}
        >
          {justSent ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[8px] text-[var(--text-muted)]" style={{ fontFamily: "'Space Mono', monospace" }}>
          ⌘1-5 switch category
        </span>
        <span className="text-[8px] text-[var(--text-muted)]" style={{ fontFamily: "'Space Mono', monospace" }}>
          shift+⏎ new line
        </span>
      </div>
    </div>
  );
}
