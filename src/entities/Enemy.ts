import Phaser from 'phaser';
import { PATH_WAYPOINTS } from '../config';
import { ENEMY_STATS } from '../data/enemyData';

export class Enemy {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;

  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  alive = true;
  reachedEnd = false;
  type: string;

  private color: number;
  private radius: number;
  private armor: number;
  private isBoss: boolean;
  private waypointIndex = 1;

  slowMultiplier = 1;

  constructor(scene: Phaser.Scene, type = 'goblin') {
    this.scene = scene;
    this.type = type;
    const stats = ENEMY_STATS[type] ?? ENEMY_STATS['goblin'];
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.speed = stats.speed;
    this.reward = stats.reward;
    this.color = stats.color;
    this.radius = stats.radius;
    this.armor = stats.armor ?? 0;
    this.isBoss = stats.isBoss ?? false;

    this.x = PATH_WAYPOINTS[0].x;
    this.y = PATH_WAYPOINTS[0].y;

    this.graphics = scene.add.graphics().setDepth(4);
    this.hpBar    = scene.add.graphics().setDepth(4);
    this.draw();
  }

  resetSlow() {
    this.slowMultiplier = 1;
  }

  applySlow(factor: number) {
    this.slowMultiplier = Math.min(this.slowMultiplier, factor);
  }

  update(delta: number) {
    if (!this.alive || this.reachedEnd) return;

    const effectiveSpeed = this.speed * this.slowMultiplier;
    const target = PATH_WAYPOINTS[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = effectiveSpeed * (delta / 1000);

    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
      if (this.waypointIndex >= PATH_WAYPOINTS.length) {
        this.reachedEnd = true;
        this.destroy();
        return;
      }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    this.draw();
  }

  takeDamage(amount: number, ignoresArmor = false) {
    const effective = ignoresArmor ? amount : amount * (1 - this.armor);
    this.hp -= effective;
    if (this.hp <= 0) {
      this.alive = false;
      this.spawnDeathEffect();
      this.destroy();
    }
  }

  private spawnDeathEffect() {
    const g = this.scene.add.graphics().setDepth(7);
    const deathColor = this.isBoss ? 0xff0000 : this.color;
    g.fillStyle(deathColor, 0.7);
    g.fillCircle(this.x, this.y, this.radius * (this.isBoss ? 2.5 : 1.8));

    this.scene.tweens.add({
      targets: g,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: this.isBoss ? 600 : 300,
      ease: 'Power2',
      onComplete: () => g.destroy(),
    });
  }

  private draw() {
    this.graphics.clear();

    // Slow tint
    if (this.slowMultiplier < 1) {
      this.graphics.fillStyle(0x74b9ff, 0.3);
      this.graphics.fillCircle(this.x, this.y, this.radius + 3);
    }

    // Boss pulsing glow
    if (this.isBoss) {
      const pulse = 0.35 + 0.25 * Math.sin(this.scene.time.now * 0.004);
      this.graphics.lineStyle(4, 0xff4444, pulse);
      this.graphics.strokeCircle(this.x, this.y, this.radius + 5);
    }

    // Body
    this.graphics.fillStyle(this.color);
    this.graphics.fillCircle(this.x, this.y, this.radius);

    // Armor indicator — silver outline for armored enemies
    if (this.armor > 0 && !this.isBoss) {
      this.graphics.lineStyle(3, 0xbdc3c7);
      this.graphics.strokeCircle(this.x, this.y, this.radius);
    } else {
      this.graphics.lineStyle(1.5, 0x000000, 0.4);
      this.graphics.strokeCircle(this.x, this.y, this.radius);
    }

    // HP bar
    this.hpBar.clear();
    const barW = this.radius * 2 + (this.isBoss ? 20 : 4);
    const bx = this.x - barW / 2;
    const by = this.y - this.radius - (this.isBoss ? 14 : 9);
    this.hpBar.fillStyle(0x2c2c2c);
    this.hpBar.fillRect(bx, by, barW, this.isBoss ? 6 : 4);
    const pct = Math.max(0, this.hp / this.maxHp);
    const hpColor = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.hpBar.fillStyle(hpColor);
    this.hpBar.fillRect(bx, by, barW * pct, this.isBoss ? 6 : 4);
  }

  containsPoint(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= (this.radius + 4) * (this.radius + 4);
  }

  getName(): string {
    return this.type.charAt(0).toUpperCase() + this.type.slice(1);
  }

  getInfoSnapshot() {
    return {
      name:    this.getName(),
      type:    this.type,
      hp:      Math.ceil(this.hp),
      maxHp:   this.maxHp,
      speed:   this.speed,
      armor:   this.armor,
      reward:  this.reward,
      isBoss:  this.isBoss,
      isSlowed: this.slowMultiplier < 1,
    };
  }

  destroy() {
    this.graphics.destroy();
    this.hpBar.destroy();
  }
}
