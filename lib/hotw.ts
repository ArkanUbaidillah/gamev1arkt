import type { HeroName } from "./types";

export function getHOTW(): HeroName {
  const heroNames: HeroName[] = ["Sora", "Zhuxin", "Cici", "Nolan"];
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7,
  );

  return heroNames[weekNum % heroNames.length];
}

export const HOTW_MULTIPLIER = 1.5;

export function calcFinalScore(rawScore: number, heroName: HeroName): number {
  return heroName === getHOTW()
    ? Math.floor(rawScore * HOTW_MULTIPLIER)
    : rawScore;
}
