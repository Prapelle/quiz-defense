import Phaser from 'phaser';
import { GAME_SETTINGS, GHOSTS, PLANTS, STAGES, type GhostConfig, type PlantConfig, type PlantId, type GhostId } from './config';
import type { GameSettings } from '../types';

export interface GameStats {
  mana: number;
  health: number;
  score: number;
  kills: number;
  spawned: number;
  target: number;
  streak: number;
  stageName: string;
  status: 'playing' | 'won' | 'lost';
}
interface PlantUnit { config: PlantConfig; row: number; col: number; x: number; y: number; hp: number; sprite: Phaser.GameObjects.Text; lastAction: number; }
interface GhostUnit { config: GhostConfig; row: number; x: number; y: number; hp: number; sprite: Phaser.GameObjects.Text; slowUntil: number; lastAttack: number; }
interface Projectile { circle: Phaser.GameObjects.Arc; x: number; y: number; target: GhostUnit; speed: number; damage: number; splash: number; slowMs?: number; }

export class GameScene extends Phaser.Scene {
  private plants: PlantUnit[] = [];
  private ghosts: GhostUnit[] = [];
  private projectiles: Projectile[] = [];
  private selectedPlant: PlantId = 'lotus';
  private stage: number = 1;
  private mana: number = GAME_SETTINGS.startingMana;
  private health: number = GAME_SETTINGS.baseHealth;
  private score: number = 0;
  private kills: number = 0;
  private spawned: number = 0;
  private streak: number = 0;
  private status: GameStats['status'] = 'playing';
  private spawnElapsed = 0;
  private uiTexts = new Map<string, Phaser.GameObjects.Text>();
  private gameSettings: GameSettings = { rewardCorrect: GAME_SETTINGS.rewardCorrect, startingMana: GAME_SETTINGS.startingMana, baseHealth: GAME_SETTINGS.baseHealth, questionStreakBonus: GAME_SETTINGS.questionStreakBonus, questionStreakEvery: GAME_SETTINGS.questionStreakEvery, enemySpawnMs: GAME_SETTINGS.enemySpawnMs, maxEnemies: GAME_SETTINGS.maxEnemies, questionCooldownMs: GAME_SETTINGS.questionCooldownMs };

  constructor() { super('GameScene'); }

  create(): void {
    this.drawWorld();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleBoardTap(pointer.x, pointer.y));
    this.events.on('selected-plant', (id: PlantId) => { this.selectedPlant = id; this.refreshUi(); });
    this.events.on('reset-game', (stage: number) => this.resetGame(stage));
    this.events.on('set-game-settings', (settings: GameSettings) => { this.gameSettings = { ...this.gameSettings, ...settings }; });
    this.events.on('answer-question', (data: { correct: boolean; reward: number; streakEvery: number; streakBonus: number }) => this.applyAnswer(data));
    this.events.on('request-question', () => {
      if (this.status === 'playing') this.game.events.emit('quiz-requested');
    });
    this.events.on('scene-ready', () => this.pushStats());
    this.resetGame(1);
  }

  update(_time: number, delta: number): void {
    if (this.status !== 'playing') return;
    this.spawnElapsed += delta;
    const stageConfig = STAGES.find((s) => s.id === this.stage) ?? STAGES[0];
    const targetEnemies = this.targetEnemies();
    const spawnInterval = Math.max(2200, Math.round(this.gameSettings.enemySpawnMs * stageConfig.spawnMs / GAME_SETTINGS.enemySpawnMs));
    if (this.spawned < targetEnemies && this.spawnElapsed >= spawnInterval) {
      this.spawnElapsed = 0;
      this.spawnGhost(stageConfig.allowedGhosts[this.spawned % stageConfig.allowedGhosts.length]);
    }
    const now = this.time.now;
    for (const plant of [...this.plants]) this.updatePlant(plant, now);
    for (const ghost of [...this.ghosts]) this.updateGhost(ghost, now, delta);
    this.updateProjectiles(delta);
    if (this.health <= 0) this.endGame(false);
    else if (this.spawned >= targetEnemies && this.ghosts.length === 0) this.endGame(true);
  }

  private drawWorld(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1731, 0x152648, 0x172a42, 0x0a1728, 1);
    bg.fillRect(0, 0, GAME_SETTINGS.canvasWidth, GAME_SETTINGS.canvasHeight);
    // Moon and distant village silhouettes.
    bg.fillStyle(0xc6e5ff, 0.9); bg.fillCircle(1070, 55, 31);
    bg.fillStyle(0x0b1730, 0.4); bg.fillCircle(1082, 46, 31);
    bg.fillStyle(0x0a1327, 0.95);
    for (let i = 0; i < 8; i += 1) {
      const x = 350 + i * 110;
      bg.fillTriangle(x - 34, 115, x, 73 - (i % 3) * 8, x + 34, 115);
      bg.fillRect(x - 26, 115, 52, 27);
      bg.fillStyle(0xffcf6b, 0.18); bg.fillCircle(x, 127, 3); bg.fillStyle(0x0a1327, 0.95);
    }
    bg.fillStyle(0x1b3a35, 1); bg.fillRect(0, 119, 1280, 430);
    // Lane grid with alternating mossy tiles.
    for (let row = 0; row < GAME_SETTINGS.gridRows; row += 1) {
      for (let col = 0; col < GAME_SETTINGS.gridCols; col += 1) {
        const x = 158 + col * 104;
        const y = 116 + row * 83;
        const colour = (row + col) % 2 === 0 ? 0x527a51 : 0x466d49;
        bg.fillStyle(colour, 0.93); bg.fillRoundedRect(x, y, 100, 79, 8);
        bg.lineStyle(1, 0xa8d38c, 0.19); bg.strokeRoundedRect(x, y, 100, 79, 8);
        bg.fillStyle(0xc1dc82, 0.13); bg.fillCircle(x + 16 + ((row * 3 + col * 2) % 65), y + 17 + ((row + col) % 36), 2);
      }
    }
    // Protective boundary, gate and little lanterns.
    bg.fillStyle(0x7c5b3b, 1); bg.fillRoundedRect(20, 111, 120, 445, 12);
    bg.fillStyle(0x2b2540, 1); bg.fillRoundedRect(37, 133, 86, 398, 8);
    bg.lineStyle(3, 0xe3b966, 0.9); bg.strokeRoundedRect(36, 132, 88, 400, 8);
    bg.fillStyle(0xffae42, 0.35); bg.fillCircle(78, 149, 35); bg.fillStyle(0xffc75e, 1); bg.fillCircle(78, 149, 10);
    bg.fillStyle(0x101a2a, 1); bg.fillRoundedRect(23, 550, 112, 45, 10);
    bg.lineStyle(2, 0xe7bb62, 0.8); bg.strokeRoundedRect(23, 550, 112, 45, 10);
    this.add.text(79, 571, 'หมู่บ้าน', { fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '17px', color: '#fff0c7', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(640, 22, 'หมู่บ้านใต้แสงจันทร์', { fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '20px', color: '#f7e3b4', fontStyle: 'bold', stroke: '#18213a', strokeThickness: 4 }).setOrigin(0.5);
    this.add.text(640, 50, 'แตะช่องว่างเพื่อวางตัวละคร · ตอบคำถามเพื่อรับพลังอาคม', { fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '14px', color: '#d7e6f5', stroke: '#18213a', strokeThickness: 3 }).setOrigin(0.5);
    this.makeUiText('mana', 176, 25, '☀ 150', '#ffdc79', '22px');
    this.makeUiText('health', 1050, 25, '❤ 5/5', '#ff8292', '22px');
    this.makeUiText('score', 1150, 25, '★ 0', '#fff0b4', '18px');
    this.makeUiText('wave', 1150, 54, 'ผี 0/10', '#deefff', '14px');
  }

  private makeUiText(key: string, x: number, y: number, value: string, color: string, fontSize: string): void {
    const text = this.add.text(x, y, value, { fontFamily: 'Tahoma, Arial, sans-serif', fontSize, color, fontStyle: 'bold', stroke: '#101a2e', strokeThickness: 4 }).setOrigin(0.5);
    this.uiTexts.set(key, text);
  }

  private handleBoardTap(x: number, y: number): void {
    if (this.status !== 'playing' || x < 150 || x > 1090 || y < 116 || y > 531) return;
    const col = Math.floor((x - 158) / 104);
    const row = Math.floor((y - 116) / 83);
    if (row < 0 || row >= 5 || col < 0 || col >= 9) return;
    if (this.plants.some((p) => p.row === row && p.col === col)) {
      this.game.events.emit('toast', 'ช่องนี้มีผู้พิทักษ์อยู่แล้ว');
      return;
    }
    const config = PLANTS.find((p) => p.id === this.selectedPlant)!;
    if (this.mana < config.cost) {
      this.game.events.emit('toast', `พลังอาคมไม่พอ ต้องใช้ ${config.cost}`);
      return;
    }
    this.mana -= config.cost;
    const px = 208 + col * 104;
    const py = 154 + row * 83;
    const sprite = this.add.text(px, py, config.emoji, { fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif', fontSize: config.id === 'ward' ? '48px' : '42px', stroke: '#112236', strokeThickness: 2 }).setOrigin(0.5).setDepth(5);
    const ring = this.add.graphics().lineStyle(2, 0xf9d983, 0.7).strokeCircle(px, py + 6, 29).setDepth(4);
    // Ring follows plant life without using remote art assets.
    sprite.setData('ring', ring);
    this.plants.push({ config, row, col, x: px, y: py, hp: config.hp, sprite, lastAction: this.time.now });
    this.pushStats();
  }

  private spawnGhost(id: GhostId): void {
    const config = GHOSTS.find((ghost) => ghost.id === id) ?? GHOSTS[0];
    const row = Math.floor(Math.random() * GAME_SETTINGS.gridRows);
    const x = 1150;
    const y = 154 + row * 83;
    const sprite = this.add.text(x, y, config.emoji, { fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif', fontSize: `${config.size}px`, stroke: '#1c1831', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
    sprite.setData('hpBar', this.add.graphics().setDepth(7));
    this.ghosts.push({ config, row, x, y, hp: config.hp, sprite, slowUntil: 0, lastAttack: 0 });
    this.spawned += 1;
    this.pushStats();
  }

  private updatePlant(plant: PlantUnit, now: number): void {
    if (plant.config.manaEveryMs && now - plant.lastAction >= plant.config.manaEveryMs) {
      plant.lastAction = now;
      this.mana += 15;
      this.game.events.emit('toast', 'กุมารวิญญาณสร้างพลังอาคม +15');
      this.pushStats();
    }
    if (!plant.config.attackDamage || now - plant.lastAction < plant.config.attackMs) return;
    const target = this.ghosts.find((g) => g.row === plant.row && g.x < plant.x + plant.config.attackRange && g.x > plant.x + 15);
    if (!target) return;
    plant.lastAction = now;
    const circle = this.add.circle(plant.x + 22, plant.y - 7, plant.config.id === 'fireLotus' ? 10 : 6, plant.config.id === 'fireLotus' ? 0xff8c55 : 0x9aebff).setStrokeStyle(2, 0xe7fcff).setDepth(8);
    this.projectiles.push({ circle, x: plant.x + 22, y: plant.y - 7, target, speed: 420, damage: plant.config.attackDamage, splash: plant.config.splashRadius ?? 0, slowMs: plant.config.slowMs });
  }

  private updateGhost(ghost: GhostUnit, now: number, delta: number): void {
    const blocker = this.plants.find((p) => p.row === ghost.row && Math.abs(p.x - ghost.x) < 30 && (!ghost.config.flying || p.config.id !== 'ward'));
    if (blocker) {
      if (now - ghost.lastAttack > 920) {
        ghost.lastAttack = now;
        blocker.hp -= ghost.config.damage;
        blocker.sprite.setAlpha(0.62); this.time.delayedCall(100, () => blocker.sprite.active && blocker.sprite.setAlpha(1));
        if (blocker.hp <= 0) {
          const ring = blocker.sprite.getData('ring') as Phaser.GameObjects.Graphics | undefined;
          ring?.destroy(); blocker.sprite.destroy(); this.plants = this.plants.filter((p) => p !== blocker);
        }
      }
    } else {
      const slowFactor = ghost.slowUntil > now ? 0.43 : 1;
      ghost.x -= ghost.config.speed * slowFactor * delta / 1000;
      ghost.sprite.setX(ghost.x);
      if (ghost.x < 80) {
        this.health -= ghost.config.damage;
        this.health = Math.max(0, this.health);
        ghost.sprite.destroy(); (ghost.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined)?.destroy();
        this.ghosts = this.ghosts.filter((g) => g !== ghost);
        this.game.events.emit('toast', `ผีผ่านฐาน! พลังชีวิตเหลือ ${this.health}`);
        this.pushStats();
        return;
      }
    }
    const hpBar = ghost.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined;
    if (hpBar) { hpBar.clear(); hpBar.fillStyle(0x2a2030).fillRoundedRect(ghost.x - 20, ghost.y - 27, 40, 5, 2); hpBar.fillStyle(0xf27683).fillRoundedRect(ghost.x - 20, ghost.y - 27, 40 * Math.max(0, ghost.hp) / ghost.config.hp, 5, 2); }
  }

  private updateProjectiles(delta: number): void {
    for (const bullet of [...this.projectiles]) {
      if (!bullet.target.sprite.active || !this.ghosts.includes(bullet.target)) {
        bullet.circle.destroy(); this.projectiles = this.projectiles.filter((p) => p !== bullet); continue;
      }
      const dx = bullet.target.x - bullet.x; const dy = bullet.target.y - bullet.y;
      const distance = Math.hypot(dx, dy); const step = bullet.speed * delta / 1000;
      if (distance <= step + 14) {
        if (bullet.splash > 0) {
          for (const target of [...this.ghosts]) if (target.row === bullet.target.row && Math.abs(target.x - bullet.target.x) < bullet.splash) this.damageGhost(target, bullet.damage);
        } else this.damageGhost(bullet.target, bullet.damage);
        if (bullet.slowMs) bullet.target.slowUntil = this.time.now + bullet.slowMs;
        bullet.circle.destroy(); this.projectiles = this.projectiles.filter((p) => p !== bullet);
      } else {
        bullet.x += dx / distance * step; bullet.y += dy / distance * step; bullet.circle.setPosition(bullet.x, bullet.y);
      }
    }
  }

  private damageGhost(ghost: GhostUnit, damage: number): void {
    if (!this.ghosts.includes(ghost)) return;
    ghost.hp -= damage;
    ghost.sprite.setScale(1.12); this.time.delayedCall(80, () => ghost.sprite.active && ghost.sprite.setScale(1));
    if (ghost.hp <= 0) {
      this.kills += 1; this.score += ghost.config.reward;
      ghost.sprite.destroy(); (ghost.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined)?.destroy();
      this.ghosts = this.ghosts.filter((g) => g !== ghost);
      this.pushStats();
    }
  }

  private applyAnswer(data: { correct: boolean; reward: number; streakEvery: number; streakBonus: number }): void {
    if (this.status !== 'playing') return;
    if (data.correct) {
      this.streak += 1;
      const bonus = data.streakEvery > 0 && this.streak % data.streakEvery === 0 ? data.streakBonus : 0;
      this.mana += data.reward + bonus; this.score += 10;
      this.game.events.emit('toast', `ตอบถูก! +${data.reward + bonus} พลังอาคม${bonus ? ' (โบนัสตอบต่อเนื่อง)' : ''}`);
    } else {
      this.streak = 0;
      this.game.events.emit('toast', 'ยังไม่ถูกนะ ลองอ่านเฉลยแล้วสู้ต่อได้เลย');
    }
    this.pushStats();
  }

  private resetGame(stage: number): void {
    for (const p of this.plants) { const ring = p.sprite.getData('ring') as Phaser.GameObjects.Graphics | undefined; ring?.destroy(); p.sprite.destroy(); }
    for (const g of this.ghosts) { g.sprite.destroy(); (g.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined)?.destroy(); }
    for (const p of this.projectiles) p.circle.destroy();
    this.plants = []; this.ghosts = []; this.projectiles = [];
    this.stage = Math.max(1, Math.min(3, stage));
    this.mana = this.gameSettings.startingMana; this.health = this.gameSettings.baseHealth; this.score = 0; this.kills = 0; this.spawned = 0; this.streak = 0;
    this.spawnElapsed = 0; this.status = 'playing'; this.selectedPlant = 'lotus';
    this.pushStats();
  }

  private endGame(won: boolean): void {
    if (this.status !== 'playing') return;
    this.status = won ? 'won' : 'lost';
    const stats = this.getStats();
    this.game.events.emit('game-ended', { won, stats });
    this.pushStats();
  }

  private targetEnemies(): number {
    const scale = this.stage === 1 ? 0.72 : this.stage === 2 ? 1 : 1.28;
    return Math.max(5, Math.round(this.gameSettings.maxEnemies * scale));
  }

  private getStats(): GameStats {
    const config = STAGES.find((s) => s.id === this.stage) ?? STAGES[0];
    return { mana: this.mana, health: this.health, score: this.score, kills: this.kills, spawned: this.spawned, target: this.targetEnemies(), streak: this.streak, stageName: config.name, status: this.status };
  }

  private pushStats(): void {
    const stats = this.getStats();
    this.uiTexts.get('mana')?.setText(`☀ ${stats.mana}`);
    this.uiTexts.get('health')?.setText(`❤ ${stats.health}/${this.gameSettings.baseHealth}`);
    this.uiTexts.get('score')?.setText(`★ ${stats.score}`);
    this.uiTexts.get('wave')?.setText(`ผี ${stats.spawned}/${stats.target}`);
    this.game.events.emit('stats-changed', stats);
  }

  private refreshUi(): void {
    this.game.events.emit('plant-selected', this.selectedPlant);
  }
}

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_SETTINGS.canvasWidth,
    height: GAME_SETTINGS.canvasHeight,
    backgroundColor: '#0d1731',
    render: { antialias: true, pixelArt: false, roundPixels: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_SETTINGS.canvasWidth, height: GAME_SETTINGS.canvasHeight },
    input: { activePointers: 3, touch: { capture: true } },
    scene: [GameScene],
  });
}
