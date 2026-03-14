export interface SpawnEntry {
  type: string;
  delay: number; // ms after previous spawn
}

export interface WaveDef {
  spawns: SpawnEntry[];
  reward: number;
  hasBoss?: boolean;
}

export const WAVES: WaveDef[] = [
  // Wave 1 — intro goblins
  {
    spawns: [
      { type: 'goblin', delay: 0 },
      { type: 'goblin', delay: 1200 },
      { type: 'goblin', delay: 1200 },
      { type: 'goblin', delay: 1200 },
    ],
    reward: 30,
  },
  // Wave 2 — goblins + orcs
  {
    spawns: [
      { type: 'goblin', delay: 0 },
      { type: 'goblin', delay: 900 },
      { type: 'orc',    delay: 1500 },
      { type: 'goblin', delay: 800 },
      { type: 'orc',    delay: 1500 },
    ],
    reward: 40,
  },
  // Wave 3 — sprinter rush
  {
    spawns: [
      { type: 'sprinter', delay: 0 },
      { type: 'sprinter', delay: 500 },
      { type: 'sprinter', delay: 500 },
      { type: 'orc',      delay: 1200 },
      { type: 'sprinter', delay: 600 },
      { type: 'sprinter', delay: 500 },
    ],
    reward: 45,
  },
  // Wave 4 — orcs + trolls intro
  {
    spawns: [
      { type: 'orc',   delay: 0 },
      { type: 'orc',   delay: 1100 },
      { type: 'troll', delay: 2000 },
      { type: 'orc',   delay: 1100 },
    ],
    reward: 55,
  },
  // Wave 5 — armored introduction
  {
    spawns: [
      { type: 'goblin',  delay: 0 },
      { type: 'goblin',  delay: 800 },
      { type: 'armored', delay: 1800 },
      { type: 'orc',     delay: 1200 },
      { type: 'armored', delay: 2000 },
    ],
    reward: 65,
  },
  // Wave 6 — sprinter + armored mix
  {
    spawns: [
      { type: 'sprinter', delay: 0 },
      { type: 'sprinter', delay: 450 },
      { type: 'armored',  delay: 1500 },
      { type: 'sprinter', delay: 450 },
      { type: 'orc',      delay: 1000 },
      { type: 'armored',  delay: 1800 },
      { type: 'sprinter', delay: 500 },
    ],
    reward: 75,
  },
  // Wave 7 — BOSS + goblins
  {
    spawns: [
      { type: 'goblin', delay: 0 },
      { type: 'goblin', delay: 800 },
      { type: 'goblin', delay: 800 },
      { type: 'boss',   delay: 2500 },
      { type: 'goblin', delay: 1000 },
      { type: 'goblin', delay: 800 },
    ],
    reward: 100,
    hasBoss: true,
  },
  // Wave 8 — armored + troll push
  {
    spawns: [
      { type: 'armored', delay: 0 },
      { type: 'orc',     delay: 1000 },
      { type: 'armored', delay: 1500 },
      { type: 'troll',   delay: 2000 },
      { type: 'armored', delay: 1500 },
      { type: 'orc',     delay: 1000 },
    ],
    reward: 90,
  },
  // Wave 9 — chaos: everything
  {
    spawns: [
      { type: 'sprinter', delay: 0 },
      { type: 'sprinter', delay: 450 },
      { type: 'orc',      delay: 900 },
      { type: 'armored',  delay: 1200 },
      { type: 'sprinter', delay: 400 },
      { type: 'troll',    delay: 1800 },
      { type: 'armored',  delay: 1200 },
      { type: 'sprinter', delay: 400 },
      { type: 'orc',      delay: 900 },
    ],
    reward: 110,
  },
  // Wave 10 — FINAL BOSS
  {
    spawns: [
      { type: 'armored',  delay: 0 },
      { type: 'orc',      delay: 1000 },
      { type: 'armored',  delay: 1200 },
      { type: 'boss',     delay: 2500 },
      { type: 'sprinter', delay: 600 },
      { type: 'sprinter', delay: 400 },
      { type: 'armored',  delay: 1500 },
      { type: 'orc',      delay: 1000 },
      { type: 'boss',     delay: 3000 },
    ],
    reward: 200,
    hasBoss: true,
  },
];
