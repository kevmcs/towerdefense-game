import { WAVES } from '../data/waves';
import type { WaveDef } from '../data/waves';

export class WaveManager {
  private waves: WaveDef[];
  private currentWaveIndex = -1;
  private spawnQueue: { type: string; triggerAt: number }[] = [];
  private spawning = false;
  private readonly scale: number;

  waveNumber = 0;

  constructor(enemyScale = 1.0) {
    this.waves = WAVES;
    this.scale = enemyScale;
  }

  get totalWaves(): number {
    return this.waves.length;
  }

  get hasMoreWaves(): boolean {
    return this.currentWaveIndex < this.waves.length - 1;
  }

  get isSpawning(): boolean {
    return this.spawning;
  }

  get nextWaveHasBoss(): boolean {
    const next = this.waves[this.currentWaveIndex + 1];
    return next?.hasBoss ?? false;
  }

  /** Summary string for the next upcoming wave, e.g. "3× Goblin, 2× Orc" */
  getNextWavePreview(): string {
    const next = this.waves[this.currentWaveIndex + 1];
    if (!next) return '';
    const counts: Record<string, number> = {};
    for (const s of next.spawns) counts[s.type] = (counts[s.type] ?? 0) + 1;
    return Object.entries(counts)
      .map(([type, n]) => `${n}× ${type.charAt(0).toUpperCase() + type.slice(1)}`)
      .join('  ');
  }

  startNextWave(currentTime: number): boolean {
    if (!this.hasMoreWaves) return false;
    this.currentWaveIndex++;
    this.waveNumber = this.currentWaveIndex + 1;

    const wave = this.waves[this.currentWaveIndex];
    const base  = wave.spawns;

    // Pad spawn list proportionally to map length
    const targetCount = Math.round(base.length * this.scale);
    const extraCount  = targetCount - base.length;
    const avgDelay    = base.length > 1
      ? base.slice(1).reduce((s, e) => s + e.delay, 0) / (base.length - 1)
      : 1000;
    const spawns = [...base];
    for (let i = 0; i < extraCount; i++) {
      spawns.push({ type: base[i % base.length].type, delay: Math.round(avgDelay) });
    }

    let cumDelay = 0;
    this.spawnQueue = [];
    for (const entry of spawns) {
      cumDelay += entry.delay;
      this.spawnQueue.push({ type: entry.type, triggerAt: currentTime + cumDelay });
    }
    this.spawning = true;
    return true;
  }

  update(currentTime: number): string[] {
    if (!this.spawning) return [];
    const toSpawn: string[] = [];
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].triggerAt <= currentTime) {
      toSpawn.push(this.spawnQueue.shift()!.type);
    }
    if (this.spawnQueue.length === 0) this.spawning = false;
    return toSpawn;
  }

  getWaveReward(): number {
    return this.waves[this.currentWaveIndex]?.reward ?? 0;
  }
}
