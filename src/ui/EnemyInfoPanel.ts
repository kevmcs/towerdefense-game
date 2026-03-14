import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const RIBBON_H = 46;
const RIBBON_Y = GAME_HEIGHT - RIBBON_H;
const mono = { fontFamily: 'monospace' };

export class EnemyInfoPanel {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(info: ReturnType<import('../entities/Enemy').Enemy['getInfoSnapshot']>) {
    this.hide();

    const cy = RIBBON_Y + RIBBON_H / 2;  // vertical center of ribbon

    // Background ribbon
    const bg = this.scene.add.graphics().setDepth(20);
    bg.fillStyle(0x0a1520, 0.97);
    bg.fillRect(0, RIBBON_Y, GAME_WIDTH, RIBBON_H);
    bg.lineStyle(1, info.isBoss ? 0xff4444 : 0x3a5f8a);
    bg.lineBetween(0, RIBBON_Y, GAME_WIDTH, RIBBON_Y);
    this.objects.push(bg);

    // ── Name ────────────────────────────────────────────────────
    const nameColor = info.isBoss ? '#ff4444' : '#f1c40f';
    const nameT = this.scene.add
      .text(14, cy, info.name.toUpperCase(), {
        fontSize: '14px', color: nameColor, fontStyle: 'bold', ...mono,
      })
      .setOrigin(0, 0.5).setDepth(21);
    this.objects.push(nameT);

    // ── HP bar + fraction ────────────────────────────────────────
    const hpLabelX = 115;
    const barX     = 135;
    const barW     = 130;
    const barH     = 7;
    const barY     = cy - barH / 2;
    const pct      = Math.max(0, info.hp / info.maxHp);
    const hpColor  = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;

    this.scene.add
      .text(hpLabelX, cy, 'HP', { fontSize: '11px', color: '#7799bb', ...mono })
      .setOrigin(0, 0.5).setDepth(21);
    this.objects.push(this.scene.add.graphics().setDepth(20));  // placeholder

    const barGfx = this.scene.add.graphics().setDepth(20);
    barGfx.fillStyle(0x2c2c2c);
    barGfx.fillRect(barX, barY, barW, barH);
    barGfx.fillStyle(hpColor);
    barGfx.fillRect(barX, barY, barW * pct, barH);
    this.objects.push(barGfx);

    this.scene.add
      .text(barX + barW + 6, cy, `${info.hp}/${info.maxHp}`, {
        fontSize: '11px', color: '#aaccee', ...mono,
      })
      .setOrigin(0, 0.5).setDepth(21);

    // ── Divider helper ───────────────────────────────────────────
    const addDivider = (x: number) => {
      const g = this.scene.add.graphics().setDepth(20);
      g.lineStyle(1, 0x2a4a6a, 0.8);
      g.lineBetween(x, RIBBON_Y + 8, x, GAME_HEIGHT - 8);
      this.objects.push(g);
    };

    // ── SPD ──────────────────────────────────────────────────────
    const divX1 = 305;
    addDivider(divX1);
    this.scene.add
      .text(divX1 + 14, cy, `SPD  ${info.speed} px/s`, {
        fontSize: '12px', color: '#aaccee', ...mono,
      })
      .setOrigin(0, 0.5).setDepth(21);

    // ── ARMOR ────────────────────────────────────────────────────
    const divX2 = 450;
    addDivider(divX2);
    const armorStr = info.armor > 0 ? `${Math.round(info.armor * 100)}%` : 'None';
    this.scene.add
      .text(divX2 + 14, cy, `ARMOR  ${armorStr}`, {
        fontSize: '12px', color: '#aaccee', ...mono,
      })
      .setOrigin(0, 0.5).setDepth(21);

    // ── GOLD ─────────────────────────────────────────────────────
    const divX3 = 590;
    addDivider(divX3);
    this.scene.add
      .text(divX3 + 14, cy, `GOLD  +${info.reward}g`, {
        fontSize: '12px', color: '#f1c40f', ...mono,
      })
      .setOrigin(0, 0.5).setDepth(21);

    // ── Status tags (right-aligned) ──────────────────────────────
    let tagX = GAME_WIDTH - 12;
    if (info.isSlowed) {
      const t = this.scene.add
        .text(tagX, cy, '❄ SLOWED', { fontSize: '12px', color: '#74b9ff', ...mono })
        .setOrigin(1, 0.5).setDepth(21);
      this.objects.push(t);
      tagX -= t.width + 14;
    }
    if (info.isBoss) {
      this.scene.add
        .text(tagX, cy, '⚠ BOSS', { fontSize: '12px', color: '#ff4444', fontStyle: 'bold', ...mono })
        .setOrigin(1, 0.5).setDepth(21);
    }

    this.isVisible = true;
  }

  hide() {
    for (const obj of this.objects) obj.destroy();
    this.objects = [];
    this.isVisible = false;
  }

  get visible() { return this.isVisible; }
}
