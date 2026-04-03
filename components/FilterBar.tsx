"use client";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "task", label: "Tasks" },
  { id: "thought", label: "Thoughts" },
  { id: "idea", label: "Ideas" },
  { id: "meeting", label: "Meetings" },
  { id: "reminder", label: "Reminders" },
];

type Props = {
  active: string;
  onChange: (filter: string) => void;
  counts: Record<string, number>;
};

export default function FilterBar({ active, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--border)] overflow-x-auto">
      {FILTERS.map((f) => {
        const count = f.id === "all" ? counts.all || 0 : counts[f.id] || 0;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
              active === f.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f.label}
            {count > 0 && (
              <span className="ml-1 opacity-60">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
