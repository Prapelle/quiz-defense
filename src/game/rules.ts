import { PLANTS, type PlantId } from './config';

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
  const normalizedStage = Number.isFinite(stage) ? Math.max(1, Math.min(3, Math.floor(stage))) : 1;
  const normalizedMax = Number.isFinite(maxEnemies) ? Math.max(0, Math.round(maxEnemies)) : 0;
  const scale = normalizedStage === 1 ? 0.72 : normalizedStage === 2 ? 1 : 1.28;
  return Math.max(5, Math.round(normalizedMax * scale));
}
