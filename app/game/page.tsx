"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GameOverModal from "@/components/GameOverModal";
import HeroSelection from "@/components/HeroSelection";
import { supabase } from "@/lib/supabase";
import type { Hero } from "@/lib/types";

const PhaserGame = dynamic(() => import("@/game/PhaserGame"), { ssr: false });

type Stage = "hero-select" | "playing" | "game-over";

export default function GamePage() {
  const router = useRouter();
  const isGuest = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("guest") === "1";
  }, []);
  const [stage, setStage] = useState<Stage>("hero-select");
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/auth");
      else setAuthChecked(true);
    });
  }, [router, isGuest]);

  function handleHeroSelect(hero: Hero) {
    setSelectedHero(hero);
    setStage("playing");
  }

  function handleGameOver(score: number) {
    setFinalScore(score);
    setStage("game-over");
  }

  return (
    <div
      className="w-screen h-screen bg-gray-950 overflow-hidden relative"
      style={{ touchAction: "none" }}
    >
      {stage === "hero-select" && <HeroSelection onSelect={handleHeroSelect} />}

      {stage === "playing" && selectedHero && (
        <PhaserGame hero={selectedHero} onGameOver={handleGameOver} />
      )}

      {stage === "game-over" && selectedHero && (
        <>
          <div className="absolute inset-0 bg-gray-950" />
          <GameOverModal
            score={finalScore}
            hero={selectedHero}
            onRestart={() => {
              setStage("hero-select");
              setSelectedHero(null);
            }}
            onMenu={() => router.push("/")}
          />
        </>
      )}
    </div>
  );
}
