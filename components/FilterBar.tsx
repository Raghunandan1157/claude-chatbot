"use client";

const FILTERS = [
  { id: "all", label: "ALL", emoji: "⚡" },
  { id: "task", label: "TASKS", emoji: "✅" },
  { id: "thought", label: "THOUGHTS", emoji: "💭" },
  { id: "idea", label: "IDEAS", emoji: "💡" },
  { id: "meeting", label: "MEETINGS", emoji: "📅" },
  { id: "reminder", label: "REMINDERS", emoji: "🔔" },
];

type Props = {
  active: string;
  onChange: (filter: string) => void;
  counts: Record<string, number>;
};

export default function FilterBar({ active, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)] overflow-x-auto">
      {FILTERS.map((f) => {
        const count = f.id === "all" ? counts.all || 0 : counts[f.id] || 0;
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
              isActive
                ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span className="text-[10px]">{f.emoji}</span>
            <span>{f.label}</span>
            {count > 0 && (
              <span className={`ml-0.5 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
