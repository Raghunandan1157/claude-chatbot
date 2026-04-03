"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Stats = {
  xp: number;
  level: number;
  streak_days: number;
  total_entries: number;
  tasks_completed: number;
  longest_streak: number;
};

function xpForLevel(level: number) {
  return level * 100;
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats>({
    xp: 0,
    level: 1,
    streak_days: 0,
    total_entries: 0,
    tasks_completed: 0,
    longest_streak: 0,
  });
  const [xpPopup, setXpPopup] = useState<{ amount: number; key: number } | null>(null);
  const [prevXp, setPrevXp] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("*")
        .eq("id", 1)
        .single();
      if (data) {
        setStats(data);
        setPrevXp(data.xp);
      }
    };
    load();

    const channel = supabase
      .channel("stats-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_stats" },
        (payload) => {
          const newStats = payload.new as Stats;
          setStats((prev) => {
            const diff = newStats.xp - prev.xp;
            if (diff > 0) {
              setXpPopup({ amount: diff, key: Date.now() });
            }
            return newStats;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const xpNeeded = xpForLevel(stats.level);
  const xpInLevel = stats.xp % xpNeeded || (stats.xp > 0 ? xpNeeded : 0);
  const xpPercent = Math.min((xpInLevel / xpNeeded) * 100, 100);

  const levelTitle = stats.level <= 2 ? "Rookie" :
    stats.level <= 5 ? "Focused" :
    stats.level <= 10 ? "Locked In" :
    stats.level <= 20 ? "Unstoppable" :
    stats.level <= 50 ? "Legend" : "Transcended";

  return (
    <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        {/* Level badge */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-900 flex items-center justify-center animate-glow-pulse">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>
              {stats.level}
            </span>
          </div>
          {xpPopup && (
            <div
              key={xpPopup.key}
              className="absolute -top-2 -right-2 text-[var(--neon-green)] font-bold text-xs animate-float-up pointer-events-none"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              +{xpPopup.amount}
            </div>
          )}
        </div>

        {/* XP bar + info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider">
              {levelTitle}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "'Space Mono', monospace" }}>
              {xpInLevel}/{xpNeeded} XP
            </span>
          </div>
          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${xpPercent}%`,
                background: "linear-gradient(90deg, var(--accent), var(--neon-green))",
                boxShadow: "0 0 10px var(--accent-glow)",
              }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
          <span
            className={`text-base ${stats.streak_days > 0 ? "animate-streak-flame" : ""}`}
            style={{ display: "inline-block" }}
          >
            {stats.streak_days > 0 ? "🔥" : "💤"}
          </span>
          <span
            className="text-xs font-bold"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: stats.streak_days > 0 ? "var(--streak-fire)" : "var(--text-muted)",
            }}
          >
            {stats.streak_days}d
          </span>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-[var(--text-muted)]" style={{ fontFamily: "'Space Mono', monospace" }}>
          <span>{stats.total_entries} captured</span>
          <span className="text-[var(--neon-green)]">{stats.tasks_completed} done</span>
        </div>
      </div>
    </div>
  );
}
