import Phaser from 'phaser';
import { Enemy } from './Enemy';

type SoldierState = 'toPost' | 'atPost' | 'engaging' | 'fighting';

const WALK_SPEED       = 90;   // px/s walking to post
const ENGAGE_SPEED     = 110;  // px/s chasing enemy
const ENGAGEMENT_RANGE = 120;  // px — start chasing enemy within this distance
const MELEE_RANGE      = 20;   // px — stop and fight
const ATTACK_RATE      = 1.2;  // attacks per second
const COUNTER_RATE     = 1.0;  // enemy counterattacks per second
const MAX_HP           = 100;

export class Soldier {
  x: number;
  y: number;
  private scene: Phaser.Scene;
  private postX: number;
  private postY: number;
  private graphics: Phaser.GameObjects.Graphics;

  hp = MAX_HP;
  readonly maxHp = MAX_HP;
  damage: number;
  alive = true;

  private state: SoldierState = 'toPost';
  private target: Enemy | null = null;
  private attackCooldown = 0;
  private counterCooldown = 1000 / COUNTER_RATE;
  private readonly onDeath: () => void;

  constructor(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    postX: number,
    postY: number,
    damage: number,
    onDeath: () => void,
  ) {
    this.scene   = scene;
    this.x       = startX;
    this.y       = startY;
    this.postX   = postX;
    this.postY   = postY;
    this.damage  = damage;
    this.onDeath = onDeath;
    this.graphics = scene.add.graphics().setDepth(3);
    this.draw();
  }

  update(delta: number, enemies: Enemy[]) {
    if (!this.alive) return;

    switch (this.state) {
      case 'toPost':    this.updateToPost(delta);        break;
      case 'atPost':    this.updateAtPost(enemies);      break;
      case 'engaging':  this.updateEngaging(delta);      break;
      case 'fighting':  this.updateFighting(delta);      break;
    }

    this.draw();
  }

  // ── States ──────────────────────────────────────────────────────────────────

  private updateToPost(delta: number) {
    const dx   = this.postX - this.x;
    const dy   = this.postY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = WALK_SPEED * (delta / 1000);
    if (dist <= step) {
      this.x = this.postX;
      this.y = this.postY;
      this.state = 'atPost';
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  private updateAtPost(enemies: Enemy[]) {
    let nearest: Enemy | null = null;
    let nearestDist = ENGAGEMENT_RANGE;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < nearestDist) { nearest = e; nearestDist = d; }
    }
    if (nearest) {
      this.target = nearest;
      this.state  = 'engaging';
    }
  }

  private updateEngaging(delta: number) {
    if (!this.target || !this.target.alive) {
      this.clearTarget();
      this.state = 'toPost';
      return;
    }

    const dx   = this.target.x - this.x;
    const dy   = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= MELEE_RANGE) {
      this.target.blockers++;
      this.attackCooldown  = 1000 / ATTACK_RATE;
      this.counterCooldown = 1000 / COUNTER_RATE;
      this.state = 'fighting';
    } else {
      const step = ENGAGE_SPEED * (delta / 1000);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  private updateFighting(delta: number) {
    if (!this.target || !this.target.alive) {
      this.clearTarget();
      this.state = 'toPost';
      return;
    }

    // Re-engage if target somehow drifted out of melee range
    const dx   = this.target.x - this.x;
    const dy   = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MELEE_RANGE + 10) {
      this.target.blockers = Math.max(0, this.target.blockers - 1);
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

  // ── Damage / Death ───────────────────────────────────────────────────────────

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
    const pct = this.hp / this.maxHp;
    const hpColor = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.graphics.fillStyle(hpColor);
    this.graphics.fillRect(bx, by, barW * pct, 3);

    // Body
    const bodyColor = this.state === 'fighting' ? 0xffd700
                    : this.state === 'engaging'  ? 0xf0a030
                    : 0xe67e22;
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillRect(this.x - 8, this.y - 8, 16, 16);
    this.graphics.lineStyle(1.5, 0x000000, 0.6);
    this.graphics.strokeRect(this.x - 8, this.y - 8, 16, 16);

    // Sword when fighting
    if (this.state === 'fighting' && this.target) {
      const dx   = this.target.x - this.x;
      const dy   = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx   = dx / dist;
      const ny   = dy / dist;

      // Blade — from soldier edge toward enemy
      this.graphics.lineStyle(3, 0xffffff, 0.9);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x + nx * 8,        this.y + ny * 8);
      this.graphics.lineTo(this.x + nx * (8 + 13), this.y + ny * (8 + 13));
      this.graphics.strokePath();

      // Crossguard — perpendicular to blade
      const px = -ny;
      const py =  nx;
      this.graphics.lineStyle(2, 0xcccccc, 0.85);
      this.graphics.beginPath();
      this.graphics.moveTo(this.x + nx * 11 - px * 5, this.y + ny * 11 - py * 5);
      this.graphics.lineTo(this.x + nx * 11 + px * 5, this.y + ny * 11 + py * 5);
      this.graphics.strokePath();
    }
  }

  destroy() {
    this.alive = false;
    this.clearTarget();
    this.graphics.destroy();
  }
}
