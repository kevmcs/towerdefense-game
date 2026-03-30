import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { PATH_WAYPOINTS } from '../config';

type SoldierState = 'toPost' | 'atPost' | 'engaging' | 'fighting' | 'returning';

const WALK_SPEED   = 90;
const ENGAGE_SPEED = 110;
const MELEE_RANGE  = 20;
const ATTACK_RATE  = 1.2;   // attacks per second
const COUNTER_RATE = 1.0;   // enemy hits per second
const MAX_HP       = 100;

// ── Path-progress helpers ─────────────────────────────────────────────────────
// "progress" = total distance from path start to a point on the path.

function getPathPosition(progress: number): { x: number; y: number } {
  let remaining = progress;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const p = PATH_WAYPOINTS[i];
    const q = PATH_WAYPOINTS[i + 1];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (remaining <= segLen) {
      const t = remaining / segLen;
      return { x: p.x + dx * t, y: p.y + dy * t };
    }
    remaining -= segLen;
  }
  const last = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
  return { x: last.x, y: last.y };
}

function getProgressAtPoint(px: number, py: number): number {
  let totalDist = 0;
  let bestProgress = 0;
  let bestDistSq   = Infinity;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const p = PATH_WAYPOINTS[i];
    const q = PATH_WAYPOINTS[i + 1];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - p.x) * dx + (py - p.y) * dy) / len2)) : 0;
    const cx = p.x + dx * t;
    const cy = p.y + dy * t;
    const dSq = (px - cx) ** 2 + (py - cy) ** 2;
    const segProgress = totalDist + t * Math.sqrt(len2);
    if (dSq < bestDistSq) { bestDistSq = dSq; bestProgress = segProgress; }
    totalDist += Math.sqrt(len2);
  }
  return bestProgress;
}

// ── Soldier ───────────────────────────────────────────────────────────────────

export class Soldier {
  x: number;
  y: number;
  private scene: Phaser.Scene;
  private readonly towerX: number;
  private readonly towerY: number;
  towerRange: number;

  // home = closest point on path to the barracks tower (rest position)
  private readonly homeProgress: number;
  private readonly homeX: number;
  private readonly homeY: number;
  // current path-progress when following the path
  private pathProgress: number;

  private graphics: Phaser.GameObjects.Graphics;

  hp      = MAX_HP;
  readonly maxHp = MAX_HP;
  damage: number;
  alive   = true;

  private state: SoldierState        = 'toPost';
  private target: Enemy | null       = null;
  private attackCooldown             = 0;
  private counterCooldown            = 1000 / COUNTER_RATE;
  private readonly onDeath: () => void;

  constructor(
    scene: Phaser.Scene,
    towerX: number,
    towerY: number,
    towerRange: number,
    sideOffset: number,   // perpendicular offset so siblings don't overlap at rest
    damage: number,
    onDeath: () => void,
  ) {
    this.scene      = scene;
    this.towerX     = towerX;
    this.towerY     = towerY;
    this.towerRange = towerRange;
    this.damage     = damage;
    this.onDeath    = onDeath;

    this.x = towerX;
    this.y = towerY;

    // Find closest point on path to the tower
    this.homeProgress = getProgressAtPoint(towerX, towerY);
    const homePos     = getPathPosition(this.homeProgress);

    // Compute perpendicular to path direction at home — used for side-by-side offset
    const aheadPos = getPathPosition(this.homeProgress + 8);
    const dirX = aheadPos.x - homePos.x;
    const dirY = aheadPos.y - homePos.y;
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    this.homeX = homePos.x + (-dirY / dirLen) * sideOffset;
    this.homeY = homePos.y + ( dirX / dirLen) * sideOffset;

    this.pathProgress = this.homeProgress;
    this.graphics = scene.add.graphics().setDepth(3);
    this.draw();
  }

  update(delta: number, enemies: Enemy[]) {
    if (!this.alive) return;

    switch (this.state) {
      case 'toPost':    this.updateToPost(delta);    break;
      case 'atPost':    this.updateAtPost(enemies);  break;
      case 'engaging':  this.updateEngaging(delta);  break;
      case 'fighting':  this.updateFighting(delta);  break;
      case 'returning': this.updateReturning(delta); break;
    }

    this.draw();
  }

  // ── States ────────────────────────────────────────────────────────────────────

  private updateToPost(delta: number) {
    const dx   = this.homeX - this.x;
    const dy   = this.homeY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = WALK_SPEED * (delta / 1000);
    if (dist <= step) {
      this.x = this.homeX;
      this.y = this.homeY;
      this.pathProgress = this.homeProgress;
      this.state = 'atPost';
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  // Tower calls this to assign a specific enemy target to an idle soldier.
  assignTarget(e: Enemy) {
    this.target       = e;
    this.pathProgress = this.homeProgress;
    this.state        = 'engaging';
  }

  get isAtPost(): boolean { return this.state === 'atPost'; }
  get currentTarget(): Enemy | null { return this.target; }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private updateAtPost(_enemies: Enemy[]) {
    // Target assignment is handled by Tower to distribute enemies across siblings.
  }

  private updateEngaging(delta: number) {
    if (!this.target || !this.target.alive) {
      this.clearTarget();
      this.state = 'returning';
      return;
    }

    // Return if soldier wandered beyond tower range
    const dtx = this.x - this.towerX;
    const dty = this.y - this.towerY;
    if (Math.sqrt(dtx * dtx + dty * dty) > this.towerRange + 10) {
      this.clearTarget();
      this.pathProgress = getProgressAtPoint(this.x, this.y);
      this.state = 'returning';
      return;
    }

    // Enter melee range → fight
    const dx   = this.target.x - this.x;
    const dy   = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= MELEE_RANGE) {
      this.target.blockers++;
      this.attackCooldown  = 1000 / ATTACK_RATE;
      this.counterCooldown = 1000 / COUNTER_RATE;
      this.state = 'fighting';
      return;
    }

    // Walk along path toward enemy (path-progress based)
    const enemyProgress = getProgressAtPoint(this.target.x, this.target.y);
    const step = ENGAGE_SPEED * (delta / 1000);
    if (enemyProgress > this.pathProgress) {
      this.pathProgress = Math.min(this.pathProgress + step, enemyProgress);
    } else {
      this.pathProgress = Math.max(this.pathProgress - step, enemyProgress);
    }
    const pos = getPathPosition(this.pathProgress);
    this.x = pos.x;
    this.y = pos.y;
  }

  private updateFighting(delta: number) {
    if (!this.target || !this.target.alive) {
      this.clearTarget();
      this.pathProgress = getProgressAtPoint(this.x, this.y);
      this.state = 'returning';
      return;
    }

    // Re-engage if target drifted out of melee range
    const dx   = this.target.x - this.x;
    const dy   = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MELEE_RANGE + 10) {
      this.target.blockers = Math.max(0, this.target.blockers - 1);
      this.pathProgress    = getProgressAtPoint(this.x, this.y);
      this.state = 'engaging';
      return;
    }

    // Soldier attacks enemy
    this.attackCooldown -= delta;
    if (this.attackCooldown <= 0) {
      this.target.takeDamage(this.damage, false);
      this.attackCooldown = 1000 / ATTACK_RATE;
    }

    // Enemy counterattacks soldier
    this.counterCooldown -= delta;
    if (this.counterCooldown <= 0) {
      this.takeDamage(this.target.meleeDamage);
      this.counterCooldown = 1000 / COUNTER_RATE;
    }
  }

  private updateReturning(delta: number) {
    if (Math.abs(this.pathProgress - this.homeProgress) < 3) {
      this.x = this.homeX;
      this.y = this.homeY;
      this.pathProgress = this.homeProgress;
      this.state = 'atPost';
      return;
    }
    const step = WALK_SPEED * (delta / 1000);
    if (this.pathProgress > this.homeProgress) {
      this.pathProgress = Math.max(this.pathProgress - step, this.homeProgress);
    } else {
      this.pathProgress = Math.min(this.pathProgress + step, this.homeProgress);
    }
    const pos = getPathPosition(this.pathProgress);
    this.x = pos.x;
    this.y = pos.y;
  }

  // ── Damage / Death ────────────────────────────────────────────────────────────

  takeDamage(amount: number) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) this.die();
  }

  private die() {
    this.alive = false;
    this.clearTarget();
    this.spawnDeathEffect();
    this.graphics.destroy();
    this.onDeath();
  }

  private clearTarget() {
    if (this.target) {
      this.target.blockers = Math.max(0, this.target.blockers - 1);
      this.target = null;
    }
  }

  private spawnDeathEffect() {
    const g = this.scene.add.graphics().setDepth(7);
    g.fillStyle(0xe67e22, 0.8);
    g.fillCircle(this.x, this.y, 12);
    this.scene.tweens.add({
      targets: g, alpha: 0, scaleX: 1.8, scaleY: 1.8,
      duration: 300, ease: 'Power2',
      onComplete: () => g.destroy(),
    });
  }

  // ── Drawing ───────────────────────────────────────────────────────────────────

  private draw() {
    this.graphics.clear();

    // HP bar
    const barW = 20;
    const bx   = this.x - barW / 2;
    const by   = this.y - 16;
    this.graphics.fillStyle(0x2c2c2c);
    this.graphics.fillRect(bx, by, barW, 3);
    const pct     = this.hp / this.maxHp;
    const hpColor = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.graphics.fillStyle(hpColor);
    this.graphics.fillRect(bx, by, barW * pct, 3);

    // Body
    const bodyColor = this.state === 'fighting'  ? 0xffd700
                    : this.state === 'engaging'   ? 0xf0a030
                    : 0xe67e22;
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillRect(this.x - 8, this.y - 8, 16, 16);
    this.graphics.lineStyle(1.5, 0x000000, 0.6);
    this.graphics.strokeRect(this.x - 8, this.y - 8, 16, 16);

    // Sword — always visible; points at target when engaging/fighting, else held upward
    {
      let nx: number, ny: number;
      if ((this.state === 'fighting' || this.state === 'engaging') && this.target) {
        const dx   = this.target.x - this.x;
        const dy   = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        nx = dx / dist;
        ny = dy / dist;
      } else {
        // Resting pose: sword held diagonally up-right
        nx =  0.7;
        ny = -0.7;
      }

      const fighting = this.state === 'fighting';

      // Blade
      this.graphics.lineStyle(3, fighting ? 0xffffff : 0xe0e0e0, fighting ? 1.0 : 0.85);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x + nx * 6,        this.y + ny * 6);
      this.graphics.lineTo(this.x + nx * (6 + 16), this.y + ny * (6 + 16));
      this.graphics.strokePath();

      // Crossguard
      const px = -ny;
      const py =  nx;
      this.graphics.lineStyle(2.5, 0xaaaaaa, fighting ? 1.0 : 0.8);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x + nx * 9 - px * 6, this.y + ny * 9 - py * 6);
      this.graphics.lineTo(this.x + nx * 9 + px * 6, this.y + ny * 9 + py * 6);
      this.graphics.strokePath();
    }
  }

  destroy() {
    this.alive = false;
    this.clearTarget();
    this.graphics.destroy();
  }
}
