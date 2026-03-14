export interface TowerStats {
  name: string;
  description: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  color: number;
  projectileColor: number;
  projectileSpeed: number;
  splashRadius: number;
  ignoresArmor?: boolean;  // mage: true — magic damage bypasses armor
  slowFactor?: number;
  soldierCount?: number;
}

export const TOWER_DATA: Record<string, TowerStats> = {
  archer: {
    name: 'Archer',
    description: 'Fast, long range',
    cost: 50,
    range: 195,
    damage: 20,
    fireRate: 1.5,
    color: 0x3498db,
    projectileColor: 0xf1c40f,
    projectileSpeed: 280,
    splashRadius: 0,
    ignoresArmor: false,
  },
  mage: {
    name: 'Mage',
    description: 'AoE, ignores armor',
    cost: 100,
    range: 150,
    damage: 45,
    fireRate: 0.6,
    color: 0x9b59b6,
    projectileColor: 0xe74c3c,
    projectileSpeed: 200,
    splashRadius: 55,
    ignoresArmor: true,
  },
  slow: {
    name: 'Ice Tower',
    description: 'Slows enemies',
    cost: 75,
    range: 165,
    damage: 0,
    fireRate: 0,
    color: 0x1abc9c,
    projectileColor: 0x1abc9c,
    projectileSpeed: 0,
    splashRadius: 0,
    slowFactor: 0.45,
  },
  barracks: {
    name: 'Barracks',
    description: 'Spawns soldiers',
    cost: 125,
    range: 0,
    damage: 18,
    fireRate: 0,
    color: 0xe67e22,
    projectileColor: 0xe67e22,
    projectileSpeed: 0,
    splashRadius: 0,
    soldierCount: 2,
    ignoresArmor: false,
  },
};
