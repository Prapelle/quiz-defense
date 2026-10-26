import { describe, expect, it } from 'vitest';
import { resolveQuizAnswer, targetEnemiesForStage } from './rules';

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
  it('scales enemy counts for the three configured stages', () => {
    expect(targetEnemiesForStage(1, 14)).toBe(10);
    expect(targetEnemiesForStage(2, 14)).toBe(14);
    expect(targetEnemiesForStage(3, 14)).toBe(18);
  });

  it('clamps unsupported stage values and keeps a minimum wave size', () => {
    expect(targetEnemiesForStage(100, 14)).toBe(18);
    expect(targetEnemiesForStage(-2, 14)).toBe(10);
    expect(targetEnemiesForStage(2, 0)).toBe(5);
  });
});
