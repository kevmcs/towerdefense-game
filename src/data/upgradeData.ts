export interface UpgradeTier {
  cost: number;             // gold to reach this level (0 for level 1 base)
  damageMultiplier: number;
  rangeMultiplier: number;
  fireRateMultiplier: number;
  slowFactor?: number;      // ice tower: override effective slow factor
  label: string;            // short description shown in panel
}

// 3 entries per tower: index 0 = level 1 (base), index 1 = level 2, index 2 = level 3
export const UPGRADE_DATA: Record<string, UpgradeTier[]> = {
  archer: [
    { cost: 0,   damageMultiplier: 1.0, rangeMultiplier: 1.0,  fireRateMultiplier: 1.0, label: 'Base' },
    { cost: 65,  damageMultiplier: 1.5, rangeMultiplier: 1.15, fireRateMultiplier: 1.3, label: 'Dmg+  Range+  Rate+' },
    { cost: 110, damageMultiplier: 2.1, rangeMultiplier: 1.3,  fireRateMultiplier: 1.65, label: 'Rapid fire  Long range' },
  ],
  mage: [
    { cost: 0,   damageMultiplier: 1.0, rangeMultiplier: 1.0,  fireRateMultiplier: 1.0, label: 'Base' },
    { cost: 90,  damageMultiplier: 1.6, rangeMultiplier: 1.1,  fireRateMultiplier: 1.25, label: 'Dmg+  Splash+' },
    { cost: 155, damageMultiplier: 2.4, rangeMultiplier: 1.25, fireRateMultiplier: 1.5, label: 'Massive AoE  Ignores all' },
  ],
  slow: [
    { cost: 0,  damageMultiplier: 1.0, rangeMultiplier: 1.0,  fireRateMultiplier: 1.0, slowFactor: 0.45, label: 'Base' },
    { cost: 55, damageMultiplier: 1.0, rangeMultiplier: 1.2,  fireRateMultiplier: 1.0, slowFactor: 0.33, label: 'Range+  Slow+' },
    { cost: 95, damageMultiplier: 1.0, rangeMultiplier: 1.45, fireRateMultiplier: 1.0, slowFactor: 0.20, label: 'Crippling slow' },
  ],
  barracks: [
    { cost: 0,   damageMultiplier: 1.0, rangeMultiplier: 1.0, fireRateMultiplier: 1.0, label: 'Base' },
    { cost: 80,  damageMultiplier: 1.5, rangeMultiplier: 1.0, fireRateMultiplier: 1.35, label: 'Dmg+  Attack rate+' },
    { cost: 135, damageMultiplier: 2.1, rangeMultiplier: 1.0, fireRateMultiplier: 1.7, label: '3 soldiers  Heavy dmg' },
  ],
};
