import Phaser from 'phaser';
import { TOWER_DATA } from '../data/towerData';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const TOWER_TYPES = ['archer', 'mage', 'slow', 'barracks'] as const;
const PANEL_W = 190;
const ROW_H = 52;
const HEADER_H = 30;

export class TowerSelectionPanel {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private isVisible = false;
  private spotIndex = -1;
  private onSelect: (type: string, spotIndex: number) => void;

  constructor(scene: Phaser.Scene, onSelect: (type: string, spotIndex: number) => void) {
    this.scene = scene;
    this.onSelect = onSelect;
  }

  show(spotX: number, spotY: number, spotIndex: number) {
    this.hide();
    this.spotIndex = spotIndex;

    const totalH = HEADER_H + TOWER_TYPES.length * ROW_H + 8;

    // Position: below spot, clamped to screen
    let px = spotX - PANEL_W / 2;
    let py = spotY + 28;
    if (py + totalH > GAME_HEIGHT - 10) py = spotY - totalH - 28;
    px = Math.max(4, Math.min(px, GAME_WIDTH - PANEL_W - 4));

    // Dismiss zone (full screen behind panel)
    const dismissZone = this.scene.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive()
      .setDepth(19);
    dismissZone.on('pointerdown', () => this.hide());
    this.objects.push(dismissZone);

    // Background
    const bg = this.scene.add.graphics().setDepth(20);
    bg.fillStyle(0x12122a, 0.96);
    bg.fillRoundedRect(px, py, PANEL_W, totalH, 6);
    bg.lineStyle(1, 0x5555aa);
    bg.strokeRoundedRect(px, py, PANEL_W, totalH, 6);
    this.objects.push(bg);

    // Header
    const hdr = this.scene.add
      .text(px + PANEL_W / 2, py + 15, 'Choose Tower', {
        fontSize: '13px', color: '#9999cc', fontFamily: 'monospace',
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.objects.push(hdr);

    TOWER_TYPES.forEach((type, i) => {
      const stats = TOWER_DATA[type];
      const ry = py + HEADER_H + i * ROW_H;

      // Row hover highlight
      const rowBg = this.scene.add.graphics().setDepth(20);
      this.objects.push(rowBg);

      // Color swatch
      const swatch = this.scene.add.graphics().setDepth(21);
      swatch.fillStyle(stats.color);
      swatch.fillRect(px + 10, ry + 15, 18, 18);
      this.objects.push(swatch);

      // Name
      const nameT = this.scene.add
        .text(px + 36, ry + 10, stats.name, {
          fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
        })
        .setDepth(21);
      this.objects.push(nameT);

      // Cost + description
      const infoT = this.scene.add
        .text(px + 36, ry + 28, `${stats.cost}g  ${stats.description}`, {
          fontSize: '10px', color: '#f1c40f', fontFamily: 'monospace',
        })
        .setDepth(21);
      this.objects.push(infoT);

      // Hit zone for this row
      const zone = this.scene.add
        .zone(px + PANEL_W / 2, ry + ROW_H / 2, PANEL_W - 8, ROW_H - 4)
        .setInteractive({ useHandCursor: true })
        .setDepth(22);

      zone.on('pointerover', () => {
        rowBg.clear();
        rowBg.fillStyle(0xffffff, 0.07);
        rowBg.fillRect(px + 4, ry + 2, PANEL_W - 8, ROW_H - 4);
      });
      zone.on('pointerout', () => rowBg.clear());
      zone.on('pointerdown', () => {
        this.onSelect(type, this.spotIndex);
        this.hide();
      });
      this.objects.push(zone);
    });

    this.isVisible = true;
  }

  hide() {
    for (const obj of this.objects) obj.destroy();
    this.objects = [];
    this.isVisible = false;
  }

  get visible() {
    return this.isVisible;
  }
}
