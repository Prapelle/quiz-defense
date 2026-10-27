import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, applyAnswerProgress, applyBattleProgress, awardAchievements, freshProgress, knowledgePointsFor, weakestSubject } from './progress';

describe('knowledge score and subject stats', () => {
  it('gives 10 points per correct answer plus a capped streak bonus', () => {
    expect(knowledgePointsFor(false, 0)).toBe(0);
    expect(knowledgePointsFor(true, 1)).toBe(10);
    expect(knowledgePointsFor(true, 3)).toBe(14);
    expect(knowledgePointsFor(true, 20)).toBe(20);
  });

  it('tracks per-subject accuracy and best streak', () => {
    let p = freshProgress();
    p = applyAnswerProgress(p, 'คณิตศาสตร์', true, 1);
    p = applyAnswerProgress(p, 'คณิตศาสตร์', true, 2);
    p = applyAnswerProgress(p, 'ภาษาไทย', false, 0);
    expect(p.subjectStats['คณิตศาสตร์']).toEqual({ answered: 2, correct: 2 });
    expect(p.subjectStats['ภาษาไทย']).toEqual({ answered: 1, correct: 0 });
    expect(p.bestStreak).toBe(2);
    expect(p.knowledgeScore).toBe(22);
    expect(p.answeredQuestions).toBe(3);
  });

  it('names the weakest subject only once it has enough answers and is below 80%', () => {
    let p = freshProgress();
    for (let i = 0; i < 4; i += 1) p = applyAnswerProgress(p, 'วิทยาศาสตร์', i === 0, i === 0 ? 1 : 0);
    for (let i = 0; i < 4; i += 1) p = applyAnswerProgress(p, 'คณิตศาสตร์', true, i + 1);
    expect(weakestSubject(p)).toBe('วิทยาศาสตร์');
    expect(weakestSubject(freshProgress())).toBeNull();
  });
});

describe('battle progress and achievements', () => {
  it('records best stats per stage without lowering them', () => {
    let p = applyBattleProgress(freshProgress(), { stage: 1, won: true, score: 120, kills: 9, health: 4, stars: 3, totalStages: 9 });
    p = applyBattleProgress(p, { stage: 1, won: false, score: 60, kills: 4, health: 0, stars: 0, totalStages: 9 });
    expect(p.bestByStage['1']).toEqual({ bestScore: 120, bestKills: 9, bestHealth: 4, plays: 2, wins: 1 });
    expect(p.starsByStage['1']).toBe(3);
    expect(p.unlockedStage).toBe(2);
    expect(p.wins).toBe(1);
    expect(p.gamesPlayed).toBe(2);
  });

  it('awards each achievement once', () => {
    const won = applyBattleProgress(freshProgress(), { stage: 3, won: true, score: 300, kills: 20, health: 5, stars: 3, totalStages: 9 });
    const first = awardAchievements(won);
    expect(first.unlocked.map((a) => a.id)).toEqual(['first-win', 'boss-3', 'three-stars']);
    expect(awardAchievements(first.progress).unlocked).toHaveLength(0);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
});
