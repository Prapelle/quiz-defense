import Phaser from 'phaser';
import { GAME_SETTINGS, GHOSTS, BOSSES, PLANTS, STAGES, type GhostConfig, type PlantConfig, type PlantId, type GhostId, type BossConfig } from './config';
import { CHARACTER_ATLAS_DATA_URL, CHARACTER_FRAME_SIZE, CHARACTER_FRAMES } from '../data/characterAtlas';
import { resolvePlantUnlocks, resolveQuizAnswer } from './rules';
import type { GameSettings } from '../types';

export interface GameStats {
  mana: number;
  health: number;
  score: number;
  kills: number;
  spawned: number;
  target: number;
  streak: number;
  wave: number;
  totalWaves: number;
  waveWaiting: boolean;
  unlockedPlants: PlantId[];
  stageName: string;
  status: 'playing' | 'won' | 'lost';
}
interface PlantUnit { config: PlantConfig; row: number; col: number; x: number; y: number; hp: number; sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text; lastAction: number; poisonDamage: number; poisonUntil: number; poisonIntervalMs: number; nextPoisonTick: number; }
interface GhostUnit { config: GhostConfig; row: number; x: number; y: number; hp: number; sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text; baseScaleX: number; baseScaleY: number; slowUntil: number; lastAttack: number; boss?: BossConfig; bossAbilityElapsed?: number; tigerForm?: boolean; }
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
  private unlockedPlants = new Set<PlantId>(PLANTS.filter((plant) => plant.unlockAtStreak === 0).map((plant) => plant.id));
  private status: GameStats['status'] = 'playing';
  private spawnElapsed = 0;
  private waveBreakElapsed = 0;
  private currentWaveIndex = 0;
  private waveWaiting = false;
  private speedMultiplier: 1 | 2 | 3 = 1;
  private simulationTime = 0;
  private quizElapsed = 0;
  private quizReady = false;
  private quizModalOpen = false;
  private uiTexts = new Map<string, Phaser.GameObjects.Text>();
  private worldGraphics: Phaser.GameObjects.Graphics | null = null;
  private worldDecor: Phaser.GameObjects.GameObject[] = [];
  private gameSettings: GameSettings = { rewardCorrect: GAME_SETTINGS.rewardCorrect, startingMana: GAME_SETTINGS.startingMana, baseHealth: GAME_SETTINGS.baseHealth, questionStreakBonus: GAME_SETTINGS.questionStreakBonus, questionStreakEvery: GAME_SETTINGS.questionStreakEvery, enemySpawnMs: GAME_SETTINGS.enemySpawnMs, maxEnemies: GAME_SETTINGS.maxEnemies, questionCooldownMs: GAME_SETTINGS.questionCooldownMs };

  constructor() { super('GameScene'); }

  preload(): void {
    // Inline spritesheet data keeps original character artwork available in offline mode.
    this.load.spritesheet('character-atlas', CHARACTER_ATLAS_DATA_URL, {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE,
    });
  }

  create(): void {
    this.drawWorld();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleBoardTap(pointer.x, pointer.y));
    this.events.on('selected-plant', (id: PlantId) => { this.selectedPlant = id; this.refreshUi(); });
    this.events.on('reset-game', (stage: number) => this.resetGame(stage));
    this.events.on('set-game-settings', (settings: GameSettings) => { this.gameSettings = { ...this.gameSettings, ...settings }; });
    this.events.on('set-speed', (speed: 1 | 2 | 3) => { this.speedMultiplier = speed; });
    this.events.on('answer-question', (data: { correct: boolean; reward: number; streakEvery: number; streakBonus: number }) => this.applyAnswer(data));
    this.events.on('request-question', () => this.requestQuiz());
    this.events.on('quiz-unavailable', () => {
      this.quizModalOpen = false;
      this.quizReady = false;
      this.quizElapsed = 0;
    });
    this.events.on('scene-ready', () => this.pushStats());
    this.resetGame(1);
  }

  update(_time: number, delta: number): void {
    if (this.status !== 'playing') return;
    const realDelta = delta;
    const scaledDelta = realDelta * this.speedMultiplier;
    this.simulationTime += scaledDelta;
    // Quiz cooldown is wall-clock time, independent of accelerated battle speed.
    this.quizElapsed += realDelta;
    if (this.quizElapsed >= GAME_SETTINGS.questionIntervalMs && !this.quizModalOpen) {
      this.quizElapsed = 0;
      this.quizReady = true;
      this.requestQuiz();
    }
    delta = scaledDelta;
    this.spawnElapsed += delta;
    const stageConfig = STAGES.find((s) => s.id === this.stage) ?? STAGES[0];
    const waves: number[] = stageConfig.waves ?? [stageConfig.enemies];
    const targetEnemies = this.targetEnemies();
    const waveStart = waves.slice(0, this.currentWaveIndex).reduce((sum, count) => sum + count, 0);
    const waveTarget = waves[this.currentWaveIndex] ?? 0;
    const spawnedInWave = Math.max(0, this.spawned - waveStart);
    const waveComplete = spawnedInWave >= waveTarget;
    if (waveComplete && this.currentWaveIndex < waves.length - 1 && this.ghosts.length === 0) {
      this.waveWaiting = true;
      this.waveBreakElapsed += delta;
      if (this.waveBreakElapsed >= stageConfig.waveBreakMs) {
        this.waveBreakElapsed = 0;
        this.waveWaiting = false;
        this.currentWaveIndex += 1;
        this.spawnElapsed = 0;
        this.game.events.emit('toast', `Wave ${this.currentWaveIndex + 1} กำลังมา!`);
      }
    } else if (!waveComplete && !this.waveWaiting) {
      const spawnInterval = Math.max(2200, Math.round(this.gameSettings.enemySpawnMs * stageConfig.spawnMs / GAME_SETTINGS.enemySpawnMs));
      if (this.spawned < targetEnemies && this.spawnElapsed >= spawnInterval) {
        this.spawnElapsed = 0;
        if (this.spawned === targetEnemies - 1 && BOSSES.some((boss) => boss.stage === this.stage)) this.spawnBoss(BOSSES.find((boss) => boss.stage === this.stage)!);
        else this.spawnGhost(stageConfig.allowedGhosts[this.spawned % stageConfig.allowedGhosts.length]);
      }
    }
    const now = this.simulationTime;
    for (const plant of [...this.plants]) this.updatePlant(plant, now);
    for (const ghost of [...this.ghosts]) this.updateGhost(ghost, now, delta);
    this.updateProjectiles(delta);
    if (this.health <= 0) this.endGame(false);
    else if (this.spawned >= targetEnemies && this.ghosts.length === 0) this.endGame(true);
  }

  private drawWorld(): void {
    this.worldGraphics?.destroy();
    this.worldDecor.forEach((item) => item.destroy());
    this.worldDecor = [];

    const stageConfig = STAGES.find((item) => item.id === this.stage) ?? STAGES[0];
    const mapVariant = ((this.stage - 1) % 3) + 1;
    const theme = mapVariant === 1
      ? { skyA: 0x0d1731, skyB: 0x152648, skyC: 0x172a42, skyD: 0x0a1728, field: 0x1b3a35, tileA: 0x527a51, tileB: 0x466d49, tileLine: 0xa8d38c, border: 0x7c5b3b, gate: 0x2b2540, trim: 0xe3b966 }
      : mapVariant === 2
        ? { skyA: 0x09261f, skyB: 0x174b38, skyC: 0x22563a, skyD: 0x071b19, field: 0x173d2e, tileA: 0x47774a, tileB: 0x315e3c, tileLine: 0x9acb76, border: 0x37533a, gate: 0x173a2e, trim: 0xb6d875 }
        : { skyA: 0x17192f, skyB: 0x343052, skyC: 0x3d3245, skyD: 0x0e1425, field: 0x333744, tileA: 0x5b6260, tileB: 0x464d54, tileLine: 0xb3b9a1, border: 0x5b493d, gate: 0x28233b, trim: 0xe0b879 };

    const bg = this.add.graphics().setDepth(-10);
    this.worldGraphics = bg;
    bg.fillGradientStyle(theme.skyA, theme.skyB, theme.skyC, theme.skyD, 1);
    bg.fillRect(0, 0, GAME_SETTINGS.canvasWidth, GAME_SETTINGS.canvasHeight);

    // Each stage has its own landmark silhouette and atmosphere.
    if (mapVariant === 1) {
      bg.fillStyle(0xc6e5ff, 0.9); bg.fillCircle(1070, 55, 31);
      bg.fillStyle(0x0b1730, 0.4); bg.fillCircle(1082, 46, 31);
      bg.fillStyle(0x0a1327, 0.95);
      for (let i = 0; i < 8; i += 1) {
        const x = 350 + i * 110;
        bg.fillTriangle(x - 34, 115, x, 73 - (i % 3) * 8, x + 34, 115);
        bg.fillRect(x - 26, 115, 52, 27);
        bg.fillStyle(0xffcf6b, 0.18); bg.fillCircle(x, 127, 3); bg.fillStyle(0x0a1327, 0.95);
      }
    } else if (mapVariant === 2) {
      bg.fillStyle(0x071c16, 0.95);
      for (let i = 0; i < 10; i += 1) {
        const x = 230 + i * 108;
        bg.fillRoundedRect(x, 24 + (i % 3) * 10, 13, 112, 5);
        bg.fillRoundedRect(x + 17, 43 + (i % 2) * 8, 7, 83, 3);
        bg.fillStyle(0x5e9b57, 0.72);
        bg.fillTriangle(x - 25, 53 + (i % 3) * 6, x + 8, 31 + (i % 2) * 8, x + 38, 58 + (i % 2) * 5);
        bg.fillTriangle(x - 16, 76, x + 9, 56, x + 32, 84);
        bg.fillStyle(0x071c16, 0.95);
      }
      bg.fillStyle(0xa6d46a, 0.75); bg.fillCircle(1070, 55, 23);
      bg.fillStyle(theme.skyB, 1); bg.fillCircle(1080, 47, 23);
    } else {
      bg.fillStyle(0x171627, 0.98);
      for (let i = 0; i < 5; i += 1) {
        const x = 390 + i * 155;
        bg.fillTriangle(x - 60, 113, x, 60 - (i % 2) * 12, x + 60, 113);
        bg.fillRect(x - 42, 108, 84, 20);
        bg.fillStyle(0xe1b56b, 0.18); bg.fillRect(x - 24, 112, 7, 20); bg.fillRect(x + 17, 112, 7, 20);
        bg.fillStyle(0x171627, 0.98);
      }
      bg.fillStyle(0x80718a, 0.85); bg.fillCircle(1070, 55, 27);
      bg.fillStyle(theme.skyB, 1); bg.fillCircle(1080, 47, 27);
    }

    bg.fillStyle(theme.field, 1); bg.fillRect(0, 119, 1280, 430);
    for (let row = 0; row < GAME_SETTINGS.gridRows; row += 1) {
      for (let col = 0; col < GAME_SETTINGS.gridCols; col += 1) {
        const x = 158 + col * 104;
        const y = 116 + row * 83;
        const colour = (row + col) % 2 === 0 ? theme.tileA : theme.tileB;
        bg.fillStyle(colour, 0.93); bg.fillRoundedRect(x, y, 100, 79, 8);
        bg.lineStyle(1, theme.tileLine, 0.22); bg.strokeRoundedRect(x, y, 100, 79, 8);
        if (mapVariant === 2) {
          bg.fillStyle(0xb9d987, 0.13);
          bg.fillTriangle(x + 12, y + 62, x + 24, y + 44, x + 27, y + 64);
        } else if (mapVariant === 3) {
          bg.lineStyle(2, 0x161c2b, 0.16);
          bg.lineBetween(x + 15, y + 17, x + 42, y + 17);
          bg.lineBetween(x + 60, y + 55, x + 88, y + 55);
        } else {
          bg.fillStyle(0xc1dc82, 0.13); bg.fillCircle(x + 16 + ((row * 3 + col * 2) % 65), y + 17 + ((row + col) % 36), 2);
        }
      }
    }
    bg.fillStyle(theme.border, 1); bg.fillRoundedRect(20, 111, 120, 445, 12);
    bg.fillStyle(theme.gate, 1); bg.fillRoundedRect(37, 133, 86, 398, 8);
    bg.lineStyle(3, theme.trim, 0.9); bg.strokeRoundedRect(36, 132, 88, 400, 8);
    bg.fillStyle(mapVariant === 3 ? 0xc18a6e : mapVariant === 2 ? 0x90c75d : 0xffae42, 0.35); bg.fillCircle(78, 149, 35);
    bg.fillStyle(theme.trim, 1); bg.fillCircle(78, 149, 10);
    bg.fillStyle(0x101a2a, 1); bg.fillRoundedRect(23, 550, 112, 45, 10);
    bg.lineStyle(2, theme.trim, 0.8); bg.strokeRoundedRect(23, 550, 112, 45, 10);

    const baseLabels = ['หมู่บ้าน', 'ป่ากล้วย', 'วัดร้าง'];
    const baseLabel = this.add.text(79, 571, baseLabels[mapVariant - 1] ?? 'ฐานป้องกัน', {
      fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '17px', color: '#fff0c7', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    const stageTitle = this.add.text(640, 22, stageConfig.name, {
      fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '20px', color: '#f7e3b4',
      fontStyle: 'bold', stroke: '#18213a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);
    const instructions = this.add.text(640, 50, 'แตะช่องว่างเพื่อวางตัวละคร · ตอบคำถามเพื่อรับพลังอาคม', {
      fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '14px', color: '#d7e6f5',
      stroke: '#18213a', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.worldDecor.push(baseLabel, stageTitle, instructions);

    if (!this.uiTexts.has('mana')) this.makeUiText('mana', 176, 25, `☀ ${this.gameSettings.startingMana}`, '#ffdc79', '22px');
    if (!this.uiTexts.has('health')) this.makeUiText('health', 1050, 25, `❤ ${this.health}/${this.gameSettings.baseHealth}`, '#ff8292', '22px');
    if (!this.uiTexts.has('score')) this.makeUiText('score', 1150, 25, '★ 0', '#fff0b4', '18px');
    if (!this.uiTexts.has('wave')) this.makeUiText('wave', 1150, 54, 'ผี 0/10', '#deefff', '14px');
  }

  private makeUiText(key: string, x: number, y: number, value: string, color: string, fontSize: string): void {
    const text = this.add.text(x, y, value, { fontFamily: 'Tahoma, Arial, sans-serif', fontSize, color, fontStyle: 'bold', stroke: '#101a2e', strokeThickness: 4 }).setOrigin(0.5);
    text.setDepth(30);
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
    if (!this.unlockedPlants.has(this.selectedPlant)) {
      this.game.events.emit('toast', 'ตอบคำถามให้ถูกต่อเนื่องเพื่อปลดล็อกผู้พิทักษ์นี้');
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
    const hasPlantFrame = Object.prototype.hasOwnProperty.call(CHARACTER_FRAMES, config.id);
    const plantFrame = hasPlantFrame ? CHARACTER_FRAMES[config.id] : 0;
    const sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text = this.textures.exists('character-atlas') && hasPlantFrame
      ? this.add.image(px, py, 'character-atlas', plantFrame).setDisplaySize(config.id === 'ward' ? 60 : 56, 56).setDepth(5)
      : this.add.text(px, py, config.emoji, { fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif', fontSize: config.id === 'ward' ? '48px' : '42px', stroke: '#112236', strokeThickness: 2 }).setOrigin(0.5).setDepth(5);
    const ring = this.add.graphics().lineStyle(2, 0xf9d983, 0.7).strokeCircle(px, py + 6, 29).setDepth(4);
    const hpBar = this.add.graphics().setDepth(7);
    // Keep the placement ring and HP bar attached to the protector sprite.
    sprite.setData('ring', ring);
    sprite.setData('hpBar', hpBar);
    this.plants.push({ config, row, col, x: px, y: py, hp: config.hp, sprite, lastAction: this.simulationTime, poisonDamage: 0, poisonUntil: 0, poisonIntervalMs: 1000, nextPoisonTick: 0 });
    this.pushStats();
  }

  private spawnGhost(id: GhostId): void {
    const config = GHOSTS.find((ghost) => ghost.id === id) ?? GHOSTS[0];
    const row = Math.floor(Math.random() * GAME_SETTINGS.gridRows);
    const x = 1150;
    const y = 154 + row * 83;
    const hasGhostFrame = Object.prototype.hasOwnProperty.call(CHARACTER_FRAMES, id);
    const ghostFrame = hasGhostFrame ? CHARACTER_FRAMES[id as keyof typeof CHARACTER_FRAMES] : 0;
    const sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Text = this.textures.exists('character-atlas') && hasGhostFrame
      ? this.add.image(x, y, 'character-atlas', ghostFrame).setDisplaySize(config.id === 'pret' ? 62 : 56, config.id === 'pret' ? 62 : 56).setDepth(6)
      : this.add.text(x, y, config.emoji, { fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif', fontSize: `${config.size}px`, stroke: '#1c1831', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
    sprite.setData('hpBar', this.add.graphics().setDepth(7));
    this.ghosts.push({ config, row, x, y, hp: config.hp, sprite, baseScaleX: sprite.scaleX, baseScaleY: sprite.scaleY, slowUntil: 0, lastAttack: 0 });
    this.spawned += 1;
    this.pushStats();
  }

  private spawnBoss(boss: BossConfig): void {
    const row = Math.floor(Math.random() * GAME_SETTINGS.gridRows);
    const x = 1150;
    const y = 154 + row * 83;
    const sprite = this.add.text(x, y, boss.emoji, { fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif', fontSize: '58px', stroke: '#ffdf8a', strokeThickness: 5 }).setOrigin(0.5).setDepth(10);
    sprite.setData('hpBar', this.add.graphics().setDepth(11));
    sprite.setData('bossName', this.add.text(x, y - 49, boss.name, { fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '15px', color: '#ffe7a3', fontStyle: 'bold', stroke: '#20132c', strokeThickness: 4 }).setOrigin(0.5).setDepth(12));
    const config: GhostConfig = { id: 'pret', name: boss.name, emoji: boss.emoji, hp: boss.hp, speed: boss.speed, damage: boss.damage, reward: boss.reward, description: boss.description, size: 58 };
    this.ghosts.push({ config, row, x, y, hp: boss.hp, sprite, baseScaleX: sprite.scaleX, baseScaleY: sprite.scaleY, slowUntil: 0, lastAttack: 0, boss, bossAbilityElapsed: 0, tigerForm: false });
    this.spawned += 1;
    this.game.events.emit('toast', `⚠ บอสปรากฏตัว: ${boss.name}!`);
    this.cameras.main.shake(350, 0.006);
    this.pushStats();
  }

  private updatePlant(plant: PlantUnit, now: number): void {
    if (plant.poisonUntil > now && plant.poisonDamage > 0 && now >= plant.nextPoisonTick) {
      plant.nextPoisonTick = now + plant.poisonIntervalMs;
      this.damagePlant(plant, plant.poisonDamage);
      if (!this.plants.includes(plant)) return;
    } else if (plant.poisonUntil <= now) {
      plant.poisonDamage = 0;
    }

    const hpBar = plant.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined;
    if (hpBar) {
      const ratio = Math.max(0, Math.min(1, plant.hp / plant.config.hp));
      const colour = ratio > 0.55 ? 0x69da9d : ratio > 0.25 ? 0xffcf65 : 0xf27683;
      hpBar.clear();
      hpBar.fillStyle(0x17202c, 0.95).fillRoundedRect(plant.x - 20, plant.y - 34, 40, 5, 2);
      hpBar.fillStyle(colour, 1).fillRoundedRect(plant.x - 20, plant.y - 34, 40 * ratio, 5, 2);
    }
    if (plant.config.manaEveryMs && now - plant.lastAction >= plant.config.manaEveryMs) {
      plant.lastAction = now;
      const manaGain = plant.config.manaGain ?? 0;
      this.mana += manaGain;
      this.game.events.emit('toast', `กุมารวิญญาณสร้างพลังอาคม +${manaGain}`);
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
    if (ghost.boss) this.updateBossAbility(ghost, delta);
    const hpRatio = ghost.hp / ghost.config.hp;
    const enraged = Boolean(ghost.config.enrageBelowHpRatio && hpRatio <= ghost.config.enrageBelowHpRatio);
    const damageMultiplier = enraged ? ghost.config.enrageDamageMultiplier ?? 1 : 1;
    const auraMultiplier = this.ghosts.reduce((best, other) => {
      if (other === ghost || !other.config.speedAuraRadius) return best;
      const distance = Math.hypot(other.x - ghost.x, other.y - ghost.y);
      if (distance <= other.config.speedAuraRadius) return Math.max(best, other.config.speedAuraMultiplier ?? 1.25);
      return best;
    }, 1);
    const blocker = this.plants.find((p) => p.row === ghost.row && Math.abs(p.x - ghost.x) < 30 && (!ghost.config.flying || p.config.id !== 'ward'));
    if (blocker) {
      if (now - ghost.lastAttack > 920) {
        ghost.lastAttack = now;
        this.damagePlant(blocker, Math.max(1, Math.round(ghost.config.damage * damageMultiplier)));
        if (this.plants.includes(blocker) && ghost.config.poisonDamage) {
          const wasUnpoisoned = blocker.poisonUntil <= now;
          blocker.poisonDamage = wasUnpoisoned ? ghost.config.poisonDamage : Math.max(blocker.poisonDamage, ghost.config.poisonDamage);
          blocker.poisonIntervalMs = ghost.config.poisonIntervalMs ?? 1000;
          blocker.poisonUntil = Math.max(blocker.poisonUntil, now + (ghost.config.poisonDurationMs ?? 3000));
          if (wasUnpoisoned) {
            blocker.nextPoisonTick = now + blocker.poisonIntervalMs;
            this.game.events.emit('toast', 'ผู้พิทักษ์ติดพิษจากผีโพง!');
          }
        }
      }
    } else {
      const slowFactor = ghost.slowUntil > now ? 0.43 : 1;
      const enrageSpeed = enraged ? ghost.config.enrageSpeedMultiplier ?? 1 : 1;
      ghost.x -= ghost.config.speed * auraMultiplier * enrageSpeed * slowFactor * delta / 1000;
      ghost.sprite.setX(ghost.x);
      if (ghost.x < 80) {
        this.health -= Math.max(1, Math.round(ghost.config.damage * damageMultiplier));
        this.health = Math.max(0, this.health);
        const hpBar = ghost.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined;
        hpBar?.destroy();
        (ghost.sprite.getData('bossName') as Phaser.GameObjects.Text | undefined)?.destroy();
        ghost.sprite.destroy();
        this.ghosts = this.ghosts.filter((g) => g !== ghost);
        this.game.events.emit('toast', `ผีผ่านฐาน! พลังชีวิตเหลือ ${this.health}`);
        this.pushStats();
        return;
      }
    }
    const hpBar = ghost.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined;
    if (hpBar) { const width = ghost.boss ? 110 : 40; const height = ghost.boss ? 9 : 5; const barY = ghost.y - (ghost.boss ? 42 : 27); hpBar.clear(); hpBar.fillStyle(0x2a2030).fillRoundedRect(ghost.x - width / 2, barY, width, height, 3); hpBar.fillStyle(ghost.boss ? 0xffbd55 : 0xf27683).fillRoundedRect(ghost.x - width / 2, barY, width * Math.max(0, ghost.hp) / ghost.config.hp, height, 3); }
    (ghost.sprite.getData('bossName') as Phaser.GameObjects.Text | undefined)?.setPosition(ghost.x, ghost.y - 59);
  }

  private updateBossAbility(ghost: GhostUnit, delta: number): void {
    ghost.bossAbilityElapsed = (ghost.bossAbilityElapsed ?? 0) + delta;
    if (ghost.boss?.ability === 'waterSurge' && ghost.bossAbilityElapsed >= 3200) {
      ghost.bossAbilityElapsed = 0;
      const pulse = this.add.circle(640, 330, 30, 0x45c9ff, 0.18).setStrokeStyle(5, 0x8ce8ff, 0.85).setDepth(15);
      this.tweens.add({ targets: pulse, scaleX: 19, scaleY: 8, alpha: 0, duration: 650, onComplete: () => pulse.destroy() });
      for (const plant of [...this.plants]) this.damagePlant(plant, ghost.boss.stage === 6 ? 14 : 7);
      this.game.events.emit('toast', ghost.boss.stage === 6 ? '🌊 ผีพรายปล่อยคลื่นน้ำโจมตีผู้พิทักษ์ทั่วแผนที่!' : '💃 นางรำปล่อยคลื่นอาคมทั่วสนาม!');
    }

  }

  private damagePlant(plant: PlantUnit, damage: number): void {
    if (!this.plants.includes(plant)) return;
    plant.hp -= damage;
    plant.sprite.setAlpha(0.62);
    this.time.delayedCall(100, () => { if (plant.sprite.active) plant.sprite.setAlpha(1); });
    if (plant.hp <= 0) this.removePlant(plant);
  }

  private removePlant(plant: PlantUnit): void {
    const ring = plant.sprite.getData('ring') as Phaser.GameObjects.Graphics | undefined;
    const hpBar = plant.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined;
    ring?.destroy(); hpBar?.destroy(); plant.sprite.destroy();
    this.plants = this.plants.filter((item) => item !== plant);
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
        if (bullet.slowMs) bullet.target.slowUntil = this.simulationTime + bullet.slowMs;
        bullet.circle.destroy(); this.projectiles = this.projectiles.filter((p) => p !== bullet);
      } else {
        bullet.x += dx / distance * step; bullet.y += dy / distance * step; bullet.circle.setPosition(bullet.x, bullet.y);
      }
    }
  }

  private damageGhost(ghost: GhostUnit, damage: number): void {
    if (!this.ghosts.includes(ghost)) return;
    const reduction = Math.min(0.8, Math.max(0, ghost.config.damageReduction ?? 0));
    ghost.hp -= Math.max(1, Math.round(damage * (1 - reduction)));
    ghost.sprite.setScale(ghost.baseScaleX * 1.12, ghost.baseScaleY * 1.12); this.time.delayedCall(80, () => { if (ghost.sprite.active) ghost.sprite.setScale(ghost.baseScaleX, ghost.baseScaleY); });
    if (ghost.hp <= 0 && ghost.boss?.ability === 'tigerShift' && !ghost.tigerForm) {
      ghost.tigerForm = true;
      ghost.hp = Math.round((ghost.boss.hp || 2200) * 0.75);
      ghost.config.hp = ghost.hp;
      ghost.config.speed = 18;
      ghost.config.damage = 42;
      const tigerSprite = ghost.sprite as Phaser.GameObjects.Text;
      tigerSprite.setText('🐅');
      tigerSprite.setFontSize('68px');
      this.cameras.main.shake(500, 0.009);
      this.game.events.emit('toast', '🐅 ผีสมิงฟื้นคืนชีพเป็นร่างเสือ! กำจัดร่างเสือเพื่อชนะบอส');
      for (let i = 0; i < 2; i += 1) {
        const row = (ghost.row + i + 1) % GAME_SETTINGS.gridRows;
        const x = Math.min(1125, ghost.x + 35 + i * 24);
        const y = 154 + row * 83;
        const minionSprite = this.add.text(x, y, '🐅', { fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif', fontSize: '30px', stroke: '#38251b', strokeThickness: 3 }).setOrigin(0.5).setDepth(6);
        const minionConfig: GhostConfig = { id: 'kongkoi', name: 'เสือบริวาร', emoji: '🐅', hp: 95, speed: 23, damage: 9, reward: 0, description: 'เสือบริวารที่ผีสมิงเรียกมา', size: 30 };
        this.ghosts.push({ config: minionConfig, row, x, y, hp: minionConfig.hp, sprite: minionSprite, baseScaleX: minionSprite.scaleX, baseScaleY: minionSprite.scaleY, slowUntil: 0, lastAttack: 0 });
      }
      return;
    }
    if (ghost.hp <= 0) {
      if (ghost.config.deathBurstDamage && ghost.config.deathBurstRadius) {
        const radius = ghost.config.deathBurstRadius;
        const burst = this.add.circle(ghost.x, ghost.y, 14, 0xff8c55, 0.45).setStrokeStyle(3, 0xffcf8c).setDepth(9);
        this.tweens.add({ targets: burst, scaleX: radius / 14, scaleY: radius / 14, alpha: 0, duration: 240, onComplete: () => burst.destroy() });
        const nearby = this.plants.filter((plant) => Math.hypot(plant.x - ghost.x, plant.y - ghost.y) <= radius);
        for (const plant of nearby) this.damagePlant(plant, ghost.config.deathBurstDamage);
        if (nearby.length) this.game.events.emit('toast', 'ผีตายโหงระเบิด! ผู้พิทักษ์ใกล้เคียงได้รับความเสียหาย');
      }
      this.kills += 1; this.score += ghost.config.reward;
      this.mana += GAME_SETTINGS.killManaReward;
      this.game.events.emit('toast', `กำจัดผีได้ +${GAME_SETTINGS.killManaReward} พลังอาคม`);
      const hpBar = ghost.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined;
      hpBar?.destroy(); ghost.sprite.destroy();
      this.ghosts = this.ghosts.filter((g) => g !== ghost);
      this.pushStats();
    }
  }

  private requestQuiz(): void {
    if (this.status !== 'playing' || this.quizModalOpen) return;
    if (!this.quizReady) {
      this.game.events.emit('toast', `คำถามถัดไปจะมาใน ${Math.max(1, Math.ceil((GAME_SETTINGS.questionIntervalMs - this.quizElapsed) / 1000))} วินาที`);
      return;
    }
    this.quizModalOpen = true;
    this.game.events.emit('quiz-requested');
  }

  private applyAnswer(data: { correct: boolean; reward: number; streakEvery: number; streakBonus: number }): void {
    if (this.status !== 'playing') return;
    this.quizReady = false;
    this.quizModalOpen = false;
    this.quizElapsed = 0;
    const resolution = resolveQuizAnswer(data.correct, this.streak, data.reward, data.streakEvery, data.streakBonus);
    this.streak = resolution.nextStreak;
    if (data.correct) {
      const unlocks = resolvePlantUnlocks(this.streak, [...this.unlockedPlants]);
      this.unlockedPlants = new Set(unlocks.unlockedPlants);
      if (unlocks.newlyUnlocked.length) {
        const names = unlocks.newlyUnlocked.map((id) => PLANTS.find((plant) => plant.id === id)?.name ?? id);
        this.game.events.emit('toast', `ปลดล็อกแล้ว: ${names.join('、')}!`);
      }
      this.mana += resolution.manaReward;
      this.score += resolution.scoreReward;
      this.game.events.emit('toast', `ตอบถูก! +${resolution.manaReward} พลังอาคม${resolution.bonus ? ' (โบนัสตอบต่อเนื่อง)' : ''}`);
    } else {
      this.game.events.emit('toast', 'ยังไม่ถูกนะ ลองอ่านเฉลยแล้วสู้ต่อได้เลย');
    }
    this.pushStats();
  }

  private resetGame(stage: number): void {
    for (const p of this.plants) { const ring = p.sprite.getData('ring') as Phaser.GameObjects.Graphics | undefined; const hpBar = p.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined; ring?.destroy(); hpBar?.destroy(); p.sprite.destroy(); }
    for (const g of this.ghosts) { g.sprite.destroy(); (g.sprite.getData('hpBar') as Phaser.GameObjects.Graphics | undefined)?.destroy(); (g.sprite.getData('bossName') as Phaser.GameObjects.Text | undefined)?.destroy(); }
    for (const p of this.projectiles) p.circle.destroy();
    this.plants = []; this.ghosts = []; this.projectiles = [];
    this.stage = Math.max(1, Math.min(STAGES.length, Math.floor(stage)));
    this.drawWorld();
    this.mana = this.gameSettings.startingMana; this.health = this.gameSettings.baseHealth; this.score = 0; this.kills = 0; this.spawned = 0; this.streak = 0;
    this.spawnElapsed = 0; this.waveBreakElapsed = 0; this.currentWaveIndex = 0; this.waveWaiting = false; this.status = 'playing'; this.selectedPlant = 'lotus';
    this.speedMultiplier = 1; this.simulationTime = 0; this.quizElapsed = 0; this.quizReady = false; this.quizModalOpen = false;
    this.unlockedPlants = new Set(PLANTS.filter((plant) => plant.unlockAtStreak === 0).map((plant) => plant.id));
    this.pushStats();
  }

  private endGame(won: boolean): void {
    if (this.status !== 'playing') return;
    this.status = won ? 'won' : 'lost';
    const stats = this.getStats();
    this.game.events.emit('game-ended', { won, stats });
    this.pushStats();
  }

  private waveIndex(): number {
    return this.currentWaveIndex;
  }

  private targetEnemies(): number {
    const stageConfig = STAGES.find((item) => item.id === this.stage) ?? STAGES[0];
    return stageConfig.enemies;
  }

  private getStats(): GameStats {
    const config = STAGES.find((s) => s.id === this.stage) ?? STAGES[0];
    return { mana: this.mana, health: this.health, score: this.score, kills: this.kills, spawned: this.spawned, target: this.targetEnemies(), streak: this.streak, wave: this.waveIndex() + 1, totalWaves: (STAGES.find((s) => s.id === this.stage)?.waves ?? [this.targetEnemies()]).length, waveWaiting: this.waveWaiting, unlockedPlants: [...this.unlockedPlants], stageName: config.name, status: this.status };
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
