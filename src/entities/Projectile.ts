import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Projectile {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  alive = true;

  private target: Enemy;
  private speed: number;
  private damage: number;
  private color: number;
  private splashRadius: number;
  private ignoresArmor: boolean;
  private allEnemies: Enemy[];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    speed: number,
    color: number,
    splashRadius = 0,
    allEnemies: Enemy[] = [],
    ignoresArmor = false,
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.splashRadius = splashRadius;
    this.allEnemies = allEnemies;
    this.ignoresArmor = ignoresArmor;
    this.graphics = scene.add.graphics().setDepth(5);
    this.draw();
  }

  update(delta: number) {
    if (!this.alive) return;

    const tx = this.target.x;
    const ty = this.target.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * (delta / 1000);

    if (dist <= step + 2) {
      this.onHit();
      return;
    }

    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.draw();
  }

  private onHit() {
    if (this.splashRadius > 0) {
      for (const e of this.allEnemies) {
        if (!e.alive) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) <= this.splashRadius) {
          e.takeDamage(this.damage, this.ignoresArmor);
        }
      }
      this.showExplosion();
    } else if (this.target.alive) {
      this.target.takeDamage(this.damage, this.ignoresArmor);
    }
    this.destroy();
  }

  private showExplosion() {
    const expl = this.scene.add.graphics().setDepth(6);
    expl.fillStyle(this.color, 0.45);
    expl.fillCircle(this.x, this.y, this.splashRadius);
    this.scene.tweens.add({
      targets: expl,
      alpha: 0,
      duration: 300,
      onComplete: () => expl.destroy(),
    });
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
