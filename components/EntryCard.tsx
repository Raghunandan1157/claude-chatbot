"use client";

import { useState } from "react";

const TAG_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  task: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-[0_0_12px_rgba(251,191,36,0.15)]" },
  thought: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", glow: "shadow-[0_0_12px_rgba(124,58,237,0.15)]" },
  idea: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-[0_0_12px_rgba(34,211,238,0.15)]" },
  meeting: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", glow: "shadow-[0_0_12px_rgba(244,114,182,0.15)]" },
  reminder: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", glow: "shadow-[0_0_12px_rgba(244,63,94,0.15)]" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  todo: { label: "TO DO", icon: "○", color: "text-zinc-400 border-zinc-600/40 bg-zinc-500/10" },
  in_progress: { label: "DOING", icon: "◐", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
  done: { label: "DONE", icon: "●", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
};

type Entry = {
  id: string;
  content: string;
  category: string;
  status: string | null;
  created_at: string;
  synced_to_obsidian: boolean;
};

type Props = {
  entry: Entry;
  index: number;
  onStatusChange?: (id: string, status: string) => void;
};

export default function EntryCard({ entry, index, onStatusChange }: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [shaking, setShaking] = useState(false);

  const style = TAG_STYLES[entry.category] || TAG_STYLES.thought;
  const time = new Date(entry.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleStatusClick = () => {
    if (!onStatusChange || entry.category !== "task") return;

    const next =
      entry.status === "todo" ? "in_progress" :
      entry.status === "in_progress" ? "done" : "todo";

    if (next === "done") {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1500);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }

    onStatusChange(entry.id, next);
  };

  const isDone = entry.status === "done";

  return (
    <div
      className={`animate-slide-in ${shaking ? "animate-shake" : ""}`}
      style={{ animationDelay: `${index * 0.04}s`, animationFillMode: "backwards" }}
    >
      <div
        className={`relative bg-[var(--bg-card)] border rounded-xl px-4 py-3 mb-2 transition-all duration-200 hover:bg-[var(--bg-card-hover)] group ${
          isDone ? "border-emerald-500/20 opacity-60" : `border-[var(--border)] hover:${style.glow}`
        } ${justCompleted ? "border-emerald-400/50 !opacity-100" : ""}`}
      >
        {/* Confetti burst on completion */}
        {justCompleted && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: "50%",
                  background: ["#22d3ee", "#f472b6", "#fbbf24", "#7c3aed", "#22c55e"][i % 5],
                  animation: `confetti-fall ${0.6 + Math.random() * 0.6}s ease-out forwards`,
                  animationDelay: `${i * 0.03}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Status button for tasks */}
          {entry.category === "task" && entry.status && (
            <button
              onClick={handleStatusClick}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shrink-0 transition-all duration-200 hover:scale-125 active:scale-90 ${
                isDone
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : entry.status === "in_progress"
                  ? "border-amber-400 text-amber-400"
                  : "border-zinc-600 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {isDone ? "✓" : entry.status === "in_progress" ? "◐" : ""}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
              }`}
            >
              {entry.content}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {entry.category}
              </span>

              {entry.category === "task" && entry.status && !isDone && (
                <span
                  className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md border ${STATUS_CONFIG[entry.status]?.color}`}
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {STATUS_CONFIG[entry.status]?.label}
                </span>
              )}

              <span
                className="text-[9px] text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {time}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
