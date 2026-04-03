"use client";

const TAG_COLORS: Record<string, string> = {
  task: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  thought: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  idea: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  meeting: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  reminder: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
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
  onStatusChange?: (id: string, status: string) => void;
};

export default function EntryCard({ entry, onStatusChange }: Props) {
  const time = new Date(entry.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 mb-2 hover:border-[var(--accent)]/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap flex-1">
          {entry.content}
        </p>
        {entry.synced_to_obsidian && (
          <span className="text-[10px] text-[var(--text-muted)] shrink-0" title="Synced to Obsidian">
            synced
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border ${TAG_COLORS[entry.category] || TAG_COLORS.thought}`}
        >
          {entry.category}
        </span>

        {entry.category === "task" && entry.status && (
          <button
            onClick={() => {
              if (!onStatusChange) return;
              const next =
                entry.status === "todo"
                  ? "in_progress"
                  : entry.status === "in_progress"
                  ? "done"
                  : "todo";
              onStatusChange(entry.id, next);
            }}
            className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
              entry.status === "done"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : entry.status === "in_progress"
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
            }`}
          >
            {STATUS_LABELS[entry.status]}
          </button>
        )}

        <span className="text-[10px] text-[var(--text-muted)] ml-auto">
          {time}
        </span>
      </div>
    </div>
  );
}
