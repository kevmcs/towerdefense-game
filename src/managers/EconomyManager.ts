export class EconomyManager {
  gold: number;
  lives: number;

  constructor(startGold = 150, startLives = 20) {
    this.gold = startGold;
    this.lives = startLives;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  spend(amount: number): boolean {
    if (!this.canAfford(amount)) return false;
    this.gold -= amount;
    return true;
  }

  earn(amount: number) {
    this.gold += amount;
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
  }

  get isDead(): boolean {
    return this.lives <= 0;
  }
}
