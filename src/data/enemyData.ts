export interface EnemyStats {
  hp: number;
  speed: number;
  reward: number;
  color: number;
  radius: number;
  armor: number;       // 0–1: fraction of physical damage absorbed
  isBoss?: boolean;
}

export const ENEMY_STATS: Record<string, EnemyStats> = {
  goblin:   { hp: 60,   speed: 130, reward: 10,  color: 0xe74c3c, radius: 12, armor: 0 },
  orc:      { hp: 160,  speed: 75,  reward: 20,  color: 0x8e44ad, radius: 15, armor: 0 },
  troll:    { hp: 350,  speed: 45,  reward: 40,  color: 0x1a5276, radius: 18, armor: 0 },
  sprinter: { hp: 40,   speed: 200, reward: 8,   color: 0xf39c12, radius: 9,  armor: 0 },
  armored:  { hp: 280,  speed: 60,  reward: 35,  color: 0x7f8c8d, radius: 17, armor: 0.55 },
  boss:     { hp: 1000, speed: 32,  reward: 150, color: 0x922b21, radius: 28, armor: 0.2, isBoss: true },
};
