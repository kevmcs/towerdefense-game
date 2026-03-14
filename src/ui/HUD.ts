import Phaser from 'phaser';

export class HUD {
  private goldText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private previewText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, width: number) {
    const mono = { fontFamily: 'monospace' };

    const bar = scene.add.graphics().setDepth(9);
    bar.fillStyle(0x000000, 0.6);
    bar.fillRect(0, 0, width, 38);

    this.goldText  = scene.add.text(12, 10, 'Gold: 0', { fontSize: '18px', color: '#f1c40f', ...mono }).setDepth(10);
    this.livesText = scene.add.text(width - 12, 10, 'Lives: 0', { fontSize: '18px', color: '#e74c3c', ...mono }).setOrigin(1, 0).setDepth(10);
    this.waveText  = scene.add.text(width / 2, 10, 'Wave 0 / 0', { fontSize: '18px', color: '#ffffff', ...mono }).setOrigin(0.5, 0).setDepth(10);

    this.messageText = scene.add.text(width / 2, 44, '', {
      fontSize: '14px', color: '#f0e68c', ...mono,
    }).setOrigin(0.5, 0).setDepth(10);

    this.previewText = scene.add.text(width / 2, 62, '', {
      fontSize: '12px', color: '#aaaaaa', ...mono,
    }).setOrigin(0.5, 0).setDepth(10);
  }

  update(gold: number, lives: number, wave: number, totalWaves: number) {
    this.goldText.setText(`Gold: ${gold}`);
    this.livesText.setText(`Lives: ${lives}`);
    this.waveText.setText(`Wave ${wave} / ${totalWaves}`);
  }

  setMessage(msg: string) {
    this.messageText.setText(msg);
  }

  setWavePreview(preview: string) {
    this.previewText.setText(preview ? `Next: ${preview}` : '');
  }
}
