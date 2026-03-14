import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { UPGRADE_DATA } from '../data/upgradeData';

export interface TowerInfo {
  type: string;
  name: string;
  level: number;
  effectiveDamage: number;
  effectiveRange: number;
  effectiveFireRate: number;
  effectiveSlowFactor: number;
  upgradeCost: number;
  upgradeLabel: string;
  sellValue: number;
}

const PANEL_W = 215;
const mono = { fontFamily: 'monospace' };

export class TowerInfoPanel {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private isVisible = false;
  private spotIndex = -1;

  private onUpgrade: (spotIndex: number) => void;
  private onSell: (spotIndex: number) => void;

  constructor(
    scene: Phaser.Scene,
    onUpgrade: (spotIndex: number) => void,
    onSell: (spotIndex: number) => void,
  ) {
    this.scene = scene;
    this.onUpgrade = onUpgrade;
    this.onSell = onSell;
  }

  show(spotX: number, spotY: number, spotIndex: number, info: TowerInfo) {
    this.hide();
    this.spotIndex = spotIndex;

    const isMaxed = info.level >= 3;
    const panelH = isMaxed ? 138 : 168;

    // Position: prefer below spot, flip up if too close to bottom
    let px = spotX - PANEL_W / 2;
    let py = spotY + 28;
    if (py + panelH > GAME_HEIGHT - 10) py = spotY - panelH - 28;
    px = Math.max(4, Math.min(px, GAME_WIDTH - PANEL_W - 4));

    // Dismiss zone
    const dismiss = this.scene.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive().setDepth(19);
    dismiss.on('pointerdown', () => this.hide());
    this.objects.push(dismiss);

    // Background
    const bg = this.scene.add.graphics().setDepth(20);
    bg.fillStyle(0x0d1b2a, 0.97);
    bg.fillRoundedRect(px, py, PANEL_W, panelH, 6);
    bg.lineStyle(1, 0x3a5f8a);
    bg.strokeRoundedRect(px, py, PANEL_W, panelH, 6);
    this.objects.push(bg);

    // ── Header: Name + level stars ──────────────────────────────────────────
    const stars = '★'.repeat(info.level) + '☆'.repeat(3 - info.level);
    const header = this.scene.add
      .text(px + 10, py + 10, `${info.name}`, { fontSize: '15px', color: '#ffffff', ...mono })
      .setDepth(21);
    const starsT = this.scene.add
      .text(px + PANEL_W - 10, py + 10, stars, { fontSize: '14px', color: '#f1c40f', ...mono })
      .setOrigin(1, 0).setDepth(21);
    this.objects.push(header, starsT);

    // ── Stats ───────────────────────────────────────────────────────────────
    const statsY = py + 32;
    const statsLine = this.buildStatsLine(info);
    const statsT = this.scene.add
      .text(px + 10, statsY, statsLine, { fontSize: '12px', color: '#aaccee', ...mono })
      .setDepth(21);
    this.objects.push(statsT);

    // Divider
    const div1 = this.scene.add.graphics().setDepth(20);
    div1.lineStyle(1, 0x3a5f8a, 0.6);
    div1.lineBetween(px + 8, py + 52, px + PANEL_W - 8, py + 52);
    this.objects.push(div1);

    // ── Upgrade section ─────────────────────────────────────────────────────
    if (!isMaxed) {
      const upgY = py + 58;
      const upgBg = this.scene.add.graphics().setDepth(20);
      this.objects.push(upgBg);

      const upgLabel = this.scene.add
        .text(px + 10, upgY, `▲ Upgrade to L${info.level + 1}  —  ${info.upgradeCost}g`, {
          fontSize: '13px', color: '#2ecc71', ...mono,
        }).setDepth(21);
      const upgSub = this.scene.add
        .text(px + 10, upgY + 18, info.upgradeLabel, {
          fontSize: '11px', color: '#888888', ...mono,
        }).setDepth(21);
      this.objects.push(upgLabel, upgSub);

      const upgZone = this.scene.add
        .zone(px + PANEL_W / 2, upgY + 18, PANEL_W - 8, 42)
        .setInteractive({ useHandCursor: true }).setDepth(22);
      upgZone.on('pointerover', () => {
        upgBg.fillStyle(0x2ecc71, 0.1);
        upgBg.fillRect(px + 4, upgY - 2, PANEL_W - 8, 42);
      });
      upgZone.on('pointerout', () => upgBg.clear());
      upgZone.on('pointerdown', () => {
        this.onUpgrade(this.spotIndex);
      });
      this.objects.push(upgZone);

      // Divider
      const div2 = this.scene.add.graphics().setDepth(20);
      div2.lineStyle(1, 0x3a5f8a, 0.6);
      div2.lineBetween(px + 8, upgY + 44, px + PANEL_W - 8, upgY + 44);
      this.objects.push(div2);
    }

    // ── Sell section ────────────────────────────────────────────────────────
    const sellY = isMaxed ? py + 58 : py + 122;
    const sellBg = this.scene.add.graphics().setDepth(20);
    this.objects.push(sellBg);

    const sellT = this.scene.add
      .text(px + 10, sellY + 8, `✕ Sell tower  +${info.sellValue}g`, {
        fontSize: '13px', color: '#e74c3c', ...mono,
      }).setDepth(21);
    this.objects.push(sellT);

    const sellZone = this.scene.add
      .zone(px + PANEL_W / 2, sellY + 16, PANEL_W - 8, 32)
      .setInteractive({ useHandCursor: true }).setDepth(22);
    sellZone.on('pointerover', () => {
      sellBg.fillStyle(0xe74c3c, 0.1);
      sellBg.fillRect(px + 4, sellY + 2, PANEL_W - 8, 30);
    });
    sellZone.on('pointerout', () => sellBg.clear());
    sellZone.on('pointerdown', () => {
      this.onSell(this.spotIndex);
      this.hide();
    });
    this.objects.push(sellZone);

    this.isVisible = true;
  }

  /** Refresh panel in-place after an upgrade (re-show at same spot) */
  refresh(spotX: number, spotY: number, spotIndex: number, info: TowerInfo) {
    this.show(spotX, spotY, spotIndex, info);
  }

  hide() {
    for (const obj of this.objects) obj.destroy();
    this.objects = [];
    this.isVisible = false;
  }

  get visible() {
    return this.isVisible;
  }

  private buildStatsLine(info: TowerInfo): string {
    if (info.type === 'slow') {
      const slowPct = Math.round((1 - info.effectiveSlowFactor) * 100);
      return `RNG: ${Math.round(info.effectiveRange)}    SLOW: ${slowPct}%`;
    }
    if (info.type === 'barracks') {
      const soldiers = UPGRADE_DATA['barracks'][info.level - 1] && info.level === 3 ? 3 : 2;
      return `SOL DMG: ${Math.round(info.effectiveDamage)}    COUNT: ${soldiers}`;
    }
    return `DMG: ${Math.round(info.effectiveDamage)}  RNG: ${Math.round(info.effectiveRange)}  SPD: ${info.effectiveFireRate.toFixed(1)}/s`;
  }
}
