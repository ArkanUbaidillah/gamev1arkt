"use client";

import { useState } from "react";
import { getHOTW } from "@/lib/hotw";
import { supabase } from "@/lib/supabase";
import type { Hero } from "@/lib/types";

interface Props {
  score: number;
  hero: Hero;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverModal({
  score,
  hero,
  onRestart,
  onMenu,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const isHotw = hero.name === getHOTW();

  async function submitScore() {
    setSubmitting(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("Harus login untuk submit skor!");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .single();

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
        7,
    );

    const { error: insertErr } = await supabase.from("leaderboard").insert({
      user_id: session.user.id,
      username: profile?.username ?? session.user.email?.split("@")[0],
      score,
      hero_name: hero.name,
      is_hotw: isHotw,
      week_num: weekNum,
      year_num: now.getFullYear(),
    });

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-xs text-center">
        <div className="text-5xl mb-2 font-black text-red-400">KO</div>
        <h2 className="text-2xl font-black text-white mb-1">GAME OVER</h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-600 bg-gray-800">
            <img
              src={hero.image}
              alt={hero.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-gray-400 text-sm">{hero.name}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <div className="text-xs text-gray-400 mb-1">Final Score</div>
          <div className="text-4xl font-black text-cyan-400">
            {score.toLocaleString()}
          </div>
          {isHotw && (
            <div className="text-xs text-yellow-400 mt-1">
              Termasuk bonus HOTW 1.5x
            </div>
          )}
        </div>

        {!submitted && (
          <>
            <button
              onClick={submitScore}
              disabled={submitting}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700
                text-gray-950 font-bold py-2.5 rounded-xl text-sm mb-2 transition"
            >
              {submitting ? "Menyimpan..." : "Submit ke Leaderboard"}
            </button>
            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          </>
        )}
        {submitted && (
          <div className="text-green-400 text-sm mb-4">
            Skor berhasil disimpan!
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onRestart}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm transition"
          >
            Main Lagi
          </button>
          <button
            onClick={onMenu}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm transition"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}
