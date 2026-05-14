"use client";

import { useEffect, useRef } from "react";
import type { Hero } from "@/lib/types";

interface Props {
  hero: Hero;
  onGameOver: (score: number) => void;
}

export default function PhaserGame({ hero, onGameOver }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    async function init() {
      const Phaser = (await import("phaser")).default;
      const { GameScene } = await import("./scenes/GameScene");
      const { UIScene } = await import("./scenes/UIScene");

      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current!,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#0d0d1a",
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [new GameScene(hero, onGameOver), new UIScene()],
      });

      gameRef.current = game;
    }

    init();

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [hero, onGameOver]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}
