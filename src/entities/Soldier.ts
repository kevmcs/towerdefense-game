import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Soldier {
  x: number;
  y: number;
  private postX: number;
  private postY: number;
  private atPost = false;
  private graphics: Phaser.GameObjects.Graphics;
  private attackCooldown = 0;
  readonly attackRange = 50;
  readonly attackRate = 1.2;
  damage: number;
  alive = true;

  constructor(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    postX: number,
    postY: number,
    damage: number,
  ) {
    this.x = startX;
    this.y = startY;
    this.postX = postX;
    this.postY = postY;
    this.damage = damage;
    this.graphics = scene.add.graphics().setDepth(3);
    this.draw(false);
  }

  update(delta: number, enemies: Enemy[]) {
    if (!this.alive) return;

    if (!this.atPost) {
      const dx = this.postX - this.x;
      const dy = this.postY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = 90 * (delta / 1000);
      if (dist <= step) {
        this.x = this.postX;
        this.y = this.postY;
        this.atPost = true;
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
      this.draw(false);
      return;
    }

    this.attackCooldown -= delta;
    let attacking = false;
    if (this.attackCooldown <= 0) {
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) <= this.attackRange) {
          e.takeDamage(this.damage, false); // physical — reduced by armor
          this.attackCooldown = 1000 / this.attackRate;
          attacking = true;
          break;
        }
      }
    }
    this.draw(attacking);
  }

  private draw(attacking: boolean) {
    this.graphics.clear();
    const color = attacking ? 0xffd700 : 0xe67e22;
    this.graphics.fillStyle(color);
    this.graphics.fillRect(this.x - 8, this.y - 8, 16, 16);
    this.graphics.lineStyle(1.5, 0x000000, 0.6);
    this.graphics.strokeRect(this.x - 8, this.y - 8, 16, 16);
  }

  destroy() {
    this.alive = false;
    this.graphics.destroy();
  }
}
