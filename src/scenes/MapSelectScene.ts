import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MAPS, PATH_WIDTH, setActiveMap } from '../config';

export class MapSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapSelectScene' });
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.text(GAME_WIDTH / 2, 48, 'SELECT MAP', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const cardW = 260;
    const cardH = 320;
    const gap   = 36;
    const totalW = MAPS.length * cardW + (MAPS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;

    MAPS.forEach((map, i) => {
      const cx = startX + i * (cardW + gap);
      const cy = GAME_HEIGHT / 2 - 20;

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0x1a2f45, 1);
      card.fillRoundedRect(cx, cy - cardH / 2, cardW, cardH, 8);
      card.lineStyle(2, 0x3a6080);
      card.strokeRoundedRect(cx, cy - cardH / 2, cardW, cardH, 8);

      // Map name
      this.add.text(cx + cardW / 2, cy - cardH / 2 + 22, map.name, {
        fontSize: '18px', color: '#f1c40f', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);

      // Mini path preview
      this.drawMiniPath(cx + 16, cy - cardH / 2 + 50, cardW - 32, 160, map.waypoints, map.spots);

      // Stats
      const lines = [
        `Waypoints: ${map.waypoints.length}`,
        `Tower spots: ${map.spots.length}`,
      ];
      lines.forEach((line, li) => {
        this.add.text(cx + cardW / 2, cy + 80 + li * 22, line, {
          fontSize: '13px', color: '#aaccee', fontFamily: 'monospace',
        }).setOrigin(0.5);
      });

      // Select button
      const btn = this.add.text(cx + cardW / 2, cy + cardH / 2 - 28, '[ Play ]', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
        backgroundColor: '#1a5e2a', padding: { x: 16, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#f1c40f'));
      btn.on('pointerout',  () => btn.setColor('#ffffff'));
      btn.on('pointerdown', () => {
        setActiveMap(i);
        this.scene.start('GameScene');
      });

      // Hover highlight for whole card
      const hitZone = this.add
        .zone(cx + cardW / 2, cy, cardW, cardH)
        .setInteractive({ useHandCursor: true });
      hitZone.on('pointerover', () => {
        card.clear();
        card.fillStyle(0x243d55, 1);
        card.fillRoundedRect(cx, cy - cardH / 2, cardW, cardH, 8);
        card.lineStyle(2, 0x5599cc);
        card.strokeRoundedRect(cx, cy - cardH / 2, cardW, cardH, 8);
      });
      hitZone.on('pointerout', () => {
        card.clear();
        card.fillStyle(0x1a2f45, 1);
        card.fillRoundedRect(cx, cy - cardH / 2, cardW, cardH, 8);
        card.lineStyle(2, 0x3a6080);
        card.strokeRoundedRect(cx, cy - cardH / 2, cardW, cardH, 8);
      });
      hitZone.on('pointerdown', () => {
        setActiveMap(i);
        this.scene.start('GameScene');
      });
    });
  }

  private drawMiniPath(
    ox: number, oy: number,
    w: number, h: number,
    waypoints: { x: number; y: number }[],
    spots: { x: number; y: number }[],
  ) {
    // Scale from game coords to mini preview coords
    const scaleX = w / GAME_WIDTH;
    const scaleY = h / GAME_HEIGHT;
    const sx = (x: number) => ox + x * scaleX;
    const sy = (y: number) => oy + y * scaleY;
    const pathW = PATH_WIDTH * Math.min(scaleX, scaleY);

    const g = this.add.graphics();

    // Path
    g.lineStyle(Math.max(pathW, 4), 0x8b6914);
    g.beginPath();
    g.moveTo(sx(waypoints[0].x), sy(waypoints[0].y));
    for (let i = 1; i < waypoints.length; i++) {
      g.lineTo(sx(waypoints[i].x), sy(waypoints[i].y));
    }
    g.strokePath();

    // Tower spots
    g.fillStyle(0xf0e68c, 0.7);
    for (const spot of spots) {
      g.fillCircle(sx(spot.x), sy(spot.y), 3);
    }

    // Entry/exit arrows
    g.fillStyle(0x2ecc71, 0.9);
    g.fillCircle(sx(waypoints[0].x), sy(waypoints[0].y), 4);
    g.fillStyle(0xe74c3c, 0.9);
    g.fillCircle(sx(waypoints[waypoints.length - 1].x), sy(waypoints[waypoints.length - 1].y), 4);
  }
}
