export type HeroName = "Sora" | "Zhuxin" | "Cici" | "Nolan";

export interface Hero {
  name: HeroName;
  role: "Fighter" | "Mage" | "Assassin";
  description: string;
  skills: string[];
  hp: number;
  damage: number;
  speed: number;
  color: string;
  emoji: string;
  image: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  hero_name: HeroName;
  is_hotw: boolean;
  created_at: string;
  rank?: number;
}

export interface GameState {
  hero: Hero | null;
  score: number;
  isHotw: boolean;
  userId: string | null;
}
