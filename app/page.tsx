"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Leaderboard from "@/components/Leaderboard";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-400 text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 gap-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center">
        <div className="text-5xl mb-1 font-black text-cyan-400 tracking-widest">
          ARKTARENA
        </div>
        <h1 className="text-2xl font-black text-white tracking-widest">
          Pilih Hero. Bertahan. <span className="text-cyan-400">Kuasi.</span>
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Mobile Battle Arena
        </p>
      </div>

      {user ? (
        <>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Welcome back,</p>
            <p className="text-white font-bold">{user.email}</p>
          </div>

          <button
            onClick={() => router.push("/game")}
            className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black
              px-10 py-4 rounded-2xl text-lg uppercase tracking-widest transition
              shadow-2xl shadow-cyan-500/30 active:scale-95"
          >
            PLAY NOW
          </button>

          <Leaderboard />

          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-400 text-xs transition"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-400 text-sm text-center max-w-xs">
            Login untuk bermain dan simpan skor!
          </p>
          <button
            onClick={() => router.push("/auth")}
            className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black
              px-10 py-4 rounded-2xl text-lg uppercase tracking-widest transition
              shadow-2xl shadow-cyan-500/30 active:scale-95"
          >
            Login / Daftar
          </button>
          <Leaderboard />
        </>
      )}
    </div>
  );
}
