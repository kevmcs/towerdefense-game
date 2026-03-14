import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Phase 1: no real assets — everything is drawn with graphics primitives
  }

  create() {
    this.scene.start('MapSelectScene');
  }
}
