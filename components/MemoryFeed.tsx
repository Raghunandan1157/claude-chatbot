"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import EntryCard from "./EntryCard";
import EntryInput from "./EntryInput";
import FilterBar from "./FilterBar";

type Entry = {
  id: string;
  content: string;
  category: string;
  status: string | null;
  created_at: string;
  synced_to_obsidian: boolean;
};

const XP_VALUES: Record<string, number> = {
  thought: 10,
  task: 15,
  idea: 20,
  meeting: 10,
  reminder: 10,
};

const TASK_COMPLETE_XP = 30;

function xpForLevel(level: number) {
  return level * 100;
}

export default function MemoryFeed() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const feedTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setEntries(data);
    };
    load();

    const channel = supabase
      .channel("entries-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "entries" },
        (payload) => {
          const newEntry = payload.new as Entry;
          setEntries((prev) => {
            if (prev.some((e) => e.id === newEntry.id)) return prev;
            return [newEntry, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "entries" },
        (payload) => {
          const updated = payload.new as Entry;
          setEntries((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const grantXp = useCallback(async (amount: number, isTaskComplete: boolean) => {
    const { data: stats } = await supabase
      .from("user_stats")
      .select("*")
      .eq("id", 1)
      .single();

    if (!stats) return;

    const today = new Date().toISOString().split("T")[0];
    const lastActive = stats.last_active_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let newStreak = stats.streak_days;
    if (lastActive !== today) {
      if (lastActive === yesterday) {
        newStreak += 1;
      } else if (lastActive !== today) {
        newStreak = 1;
      }
    }

    const newXp = stats.xp + amount;
    let newLevel = stats.level;
    while (newXp >= xpForLevel(newLevel) * newLevel) {
      newLevel++;
    }
    // Simpler level calc
    newLevel = Math.floor(newXp / 100) + 1;

    await supabase
      .from("user_stats")
      .update({
        xp: newXp,
        level: newLevel,
        streak_days: newStreak,
        longest_streak: Math.max(stats.longest_streak, newStreak),
        last_active_date: today,
        total_entries: stats.total_entries + (isTaskComplete ? 0 : 1),
        tasks_completed: stats.tasks_completed + (isTaskComplete ? 1 : 0),
      })
      .eq("id", 1);
  }, []);

  const addEntry = useCallback(async (content: string, category: string) => {
    setSaving(true);

    const { data } = await supabase
      .from("entries")
      .insert({
        content,
        category,
        status: category === "task" ? "todo" : null,
      })
      .select()
      .single();

    if (data) {
      setEntries((prev) => {
        if (prev.some((e) => e.id === data.id)) return prev;
        return [data, ...prev];
      });
    }

    // Grant XP
    await grantXp(XP_VALUES[category] || 10, false);

    setSaving(false);
  }, [grantXp]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await supabase.from("entries").update({ status }).eq("id", id);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );

    // Grant XP for completing a task
    if (status === "done") {
      await grantXp(TASK_COMPLETE_XP, true);
    }
  }, [grantXp]);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.category === filter);
  }, [entries, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length };
    for (const e of entries) {
      c[e.category] = (c[e.category] || 0) + 1;
    }
    return c;
  }, [entries]);

  // Motivational empty states
  const emptyMessages = [
    { emoji: "🧠", title: "Your memory is empty", sub: "Drop your first thought. Every great thing starts with one." },
    { emoji: "⚡", title: "Nothing here yet", sub: "Capture a task. Start small. Build momentum." },
    { emoji: "🔥", title: "Feed the fire", sub: "Your streak is waiting. Add something. Anything." },
  ];
  const emptyMsg = emptyMessages[Math.floor(Date.now() / 60000) % emptyMessages.length];

  return (
    <div className="flex flex-col h-full">
      <FilterBar active={filter} onChange={setFilter} counts={counts} />

      <div className="flex-1 overflow-y-auto px-4 py-4 grid-bg">
        <div ref={feedTopRef} />
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-pop-in">
              <div className="text-4xl mb-3">{emptyMsg.emoji}</div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                {emptyMsg.title}
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-[240px]">
                {emptyMsg.sub}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onStatusChange={updateStatus}
            />
          ))
        )}
      </div>

      <EntryInput onSubmit={addEntry} disabled={saving} />
    </div>
  );
}
