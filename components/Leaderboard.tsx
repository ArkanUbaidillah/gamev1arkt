"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaderboardEntry } from "@/lib/types";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("leaderboard")
      .select("id, username, score, hero_name, is_hotw, created_at")
      .order("score", { ascending: false })
      .limit(10);

    if (data) setEntries(data as LeaderboardEntry[]);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchLeaderboard();
    }, 0);

    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leaderboard" },
        fetchLeaderboard,
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const rankStyles = ["text-yellow-400", "text-gray-300", "text-orange-400"];
  const rankIcons = ["1", "2", "3"];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 w-full max-w-sm">
      <h3 className="text-center text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3">
        Global Leaderboard
      </h3>

      {loading ? (
        <div className="text-center text-gray-500 py-4 text-xs">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-600 py-4 text-xs">
          Belum ada skor. Jadilah yang pertama!
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                index === 0
                  ? "bg-yellow-900/20 border border-yellow-700/30"
                  : "bg-gray-800/50"
              }`}
            >
              <span
                className={`w-5 text-center ${rankStyles[index] ?? "text-gray-500"}`}
              >
                {rankIcons[index] ?? `#${index + 1}`}
              </span>
              <span className="flex-1 text-white font-medium truncate">
                {entry.username}
              </span>
              <span className="text-gray-400">{entry.hero_name}</span>
              {entry.is_hotw && (
                <span className="text-yellow-400 text-[10px]">HOTW</span>
              )}
              <span className="text-cyan-400 font-bold tabular-nums w-16 text-right">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
