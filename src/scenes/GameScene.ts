import Phaser from 'phaser';
import { PATH_WAYPOINTS, TOWER_SPOTS, GAME_WIDTH, GAME_HEIGHT, PATH_WIDTH } from '../config';
import { Enemy } from '../entities/Enemy';
import { Tower } from '../entities/Tower';
import { Projectile } from '../entities/Projectile';
import { EconomyManager } from '../managers/EconomyManager';
import { WaveManager } from '../managers/WaveManager';
import { HUD } from '../ui/HUD';
import { TowerSelectionPanel } from '../ui/TowerSelectionPanel';
import { TowerInfoPanel } from '../ui/TowerInfoPanel';
import { EnemyInfoPanel } from '../ui/EnemyInfoPanel';
import { TOWER_DATA } from '../data/towerData';

type GameState = 'idle' | 'wave' | 'between' | 'gameover' | 'victory';

export class GameScene extends Phaser.Scene {
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];

  private occupiedSpots = new Set<number>();
  private towerMap = new Map<number, Tower>(); // spotIndex → Tower
  private selectedSpotIndex = -1;

  private economy!: EconomyManager;
  private waveManager!: WaveManager;
  private hud!: HUD;
  private selectionPanel!: TowerSelectionPanel;
  private infoPanel!: TowerInfoPanel;
  private enemyInfoPanel!: EnemyInfoPanel;

  private state: GameState = 'idle';
  private startWaveBtn!: Phaser.GameObjects.Text;
  private spotHighlights!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.occupiedSpots = new Set();
    this.towerMap = new Map();
    this.selectedSpotIndex = -1;
    this.state = 'idle';

    this.economy     = new EconomyManager(150, 20);
    this.waveManager = new WaveManager();
    this.hud         = new HUD(this, GAME_WIDTH);

    this.selectionPanel  = new TowerSelectionPanel(this, (type, idx) => this.onTowerSelected(type, idx));
    this.infoPanel       = new TowerInfoPanel(
      this,
      (idx) => this.onUpgradeTower(idx),
      (idx) => this.onSellTower(idx),
    );
    this.enemyInfoPanel  = new EnemyInfoPanel(this);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      for (const e of this.enemies) {
        if (e.containsPoint(ptr.x, ptr.y)) {
          this.selectionPanel.hide();
          this.deselectTower();
          this.enemyInfoPanel.show(e.getInfoSnapshot());
          return;
        }
      }
      this.enemyInfoPanel.hide();
    });

    this.drawBackground();
    this.drawPath();
    this.spotHighlights = this.add.graphics().setDepth(2);
    this.drawTowerSpots();
    this.setupSpotZones();
    this.createStartWaveButton();

    this.hud.update(this.economy.gold, this.economy.lives, 0, this.waveManager.totalWaves);
    this.hud.setMessage('Click a spot to place a tower — then Start Wave');
    this.hud.setWavePreview(this.waveManager.getNextWavePreview());
  }

  update(time: number, delta: number) {
    if (this.state !== 'wave') return;

    for (const type of this.waveManager.update(time)) {
      this.enemies.push(new Enemy(this, type));
    }

    for (const e of this.enemies) e.resetSlow();
    for (const t of this.towers) t.update(delta, this.enemies, this.projectiles);

    for (const e of this.enemies) {
      e.update(delta);
      if (e.reachedEnd) this.economy.loseLife();
      else if (!e.alive) this.economy.earn(e.reward);
    }
    this.enemies = this.enemies.filter(e => e.alive && !e.reachedEnd);

    for (const p of this.projectiles) p.update(delta);
    this.projectiles = this.projectiles.filter(p => p.alive);

    this.hud.update(this.economy.gold, this.economy.lives, this.waveManager.waveNumber, this.waveManager.totalWaves);

    if (this.economy.isDead) { this.endGame(false); return; }

    if (!this.waveManager.isSpawning && this.enemies.length === 0) {
      const reward = this.waveManager.getWaveReward();
      this.economy.earn(reward);
      this.hud.update(this.economy.gold, this.economy.lives, this.waveManager.waveNumber, this.waveManager.totalWaves);

      if (!this.waveManager.hasMoreWaves) {
        this.endGame(true);
      } else {
        this.state = 'between';
        this.hud.setMessage(`Wave ${this.waveManager.waveNumber} cleared!  +${reward}g`);
        this.hud.setWavePreview(this.waveManager.getNextWavePreview());
        this.startWaveBtn.setVisible(true);
      }
    }
  }

  // ── Tower placement ───────────────────────────────────────────────────────

  private onSpotClicked(index: number) {
    // Close any open panels first
    this.selectionPanel.hide();
    this.enemyInfoPanel.hide();

    if (this.occupiedSpots.has(index)) {
      // Toggle: clicking the already-selected tower deselects it
      if (this.selectedSpotIndex === index) {
        this.deselectTower();
      } else {
        this.deselectTower();
        this.selectTower(index);
      }
    } else {
      this.deselectTower();
      this.infoPanel.hide();
      const spot = TOWER_SPOTS[index];
      this.selectionPanel.show(spot.x, spot.y, index);
    }
  }

  private selectTower(spotIndex: number) {
    const tower = this.towerMap.get(spotIndex);
    if (!tower) return;
    this.selectedSpotIndex = spotIndex;
    tower.setSelected(true);
    const spot = TOWER_SPOTS[spotIndex];
    this.infoPanel.show(spot.x, spot.y, spotIndex, tower.getInfo());
  }

  private deselectTower() {
    if (this.selectedSpotIndex >= 0) {
      const tower = this.towerMap.get(this.selectedSpotIndex);
      tower?.setSelected(false);
      this.selectedSpotIndex = -1;
    }
    this.infoPanel.hide();
  }

  private onTowerSelected(type: string, spotIndex: number) {
    const stats = TOWER_DATA[type];
    if (!this.economy.canAfford(stats.cost)) {
      this.hud.setMessage('Not enough gold!');
      this.time.delayedCall(1800, () => {
        if (this.state !== 'wave') this.hud.setMessage('Click a spot to place a tower');
      });
      return;
    }
    this.economy.spend(stats.cost);
    const spot = TOWER_SPOTS[spotIndex];
    const tower = new Tower(this, spot.x, spot.y, type, stats);
    this.towers.push(tower);
    this.towerMap.set(spotIndex, tower);
    this.occupiedSpots.add(spotIndex);
    this.hud.update(this.economy.gold, this.economy.lives, this.waveManager.waveNumber, this.waveManager.totalWaves);
  }

  // ── Upgrade & Sell ────────────────────────────────────────────────────────

  private onUpgradeTower(spotIndex: number) {
    const tower = this.towerMap.get(spotIndex);
    if (!tower || !tower.canUpgrade) return;

    if (!this.economy.canAfford(tower.upgradeCost)) {
      this.hud.setMessage('Not enough gold to upgrade!');
      this.time.delayedCall(1800, () => this.hud.setMessage(''));
      return;
    }

    this.economy.spend(tower.upgradeCost);
    tower.upgrade();
    this.hud.update(this.economy.gold, this.economy.lives, this.waveManager.waveNumber, this.waveManager.totalWaves);

    // Refresh info panel with updated stats
    const spot = TOWER_SPOTS[spotIndex];
    this.infoPanel.refresh(spot.x, spot.y, spotIndex, tower.getInfo());
  }

  private onSellTower(spotIndex: number) {
    const tower = this.towerMap.get(spotIndex);
    if (!tower) return;

    this.economy.earn(tower.sellValue);
    tower.destroyTower();
    this.towers = this.towers.filter(t => t !== tower);
    this.towerMap.delete(spotIndex);
    this.occupiedSpots.delete(spotIndex);
    this.selectedSpotIndex = -1;
    this.hud.update(this.economy.gold, this.economy.lives, this.waveManager.waveNumber, this.waveManager.totalWaves);
  }

  // ── Wave control ──────────────────────────────────────────────────────────

  private createStartWaveButton() {
    this.startWaveBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '[ Start Wave ]', {
        fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
        backgroundColor: '#1a5e2a', padding: { x: 20, y: 8 },
      })
      .setOrigin(0.5, 1).setDepth(10).setInteractive({ useHandCursor: true });

    this.startWaveBtn.on('pointerover', () => this.startWaveBtn.setColor('#f1c40f'));
    this.startWaveBtn.on('pointerout',  () => this.startWaveBtn.setColor('#ffffff'));
    this.startWaveBtn.on('pointerdown', () => {
      if (this.state !== 'idle' && this.state !== 'between') return;
      const hasBoss = this.waveManager.nextWaveHasBoss;
      this.waveManager.startNextWave(this.time.now);
      this.state = 'wave';
      this.startWaveBtn.setVisible(false);
      this.hud.setMessage('');
      this.hud.setWavePreview('');
      this.deselectTower();
      if (hasBoss) this.showBossAnnouncement();
    });
  }

  private showBossAnnouncement() {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '⚠  BOSS INCOMING  ⚠', {
      fontSize: '38px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1000,
      onComplete: () => txt.destroy(),
    });
  }

  private endGame(won: boolean) {
    this.state = won ? 'victory' : 'gameover';
    this.enemyInfoPanel.hide();
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene', { won, gold: this.economy.gold, wave: this.waveManager.waveNumber });
    });
  }

  // ── Spot interaction ──────────────────────────────────────────────────────

  private setupSpotZones() {
    TOWER_SPOTS.forEach((spot, i) => {
      const zone = this.add.zone(spot.x, spot.y, 44, 44)
        .setInteractive({ useHandCursor: true }).setDepth(6);

      zone.on('pointerdown', () => this.onSpotClicked(i));
      zone.on('pointerover', () => {
        if (this.occupiedSpots.has(i)) return;
        this.spotHighlights.fillStyle(0xffffff, 0.12);
        this.spotHighlights.fillCircle(spot.x, spot.y, 22);
      });
      zone.on('pointerout', () => this.spotHighlights.clear());
    });
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  private drawBackground() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x2d5a1b);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.lineStyle(1, 0x265018, 0.35);
    for (let x = 0; x < GAME_WIDTH; x += 40) bg.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 40) bg.lineBetween(0, y, GAME_WIDTH, y);
  }

  private drawPath() {
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(PATH_WIDTH, 0x8b6914);
    g.beginPath();
    g.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
    for (let i = 1; i < PATH_WAYPOINTS.length; i++) g.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
    g.strokePath();
  }

  private drawTowerSpots() {
    const g = this.add.graphics().setDepth(2);
    for (const spot of TOWER_SPOTS) {
      const segs = 8;
      for (let i = 0; i < segs; i++) {
        if (i % 2 === 0) {
          const s = (i / segs) * Math.PI * 2;
          const e = ((i + 0.8) / segs) * Math.PI * 2;
          g.lineStyle(2, 0xf0e68c, 0.55);
          g.beginPath();
          g.arc(spot.x, spot.y, 20, s, e, false);
          g.strokePath();
        }
      }
      g.fillStyle(0xf0e68c, 0.2);
      g.fillCircle(spot.x, spot.y, 4);
    }
  }
}
