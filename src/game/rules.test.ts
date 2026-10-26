import { describe, expect, it } from 'vitest';
import { resolvePlantUnlocks, resolveQuizAnswer, resolveWaveProgress, targetEnemiesForStage } from './rules';

describe('resolveQuizAnswer', () => {
  it('awards energy and points for a correct answer', () => {
    expect(resolveQuizAnswer(true, 0, 25, 3, 10)).toEqual({
      nextStreak: 1, manaReward: 25, bonus: 0, scoreReward: 10,
    });
  });

  it('adds the streak bonus only on every third correct answer', () => {
    expect(resolveQuizAnswer(true, 1, 25, 3, 10).manaReward).toBe(25);
    expect(resolveQuizAnswer(true, 2, 25, 3, 10)).toEqual({
      nextStreak: 3, manaReward: 35, bonus: 10, scoreReward: 10,
    });
  });

  it('resets the streak and grants no reward for a wrong answer', () => {
    expect(resolveQuizAnswer(false, 2, 25, 3, 10)).toEqual({
      nextStreak: 0, manaReward: 0, bonus: 0, scoreReward: 0,
    });
  });

  it('does not award invalid or negative streak bonuses', () => {
    expect(resolveQuizAnswer(true, 2, 25, 0, 10).bonus).toBe(0);
    expect(resolveQuizAnswer(true, 2, 25, 3, -10).bonus).toBe(0);
  });
});

describe('targetEnemiesForStage', () => {
  it('scales enemy counts across all nine campaign stages', () => {
    expect(Array.from({ length: 9 }, (_, index) => targetEnemiesForStage(index + 1, 14))).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50]);
  });

  it('clamps unsupported stage values and keeps a minimum wave size', () => {
    expect(targetEnemiesForStage(100, 14)).toBe(50);
    expect(targetEnemiesForStage(-2, 14)).toBe(10);
    expect(targetEnemiesForStage(2, 0)).toBe(5);
  });
});

describe('resolvePlantUnlocks', () => {
  it('unlocks only the plants earned by a correct-answer streak', () => {
    expect(resolvePlantUnlocks(1, ['kumarn', 'lotus'])).toEqual({
      unlockedPlants: ['kumarn', 'lotus'],
      newlyUnlocked: [],
    });
    expect(resolvePlantUnlocks(2, ['kumarn', 'lotus'])).toEqual({
      unlockedPlants: ['kumarn', 'lotus', 'bindLotus'],
      newlyUnlocked: ['bindLotus'],
    });
    expect(resolvePlantUnlocks(4, ['kumarn', 'lotus', 'bindLotus', 'ward'])).toEqual({
      unlockedPlants: ['kumarn', 'lotus', 'bindLotus', 'ward', 'fireLotus'],
      newlyUnlocked: ['fireLotus'],
    });
  });

  it('does not announce an already unlocked plant twice', () => {
    expect(resolvePlantUnlocks(4, ['kumarn', 'lotus', 'bindLotus', 'ward', 'fireLotus']).newlyUnlocked).toEqual([]);
  });
});

describe('resolveWaveProgress', () => {
  it('reports the active wave and spawned count', () => {
    expect(resolveWaveProgress([3, 3, 4], 4, false)).toEqual({
      waveIndex: 1, spawnedInWave: 1, totalSpawned: 4, waitingForNextWave: false,
    });
  });

  it('caps progress at the total enemy count', () => {
    expect(resolveWaveProgress([3, 3, 4], 99, false)).toEqual({
      waveIndex: 2, spawnedInWave: 4, totalSpawned: 10, waitingForNextWave: false,
    });
  });

  it('does not mark the final wave as waiting for another wave', () => {
    expect(resolveWaveProgress([2, 2], 4, true).waitingForNextWave).toBe(false);
  });
});
