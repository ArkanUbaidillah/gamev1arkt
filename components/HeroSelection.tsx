"use client";

import { useRef, useState } from "react";
import { HEROES } from "@/lib/heroes";
import { getHOTW, HOTW_MULTIPLIER } from "@/lib/hotw";
import type { Hero } from "@/lib/types";

interface Props {
  onSelect: (hero: Hero) => void;
}

const STAT_COLORS = [
  "bg-gray-700",
  "bg-gray-600",
  "bg-cyan-800",
  "bg-cyan-600",
  "bg-cyan-400",
];

const ROLE_COLOR: Record<string, string> = {
  Fighter: "text-orange-400 border-orange-400",
  Mage: "text-purple-400 border-purple-400",
  Assassin: "text-red-400 border-red-400",
};

const HERO_BG: Record<string, string> = {
  cyan: "from-cyan-950 to-gray-900 border-cyan-600/50 shadow-cyan-500/20",
  purple:
    "from-purple-950 to-gray-900 border-purple-600/50 shadow-purple-500/20",
  pink: "from-pink-950 to-gray-900 border-pink-600/50 shadow-pink-500/20",
  orange:
    "from-orange-950 to-gray-900 border-orange-600/50 shadow-orange-500/20",
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-14">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-2 rounded-sm ${
              i < value ? STAT_COLORS[value - 1] : "bg-gray-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HeroSelection({ onSelect }: Props) {
  const [current, setCurrent] = useState(0);
  const startX = useRef(0);
  const hotw = getHOTW();
  const hero = HEROES[current];
  const isHotw = hero.name === hotw;

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) <= 50) return;

    setCurrent((previous) =>
      diff > 0
        ? Math.min(previous + 1, HEROES.length - 1)
        : Math.max(previous - 1, 0),
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 select-none">
      <h2 className="text-2xl font-bold text-white mb-1 tracking-wider uppercase">
        Pilih <span className="text-cyan-400">Hero</span>
      </h2>
      <p className="text-gray-500 text-xs mb-6">
        Hero of the Week:{" "}
        <span className="text-yellow-400 font-bold">{hotw}</span> bonus skor{" "}
        {HOTW_MULTIPLIER}x
      </p>

      <div
        className="w-full max-w-xs"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative bg-gradient-to-b ${HERO_BG[hero.color]} border rounded-2xl p-6 shadow-xl transition-all duration-300`}
        >
          {isHotw && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-950
              text-xs font-black px-3 py-1 rounded-full tracking-wider animate-pulse shadow-lg shadow-yellow-400/40"
            >
              HOTW BONUS {HOTW_MULTIPLIER}x
            </div>
          )}

          <div className="text-center mb-4">
            <div className="w-28 h-28 mx-auto mb-2 rounded-2xl overflow-hidden border-2 border-gray-700/50 bg-gray-800 shadow-lg flex items-center justify-center">
              <img
                src={hero.image}
                alt={hero.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <h3 className="text-2xl font-black text-white">{hero.name}</h3>
            <span
              className={`text-xs border px-2 py-0.5 rounded-full ${ROLE_COLOR[hero.role]}`}
            >
              {hero.role}
            </span>
          </div>

          <p className="text-gray-400 text-xs text-center mb-4">
            {hero.description}
          </p>

          <div className="space-y-1.5 mb-4">
            <StatBar label="HP" value={hero.hp} />
            <StatBar label="DMG" value={hero.damage} />
            <StatBar label="Speed" value={hero.speed} />
          </div>

          <div className="space-y-1">
            {hero.skills.map((skill, index) => (
              <div
                key={skill}
                className="flex items-center gap-2 text-xs text-gray-300"
              >
                <span
                  className="bg-gray-800 text-cyan-400 w-5 h-5 flex items-center justify-center
                  rounded font-bold flex-shrink-0"
                >
                  {["Q", "W", "E"][index]}
                </span>
                {skill}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {HEROES.map((item, index) => (
            <button
              key={item.name}
              aria-label={`Pilih ${item.name}`}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === current ? "bg-cyan-400 w-6" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrent((previous) => Math.max(previous - 1, 0))}
            disabled={current === 0}
            className="text-gray-400 disabled:opacity-20 text-2xl px-4"
          >
            {"<"}
          </button>
          <button
            onClick={() => onSelect(hero)}
            className="flex-1 mx-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-black
              py-3 rounded-xl text-sm uppercase tracking-widest transition shadow-lg shadow-cyan-500/30"
          >
            Pilih {hero.name}
          </button>
          <button
            onClick={() =>
              setCurrent((previous) =>
                Math.min(previous + 1, HEROES.length - 1),
              )
            }
            disabled={current === HEROES.length - 1}
            className="text-gray-400 disabled:opacity-20 text-2xl px-4"
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
}
