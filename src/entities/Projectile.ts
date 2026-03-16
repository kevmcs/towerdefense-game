import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Projectile {
  private graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  alive = true;

  readonly target: Enemy;
  private speed: number;
  private damage: number;
  private color: number;
  private ignoresArmor: boolean;
  private allEnemies: Enemy[];
  private homing: boolean;

  // Fixed direction for non-homing shots
  private vx = 0;
  private vy = 0;
  private traveled = 0;
  private maxRange = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    speed: number,
    color: number,
    allEnemies: Enemy[] = [],
    ignoresArmor = false,
    homing = true,
    aimX?: number,
    aimY?: number,
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.allEnemies = allEnemies;
    this.ignoresArmor = ignoresArmor;
    this.homing = homing;
    this.graphics = scene.add.graphics().setDepth(5);

    if (!homing) {
      // Use provided aim point (predictive intercept) or fall back to current enemy pos
      const ax = aimX ?? target.x;
      const ay = aimY ?? target.y;
      const dx = ax - x;
      const dy = ay - y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx = dx / dist;
      this.vy = dy / dist;
      this.maxRange = dist + 60;
    }

    this.draw();
  }

  update(delta: number) {
    if (!this.alive) return;
    const step = this.speed * (delta / 1000);

    if (this.homing) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= step + 2) { this.onHit(); return; }
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    } else {
      this.x += this.vx * step;
      this.y += this.vy * step;
      this.traveled += step;

      // Hit any enemy within radius, or expire
      for (const e of this.allEnemies) {
        if (!e.alive) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) <= e.radius + 5) {
          this.onHit();
          return;
        }
      }
      if (this.traveled >= this.maxRange) { this.destroy(); return; }
    }

    this.draw();
  }

  private onHit() {
    if (this.target.alive) {
      this.target.takeDamage(this.damage, this.ignoresArmor);
    }
    this.destroy();
  }

  private draw() {
    this.graphics.clear();
    this.graphics.fillStyle(this.color);
    this.graphics.fillCircle(this.x, this.y, 4);
  }

  destroy() {
    this.alive = false;
    this.graphics.destroy();
  }
}
