export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 600;
export const PATH_WIDTH = 48;

export interface MapDef {
  name: string;
  waypoints: { x: number; y: number }[];
  spots: { x: number; y: number }[];
}

// ── Map 1 — "Winding Path" ────────────────────────────────────────────────
const MAP1: MapDef = {
  name: 'Winding Path',
  waypoints: [
    { x: 0,   y: 120 },
    { x: 240, y: 120 },
    { x: 240, y: 380 },
    { x: 560, y: 380 },
    { x: 560, y: 180 },
    { x: 960, y: 180 },
  ],
  spots: [
    { x: 120, y: 240 },
    { x: 120, y: 460 },
    { x: 340, y: 240 },
    { x: 340, y: 460 },
    { x: 460, y: 460 },
    { x: 660, y: 290 },
    { x: 760, y: 290 },
    { x: 660, y: 80  },
    { x: 760, y: 80  },
  ],
};

// ── Map 2 — "Zigzag" ──────────────────────────────────────────────────────
// Path makes 3 sweeps: right along top (y=80), left across bottom (y=520),
// then exits right through the middle (y=280).
// Tower spots sit in the 200px band between the top and middle runs,
// and the 120px band between the middle and bottom runs — covering 2 segments each.
const MAP2: MapDef = {
  name: 'Zigzag',
  waypoints: [
    { x: 0,   y: 80  },   // entry top-left
    { x: 720, y: 80  },   // sweep right across top
    { x: 720, y: 520 },   // drop down right side
    { x: 240, y: 520 },   // sweep left across bottom
    { x: 240, y: 280 },   // rise up left side
    { x: 960, y: 280 },   // exit right through middle
  ],
  spots: [
    // Between top run (y=80) and middle exit (y=280) — covers both simultaneously
    { x: 120, y: 200 },   // left flank, double-coverage of top + middle
    { x: 360, y: 200 },   // center-left, same double-coverage
    { x: 480, y: 180 },   // center, equidistant from top + middle
    { x: 600, y: 180 },   // center-right, same
    { x: 840, y: 180 },   // right of center — middle exit + near right bend
    // Right side and bottom
    { x: 840, y: 400 },   // flanks right vertical, tri-coverage
    { x: 620, y: 420 },   // near right bend + bottom run
    // Bottom-to-middle convergence zone
    { x: 480, y: 400 },   // between bottom run and middle exit
    { x: 360, y: 400 },   // near left vertical — highest value spot
    { x: 120, y: 400 },   // flanks left vertical from west
    { x: 100, y: 550 },   // bottom-left, covers end of bottom sweep
  ],
};

// ── Map 3 — "Spiral" ─────────────────────────────────────────────────────
// Path traces the outer perimeter clockwise then cuts through the center.
// The left edge (x=160) is used twice (going up on outer loop, rising on inner),
// making flank towers there punish enemies twice.
const MAP3: MapDef = {
  name: 'Spiral',
  waypoints: [
    { x: 0,   y: 300 },   // entry center-left
    { x: 160, y: 300 },   // step right
    { x: 160, y: 80  },   // rise to top-left
    { x: 800, y: 80  },   // sweep right across top
    { x: 800, y: 520 },   // drop down right side
    { x: 160, y: 520 },   // sweep left across bottom
    { x: 160, y: 420 },   // rise slightly — inner return
    { x: 560, y: 420 },   // cut right through lower-center
    { x: 560, y: 180 },   // rise through center
    { x: 960, y: 180 },   // exit right
  ],
  spots: [
    // Top sweep coverage
    { x: 300, y: 180 },   // 100px below top run, covers long top sweep
    { x: 500, y: 180 },   // near S78/S89 junction — highest value inner spot
    // Inner junction and right side
    { x: 680, y: 300 },   // flanks inner vertical S78, covers S89 exit
    { x: 880, y: 300 },   // flanks right vertical S34, covers S89
    { x: 880, y: 420 },   // covers lower S34 and bottom-right corner
    // Inner center — covers the inner cut-through corridors
    { x: 440, y: 300 },   // central pivot, covers S67 + S78 junction
    { x: 320, y: 320 },   // left of center, covers S67
    // Left edge — punishes the path that passes x=160 twice
    { x: 80,  y: 180 },   // west flank of S12 (outer left rise)
    { x: 80,  y: 420 },   // west flank of S12 lower + S56 (inner left)
    // Bottom sweep
    { x: 300, y: 560 },   // below bottom run, center-left
    { x: 560, y: 560 },   // below bottom run, near inner-cut bend
    { x: 700, y: 560 },   // bottom-right, covers S45 + lower S34
  ],
};

export const MAPS: MapDef[] = [MAP1, MAP2, MAP3];

// These are set dynamically by GameScene — imported by Enemy.ts
export let PATH_WAYPOINTS: { x: number; y: number }[] = MAP1.waypoints;
export let TOWER_SPOTS: { x: number; y: number }[]    = MAP1.spots;

export function setActiveMap(index: number) {
  const map = MAPS[index] ?? MAP1;
  PATH_WAYPOINTS = map.waypoints;
  TOWER_SPOTS    = map.spots;
}
