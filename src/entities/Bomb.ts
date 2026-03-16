import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Bomb {
  x: number;
  y: number;
  alive = true;

  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private targetX: number;
  private targetY: number;
  private speed: number;
  private damage: number;
  private splashRadius: number;
  private allEnemies: Enemy[];
  private color: number;
  private ignoresArmor: boolean;

  constructor(
    scene: Phaser.Scene,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    damage: number,
    speed: number,
    splashRadius: number,
    allEnemies: Enemy[],
    color: number,
    ignoresArmor = false,
  ) {
    this.scene    = scene;
    this.x        = fromX;
    this.y        = fromY;
    this.targetX  = targetX;
    this.targetY  = targetY;
    this.damage   = damage;
    this.speed    = speed;
    this.splashRadius = splashRadius;
    this.allEnemies   = allEnemies;
    this.color        = color;
    this.ignoresArmor = ignoresArmor;
    this.graphics = scene.add.graphics().setDepth(5);
    this.draw();
  }

  update(delta: number) {
    if (!this.alive) return;
    const step = this.speed * (delta / 1000);
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= step) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.explode();
      return;
    }

    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.draw();
  }

  private explode() {
    for (const e of this.allEnemies) {
      if (!e.alive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) <= this.splashRadius + e.radius) {
        e.takeDamage(this.damage, this.ignoresArmor);
      }
    }
    this.showExplosion();
    this.destroy();
  }

  private showExplosion() {
    const expl = this.scene.add.graphics().setDepth(6);
    expl.fillStyle(0xff6600, 0.7);
    expl.fillCircle(this.x, this.y, this.splashRadius * 0.4);
    expl.fillStyle(0xffaa00, 0.5);
    expl.fillCircle(this.x, this.y, this.splashRadius * 0.7);
    expl.fillStyle(this.color, 0.25);
    expl.fillCircle(this.x, this.y, this.splashRadius);

    this.scene.tweens.add({
      targets: expl,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => expl.destroy(),
    });
  }

  private draw() {
    this.graphics.clear();
    this.graphics.fillStyle(0x2c3e50);
    this.graphics.fillCircle(this.x, this.y, 7);
    this.graphics.lineStyle(2, 0x7f8c8d);
    this.graphics.strokeCircle(this.x, this.y, 7);
  }

  destroy() {
    this.alive = false;
    this.graphics.destroy();
  }
}
