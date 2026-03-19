import Phaser from 'phaser';
import type { TowerStats } from '../data/towerData';
import { UPGRADE_DATA } from '../data/upgradeData';
import { PATH_WAYPOINTS } from '../config';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { Bomb } from './Bomb';
import { Soldier } from './Soldier';
import type { TowerInfo } from '../ui/TowerInfoPanel';

export class Tower {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private rangeGraphics: Phaser.GameObjects.Graphics;
  private levelBadge: Phaser.GameObjects.Text | null = null;

  x: number;
  y: number;
  type: string;

  private stats: TowerStats;        // original base stats
  level = 1;
  totalSpent: number;               // base cost + upgrade costs (for sell calc)

  // Effective stats (updated on upgrade)
  private effectiveDamage: number;
  private effectiveRange: number;
  private effectiveFireRate: number;
  private effectiveSlowFactor: number;
  private effectiveSplashRadius: number;

  private fireCooldown = 0;
  private burstTimer = 0;
  private burstTarget: Enemy | null = null;
  private soldiers: Soldier[] = [];
  private isSelected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: string, stats: TowerStats) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.stats = stats;
    this.totalSpent = stats.cost;

    // Start at level 1 effective stats
    this.effectiveDamage      = stats.damage;
    this.effectiveRange       = stats.range;
    this.effectiveFireRate    = stats.fireRate;
    this.effectiveSlowFactor  = stats.slowFactor ?? 0.45;
    this.effectiveSplashRadius = stats.splashRadius;

    this.rangeGraphics = scene.add.graphics().setDepth(2);
    this.graphics      = scene.add.graphics().setDepth(3);
    this.draw();

    // Ice tower always shows range
    if (type === 'slow') this.drawRange(true);
    if (type === 'barracks') this.initSoldiers();
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update(delta: number, enemies: Enemy[], projectiles: Projectile[], bombs: Bomb[]) {
    // Mage burst: fire the queued second fireball
    if (this.burstTimer > 0) {
      this.burstTimer -= delta;
      if (this.burstTimer <= 0 && this.burstTarget?.alive) {
        projectiles.push(new Projectile(
          this.scene, this.x, this.y, this.burstTarget,
          this.effectiveDamage, this.stats.projectileSpeed, this.stats.projectileColor,
          enemies, this.stats.ignoresArmor ?? false, true,
        ));
        this.burstTarget = null;
      }
    }

    if (this.type === 'slow') {
      this.applySlowEffect(enemies);
    } else if (this.type === 'barracks') {
      for (const s of this.soldiers) s.update(delta, enemies);
    } else {
      this.updateShooter(delta, enemies, projectiles, bombs);
    }
  }

  private applySlowEffect(enemies: Enemy[]) {
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) <= this.effectiveRange) {
        e.applySlow(this.effectiveSlowFactor);
      }
    }
  }

  private updateShooter(delta: number, enemies: Enemy[], projectiles: Projectile[], bombs: Bomb[]) {
    this.fireCooldown -= delta;
    if (this.fireCooldown > 0) return;

    if (this.type === 'cannon') {
      const target = this.findTarget(enemies);
      if (!target) return;
      const landPos = this.computeIntercept(target, this.stats.projectileSpeed);
      bombs.push(new Bomb(
        this.scene, this.x, this.y, landPos.x, landPos.y,
        this.effectiveDamage, this.stats.projectileSpeed,
        this.effectiveSplashRadius, enemies, this.stats.projectileColor,
        this.stats.ignoresArmor ?? false,
      ));
    } else if (this.type === 'mage') {
      const closest = this.findTargets(enemies, 2);
      if (closest.length === 0) return;
      projectiles.push(new Projectile(
        this.scene, this.x, this.y, closest[0],
        this.effectiveDamage, this.stats.projectileSpeed, this.stats.projectileColor,
        enemies, this.stats.ignoresArmor ?? false, true,
      ));
      this.burstTarget = closest[1] ?? closest[0];
      this.burstTimer = 100;
    } else {
      const target = this.findTarget(enemies);
      if (!target) return;
      const homing = this.type !== 'archer' || this.level === 3;
      let aimX: number | undefined;
      let aimY: number | undefined;
      if (!homing) {
        const intercept = this.computeIntercept(target, this.stats.projectileSpeed);
        aimX = intercept.x;
        aimY = intercept.y;
      }
      projectiles.push(
        new Projectile(
          this.scene, this.x, this.y, target,
          this.effectiveDamage, this.stats.projectileSpeed, this.stats.projectileColor,
          enemies,
          this.stats.ignoresArmor ?? false,
          homing,
          aimX,
          aimY,
        ),
      );
    }

    this.fireCooldown = 1000 / this.effectiveFireRate;
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= this.effectiveRange && d < bestDist) { best = e; bestDist = d; }
    }
    return best;
  }

  private findTargets(enemies: Enemy[], count: number, exclude: Set<Enemy> = new Set()): Enemy[] {
    const inRange: { enemy: Enemy; dist: number }[] = [];
    for (const e of enemies) {
      if (!e.alive || exclude.has(e)) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= this.effectiveRange) inRange.push({ enemy: e, dist: d });
    }
    inRange.sort((a, b) => a.dist - b.dist);
    return inRange.slice(0, count).map(r => r.enemy);
  }

  // ── Upgrades & Sell ───────────────────────────────────────────────────────

  get canUpgrade(): boolean { return this.level < 3; }

  get upgradeCost(): number {
    if (!this.canUpgrade) return 0;
    return UPGRADE_DATA[this.type]?.[this.level]?.cost ?? 0;
  }

  get upgradeLabel(): string {
    if (!this.canUpgrade) return 'MAX';
    return UPGRADE_DATA[this.type]?.[this.level]?.label ?? '';
  }

  get sellValue(): number {
    return Math.floor(this.totalSpent * 0.6);
  }

  upgrade() {
    if (!this.canUpgrade) return;
    this.totalSpent += this.upgradeCost;
    this.level++;

    const tier = UPGRADE_DATA[this.type]?.[this.level - 1];
    if (!tier) return;

    this.effectiveDamage       = this.stats.damage      * tier.damageMultiplier;
    this.effectiveRange        = this.stats.range       * tier.rangeMultiplier;
    this.effectiveFireRate     = this.stats.fireRate    * tier.fireRateMultiplier;
    this.effectiveSplashRadius = this.stats.splashRadius * tier.rangeMultiplier;
    if (tier.slowFactor !== undefined) this.effectiveSlowFactor = tier.slowFactor;

    // Barracks L3: spawn a 3rd soldier
    if (this.type === 'barracks' && this.level === 3) {
      const post = this.closestPathPoint();
      this.soldiers.push(new Soldier(this.scene, this.x, this.y, post.x + 22, post.y - 10, this.effectiveDamage));
      // Update existing soldiers' damage
      for (const s of this.soldiers) s.damage = this.effectiveDamage;
    } else if (this.type === 'barracks') {
      for (const s of this.soldiers) s.damage = this.effectiveDamage;
    }

    this.draw();
    if (this.isSelected || this.type === 'slow') this.drawRange(true);
  }

  // ── Selection (range display) ─────────────────────────────────────────────

  setSelected(selected: boolean) {
    this.isSelected = selected;
    if (this.type === 'slow') return; // always shown for ice tower
    this.drawRange(selected);
  }

  // ── Info (for TowerInfoPanel) ─────────────────────────────────────────────

  getInfo(): TowerInfo {
    return {
      type: this.type,
      name: this.stats.name,
      level: this.level,
      effectiveDamage: this.effectiveDamage,
      effectiveRange: this.effectiveRange,
      effectiveFireRate: this.effectiveFireRate,
      effectiveSlowFactor: this.effectiveSlowFactor,
      upgradeCost: this.upgradeCost,
      upgradeLabel: this.upgradeLabel,
      sellValue: this.sellValue,
    };
  }

  // ── Soldiers ──────────────────────────────────────────────────────────────

  private initSoldiers() {
    const count = this.stats.soldierCount ?? 2;
    const post = this.closestPathPoint();
    for (let i = 0; i < count; i++) {
      const xOff = (i - (count - 1) / 2) * 22;
      this.soldiers.push(
        new Soldier(this.scene, this.x, this.y, post.x + xOff, post.y, this.effectiveDamage),
      );
    }
  }

  private closestPathPoint(): { x: number; y: number } {
    let best = { x: PATH_WAYPOINTS[0].x, y: PATH_WAYPOINTS[0].y };
    let bestDist = Infinity;
    for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
      const p = PATH_WAYPOINTS[i];
      const q = PATH_WAYPOINTS[i + 1];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((this.x - p.x) * dx + (this.y - p.y) * dy) / len2));
      const cx = p.x + t * dx;
      const cy = p.y + t * dy;
      const d = Math.sqrt((this.x - cx) ** 2 + (this.y - cy) ** 2);
      if (d < bestDist) { bestDist = d; best = { x: cx, y: cy }; }
    }
    return best;
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  drawRange(visible: boolean) {
    this.rangeGraphics.clear();
    if (visible) {
      const alpha = this.isSelected ? 0.45 : 0.2;
      this.rangeGraphics.lineStyle(this.isSelected ? 2 : 1, 0xffffff, alpha);
      this.rangeGraphics.strokeCircle(this.x, this.y, this.effectiveRange);
      // Fill tint when selected
      if (this.isSelected) {
        this.rangeGraphics.fillStyle(0xffffff, 0.04);
        this.rangeGraphics.fillCircle(this.x, this.y, this.effectiveRange);
      }
    }
  }

  private draw() {
    this.graphics.clear();
    this.graphics.fillStyle(this.stats.color);
    this.graphics.fillRect(this.x - 16, this.y - 16, 32, 32);
    this.graphics.lineStyle(2, 0x000000, 0.5);
    this.graphics.strokeRect(this.x - 16, this.y - 16, 32, 32);

    // Level indicator bar at bottom of tower square (1–3 pips)
    for (let i = 0; i < this.level; i++) {
      this.graphics.fillStyle(0xf1c40f);
      this.graphics.fillRect(this.x - 12 + i * 10, this.y + 10, 8, 4);
    }

    // Type icon
    this.graphics.fillStyle(0xffffff, 0.3);
    if (this.type === 'mage') {
      this.graphics.fillCircle(this.x, this.y, 7);
    } else if (this.type === 'slow') {
      this.graphics.fillTriangle(this.x, this.y - 8, this.x - 6, this.y, this.x, this.y + 8);
      this.graphics.fillTriangle(this.x, this.y - 8, this.x + 6, this.y, this.x, this.y + 8);
    } else if (this.type === 'barracks') {
      this.graphics.fillRect(this.x - 5, this.y - 5, 10, 10);
    } else if (this.type === 'cannon') {
      this.graphics.fillRect(this.x - 9, this.y - 4, 18, 8);
      this.graphics.fillCircle(this.x - 6, this.y, 5);
    } else {
      this.graphics.fillCircle(this.x, this.y, 4);
    }
  }

  /**
   * Iterative path-aware intercept: repeatedly refines the estimated intercept
   * time by tracing the enemy's actual waypoint path, so corners are accounted for.
   */
  private computeIntercept(target: Enemy, projSpeed: number): { x: number; y: number } {
    const dx0 = target.x - this.x;
    const dy0 = target.y - this.y;
    // Seed t with the direct-shot travel time
    let t = Math.sqrt(dx0 * dx0 + dy0 * dy0) / projSpeed;

    for (let i = 0; i < 8; i++) {
      const pos = target.getPositionAtTime(t);
      const dx  = pos.x - this.x;
      const dy  = pos.y - this.y;
      const tNew = Math.sqrt(dx * dx + dy * dy) / projSpeed;
      if (Math.abs(tNew - t) < 0.001) break;
      t = tNew;
    }

    return target.getPositionAtTime(t);
  }

  destroyTower() {
    this.graphics.destroy();
    this.rangeGraphics.destroy();
    for (const s of this.soldiers) s.destroy();
    this.levelBadge?.destroy();
  }
}
