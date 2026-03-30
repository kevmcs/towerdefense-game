import Phaser from 'phaser';
import { Tower } from './Tower';

const SPEED       = 160; // px/s
const STUN_MS     = 2500;
const FIREBALL_RANGE = 220; // px — boss only shoots towers within this distance

export { FIREBALL_RANGE };

export class BossFireball {
  x: number;
  y: number;
  alive = true;

  private targetX: number;
  private targetY: number;
  private tower: Tower;
  private graphics: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, fromX: number, fromY: number, tower: Tower) {
    this.scene   = scene;
    this.x       = fromX;
    this.y       = fromY;
    this.tower   = tower;
    this.targetX = tower.x;
    this.targetY = tower.y;
    this.graphics = scene.add.graphics().setDepth(6);
    this.draw();
  }

  update(delta: number) {
    if (!this.alive) return;

    const dx   = this.targetX - this.x;
    const dy   = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = SPEED * (delta / 1000);

    if (dist <= step) {
      this.tower.stun(STUN_MS);
      this.alive = false;
      this.graphics.destroy();
      this.spawnImpact();
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.draw();
    }
  }

  private draw() {
    this.graphics.clear();
    // Outer glow
    this.graphics.fillStyle(0xff4400, 0.3);
    this.graphics.fillCircle(this.x, this.y, 14);
    // Mid
    this.graphics.fillStyle(0xff6600, 0.7);
    this.graphics.fillCircle(this.x, this.y, 9);
    // Core
    this.graphics.fillStyle(0xffdd00, 1);
    this.graphics.fillCircle(this.x, this.y, 5);
  }

  private spawnImpact() {
    const g = this.scene.add.graphics().setDepth(8);
    g.fillStyle(0xff4400, 0.85);
    g.fillCircle(this.x, this.y, 20);
    this.scene.tweens.add({
      targets: g, alpha: 0, scaleX: 2.5, scaleY: 2.5,
      duration: 400, ease: 'Power2',
      onComplete: () => g.destroy(),
    });
  }

  destroy() {
    this.alive = false;
    this.graphics.destroy();
  }
}
