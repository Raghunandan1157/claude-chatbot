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

export default function MemoryFeed() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Load entries
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

    // Subscribe to changes
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

    return () => {
      supabase.removeChannel(channel);
    };
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

    setSaving(false);
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    await supabase.from("entries").update({ status }).eq("id", id);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }, []);

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

  return (
    <div className="flex flex-col h-full">
      <FilterBar active={filter} onChange={setFilter} counts={counts} />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-3">🧠</div>
              <h2 className="text-base font-medium text-[var(--text-primary)] mb-1">
                Your memory is empty
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Start capturing thoughts, tasks, ideas, and more.
              </p>
            </div>
          </div>
        )}
        {filtered.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onStatusChange={updateStatus}
          />
        ))}
        <div ref={feedEndRef} />
      </div>

      <EntryInput onSubmit={addEntry} disabled={saving} />
    </div>
  );
}
