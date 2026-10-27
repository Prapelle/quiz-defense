import { GHOST_ABILITY, PLANTS, type GhostAbility, type PlantId } from './config';

export interface PlantUnlockResolution {
  unlockedPlants: PlantId[];
  newlyUnlocked: PlantId[];
}

/** Unlock plants once the player reaches the required correct-answer streak. */
export function resolvePlantUnlocks(streak: number, alreadyUnlocked: PlantId[]): PlantUnlockResolution {
  const unlocked = new Set(alreadyUnlocked);
  const newlyUnlocked = PLANTS
    .filter((plant) => plant.unlockAtStreak > 0 && plant.unlockAtStreak <= Math.max(0, Math.floor(streak)) && !unlocked.has(plant.id))
    .map((plant) => plant.id);
  newlyUnlocked.forEach((id) => unlocked.add(id));
  return { unlockedPlants: [...unlocked], newlyUnlocked };
}

export interface AnswerResolution {
  nextStreak: number;
  manaReward: number;
  bonus: number;
  scoreReward: number;
}

/** Pure rules for quiz rewards, shared by gameplay and automated tests. */
export function resolveQuizAnswer(
  correct: boolean,
  currentStreak: number,
  rewardCorrect: number,
  streakEvery: number,
  streakBonus: number,
): AnswerResolution {
  if (!correct) return { nextStreak: 0, manaReward: 0, bonus: 0, scoreReward: 0 };
  const nextStreak = Math.max(0, Math.floor(currentStreak)) + 1;
  const validInterval = Number.isFinite(streakEvery) && streakEvery > 0;
  const bonus = validInterval && nextStreak % streakEvery === 0 ? Math.max(0, streakBonus) : 0;
  return {
    nextStreak,
    manaReward: Math.max(0, rewardCorrect) + bonus,
    bonus,
    scoreReward: 10,
  };
}

/** Enemy count scales with stage while retaining a safe minimum wave size. */
export function targetEnemiesForStage(stage: number, maxEnemies: number): number {
  const normalizedStage = Number.isFinite(stage) ? Math.max(1, Math.min(9, Math.floor(stage))) : 1;
  const normalizedMax = Number.isFinite(maxEnemies) ? Math.max(0, Math.round(maxEnemies)) : 0;
  // Nine-stage campaign: 10 enemies at stage 1, then +5 each stage.
  const campaignCount = 10 + (normalizedStage - 1) * 5;
  return normalizedMax <= 0 ? 5 : campaignCount;
}

export interface WaveProgress {
  waveIndex: number;
  spawnedInWave: number;
  totalSpawned: number;
  waitingForNextWave: boolean;
}

/** Compute wave position from the number of enemies already spawned. */
export function resolveWaveProgress(waves: number[], totalSpawned: number, waitingForNextWave: boolean): WaveProgress {
  const safeWaves = waves.map((count) => Math.max(0, Math.floor(Number.isFinite(count) ? count : 0)));
  const total = safeWaves.reduce((sum, count) => sum + count, 0);
  const safeTotalSpawned = Math.max(0, Math.min(total, Math.floor(Number.isFinite(totalSpawned) ? totalSpawned : 0)));
  let remaining = safeTotalSpawned;
  let waveIndex = Math.max(0, safeWaves.length - 1);
  let spawnedInWave = 0;

  for (let i = 0; i < safeWaves.length; i += 1) {
    if (remaining < safeWaves[i]) {
      waveIndex = i;
      spawnedInWave = remaining;
      break;
    }
    remaining -= safeWaves[i];
    if (i === safeWaves.length - 1) {
      waveIndex = i;
      spawnedInWave = safeWaves[i];
    }
  }

  return {
    waveIndex,
    spawnedInWave,
    totalSpawned: safeTotalSpawned,
    waitingForNextWave: waitingForNextWave && safeWaves.length > 0 && safeTotalSpawned < total && spawnedInWave >= safeWaves[waveIndex],
  };
}

/** Camouflaged Tanian and vanished Phrong cannot be targeted or damaged. */
export function isGhostUntargetable(ability: GhostAbility | undefined, abilityUntil: number, now: number): boolean {
  return (ability === 'camouflage' || ability === 'vanish') && abilityUntil > now;
}

/** Damage after Khomot's smoke form reduction (always at least 1). */
export function smokeDamage(damage: number, smoking: boolean): number {
  const reduction = smoking ? GHOST_ABILITY.smokeDamageReduction : 0;
  return Math.max(1, Math.round(damage * (1 - reduction)));
}

/** A ghost that reaches the base costs one life (two for a boss), matching "times a ghost may pass the base". */
export function baseDamageForLeak(isBoss: boolean): number {
  return isBoss ? 2 : 1;
}

/** Stars from the share of base health left: ≥80% → 3, ≥40% → 2, otherwise 1 (0 when lost). */
export function starsForResult(won: boolean, health: number, baseHealth: number): number {
  if (!won) return 0;
  const ratio = baseHealth > 0 ? health / baseHealth : 0;
  return ratio >= 0.8 ? 3 : ratio >= 0.4 ? 2 : 1;
}
