import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

const PANEL_W = 190;
const mono = { fontFamily: 'monospace' };

export class EnemyInfoPanel {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(clickX: number, clickY: number, info: ReturnType<import('../entities/Enemy').Enemy['getInfoSnapshot']>) {
    this.hide();

    const tags: string[] = [];
    if (info.isBoss)   tags.push('⚠ BOSS');
    if (info.isSlowed) tags.push('❄ SLOWED');

    const lines: string[] = [];
    lines.push(`HP    ${info.hp} / ${info.maxHp}`);
    lines.push(`SPD   ${info.speed} px/s`);
    lines.push(`ARMOR ${info.armor > 0 ? Math.round(info.armor * 100) + '%' : 'None'}`);
    lines.push(`GOLD  +${info.reward}g`);
    if (tags.length) lines.push(tags.join('  '));

    const panelH = 36 + lines.length * 17 + 10;

    // Position near click, clamped to screen
    let px = clickX + 12;
    let py = clickY - panelH / 2;
    if (px + PANEL_W > GAME_WIDTH - 4)  px = clickX - PANEL_W - 12;
    if (py < 4)                          py = 4;
    if (py + panelH > GAME_HEIGHT - 4)  py = GAME_HEIGHT - panelH - 4;

    // Dismiss zone
    const dismiss = this.scene.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setInteractive().setDepth(19);
    dismiss.on('pointerdown', () => this.hide());
    this.objects.push(dismiss);

    // Background
    const bg = this.scene.add.graphics().setDepth(20);
    bg.fillStyle(0x0d1b2a, 0.95);
    bg.fillRoundedRect(px, py, PANEL_W, panelH, 6);
    bg.lineStyle(1, info.isBoss ? 0xff4444 : 0x3a5f8a);
    bg.strokeRoundedRect(px, py, PANEL_W, panelH, 6);
    this.objects.push(bg);

    // Name header
    const nameColor = info.isBoss ? '#ff4444' : '#f1c40f';
    const header = this.scene.add
      .text(px + 10, py + 10, info.name, { fontSize: '15px', color: nameColor, fontStyle: 'bold', ...mono })
      .setDepth(21);
    this.objects.push(header);

    // HP bar
    const barW = PANEL_W - 20;
    const bx = px + 10;
    const by = py + 29;
    const pct = Math.max(0, info.hp / info.maxHp);
    const hpColor = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
    const barBg = this.scene.add.graphics().setDepth(20);
    barBg.fillStyle(0x2c2c2c);
    barBg.fillRect(bx, by, barW, 5);
    barBg.fillStyle(hpColor);
    barBg.fillRect(bx, by, barW * pct, 5);
    this.objects.push(barBg);

    // Stat lines
    lines.forEach((line, i) => {
      const color = line.startsWith('⚠') ? '#ff4444' : line.startsWith('❄') ? '#74b9ff' : '#aaccee';
      const t = this.scene.add
        .text(px + 10, by + 10 + i * 17, line, { fontSize: '12px', color, ...mono })
        .setDepth(21);
      this.objects.push(t);
    });

    this.isVisible = true;
  }

  hide() {
    for (const obj of this.objects) obj.destroy();
    this.objects = [];
    this.isVisible = false;
  }

  get visible() { return this.isVisible; }
}
