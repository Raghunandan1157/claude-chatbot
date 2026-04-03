"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StatusDot() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("bridge_status")
        .select("is_online, last_heartbeat")
        .eq("id", 1)
        .single();

      if (data) {
        const lastBeat = new Date(data.last_heartbeat).getTime();
        const now = Date.now();
        setIsOnline(data.is_online && now - lastBeat < 60000);
      }
    };

    fetchStatus();

    const channel = supabase
      .channel("bridge-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bridge_status" },
        (payload) => {
          const { is_online, last_heartbeat } = payload.new as {
            is_online: boolean;
            last_heartbeat: string;
          };
          const lastBeat = new Date(last_heartbeat).getTime();
          const now = Date.now();
          setIsOnline(is_online && now - lastBeat < 60000);
        }
      )
      .subscribe();

    const interval = setInterval(fetchStatus, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          isOnline
            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        }`}
      />
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}
