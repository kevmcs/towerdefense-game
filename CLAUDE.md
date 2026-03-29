# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:5173
npm run build      # Type-check + build to dist/
npm run preview    # Preview production build locally
```

No test framework is configured. No lint script is configured.

## Architecture

**Stack**: Phaser 3 (game framework), TypeScript, Vite. No React.

**Entry**: `index.html` → `src/main.ts` (Phaser.Game config, 960×600, 4 scenes)

### Scene flow
```
BootScene → MapSelectScene → GameScene → GameOverScene
```
- `BootScene`: Immediately transitions, no asset loading.
- `MapSelectScene`: Renders 3 map previews; calls `setActiveMap()` then starts `GameScene`.
- `GameScene`: Main loop. State machine: `idle → wave → between → gameover/victory`.
- `GameOverScene`: Victory or defeat screen.

### Source layout
- `src/config.ts` — 3 map definitions (waypoints + tower spot positions). `setActiveMap()` sets the active map globally.
- `src/data/` — Static game data: tower stats, enemy stats, upgrade tiers, wave definitions.
- `src/entities/` — Phaser `GameObject` subclasses: `Tower`, `Enemy`, `Projectile`, `Bomb`, `Soldier`.
- `src/managers/` — `EconomyManager` (gold/lives) and `WaveManager` (spawn queue/timing).
- `src/scenes/` — All Phaser scenes.
- `src/ui/` — HUD and panel classes (`TowerSelectionPanel`, `TowerInfoPanel`, `EnemyInfoPanel`).

### Key mechanics
- **Towers** (5 types, 3 upgrade tiers): Archer, Mage (burst + AoE splash), Ice (slows, no damage), Barracks (spawns melee Soldiers), Cannon (ballistic AoE bomb).
- **Enemies** (6 types): Goblin, Orc, Troll, Sprinter, Armored (55% damage reduction), Boss.
- **Economy**: Start 150g / 20 lives. Enemies reward gold on kill. Wave clear gives bonus gold. Sell towers for ~60% refund.
- **Waves**: Defined in `src/data/waves.ts`. 8+ waves; victory when all waves cleared and no enemies remain.
- **Targeting**: Towers find nearest enemy in range each frame. Ice tower pulses slow to all in range instead of firing.

### TypeScript strictness
`tsconfig.json` has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. The build (`npm run build`) runs `tsc` before Vite — type errors will fail the build.
