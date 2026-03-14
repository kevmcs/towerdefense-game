import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface GameOverData {
  won: boolean;
  gold: number;
  wave: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const titleColor = data.won ? '#2ecc71' : '#e74c3c';
    const titleText  = data.won ? 'VICTORY!' : 'GAME OVER';

    this.add.text(cx, cy - 80, titleText, {
      fontSize: '52px', color: titleColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy, `Wave reached: ${data.wave}`, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 40, `Gold remaining: ${data.gold}`, {
      fontSize: '22px', color: '#f1c40f', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 110, '[ Play Again ]', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#2c3e50', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#f1c40f'));
    btn.on('pointerout',  () => btn.setColor('#ffffff'));
    btn.on('pointerdown', () => this.scene.start('MapSelectScene'));
  }
}
