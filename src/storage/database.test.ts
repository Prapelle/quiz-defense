import { describe, expect, it } from 'vitest';
import {
  importQuestionPackage, packageQuestions, resetProgress, validateQuestionPackage,
} from './database';
import type { GameSave, QuestionSet, QuizQuestion } from '../types';
import { DEFAULT_QUESTIONS, DEFAULT_SETS, DEFAULT_SET_ID } from '../data/defaultQuestions';
import { GAME_SETTINGS } from '../game/config';

const fixtureSet: QuestionSet = {
  id: 'external-set', name: 'ชุดภายนอก', description: 'fixture', subject: 'คณิตศาสตร์',
  updatedAt: '2026-10-26T00:00:00.000Z', questionIds: ['external-q'],
};
const fixtureQuestion: QuizQuestion = {
  id: 'external-q', setId: 'external-set', question: '2 + 3 ได้เท่าไร?',
  choices: ['4', '5', '6', '7'], answerIndex: 1, explanation: '2 + 3 = 5',
  subject: 'คณิตศาสตร์', grade: 'ป.2', difficulty: 'ง่าย',
};
const packageFixture = () => packageQuestions([{ ...fixtureSet, questionIds: [fixtureQuestion.id] }], [fixtureQuestion]);
const saveFixture = (): GameSave => ({
  questions: [...DEFAULT_QUESTIONS], sets: [...DEFAULT_SETS], activeSetId: DEFAULT_SET_ID,
  progress: { score: 120, unlockedStage: 2, starsByStage: { '1': 3 }, gamesPlayed: 4, correctAnswers: 12, answeredQuestions: 16 },
  settings: {
    rewardCorrect: GAME_SETTINGS.rewardCorrect, startingMana: GAME_SETTINGS.startingMana,
    baseHealth: GAME_SETTINGS.baseHealth, questionStreakBonus: GAME_SETTINGS.questionStreakBonus,
    questionStreakEvery: GAME_SETTINGS.questionStreakEvery, enemySpawnMs: GAME_SETTINGS.enemySpawnMs,
    maxEnemies: GAME_SETTINGS.maxEnemies, questionCooldownMs: GAME_SETTINGS.questionCooldownMs,
  },
  updatedAt: '2026-10-26T00:00:00.000Z',
});

describe('question package validation', () => {
  it('accepts an exported package and preserves question content', () => {
    const parsed = validateQuestionPackage(packageFixture());
    expect(parsed.app).toBe('quiz-defense');
    expect(parsed.sets[0].id).toBe(fixtureSet.id);
    expect(parsed.questions[0].question).toBe(fixtureQuestion.question);
  });

  it('rejects unknown schema versions, repeated IDs and missing sets', () => {
    expect(() => validateQuestionPackage({ app: 'wrong-app', schemaVersion: 1, sets: [], questions: [] })).toThrow(/ไม่รู้จักรูปแบบไฟล์/);
    const duplicate = packageFixture();
    duplicate.questions.push({ ...fixtureQuestion });
    expect(() => validateQuestionPackage(duplicate)).toThrow(/รหัสคำถามซ้ำ/);
    const missingSet = packageFixture();
    missingSet.questions[0].setId = 'missing-set';
    expect(() => validateQuestionPackage(missingSet)).toThrow(/ชุดคำถามที่ไม่มีอยู่/);
  });

  it('rejects malformed four-choice questions', () => {
    const pkg = packageFixture();
    pkg.questions[0].choices = ['only one'] as unknown as QuizQuestion['choices'];
    expect(() => validateQuestionPackage(pkg)).toThrow(/ตัวเลือกครบ 4 ข้อ/);
  });
});

describe('question package import', () => {
  it('adds imported sets with remapped IDs without overwriting existing questions', () => {
    const current = saveFixture();
    const next = importQuestionPackage(current, packageFixture(), 'add');
    expect(next.questions).toHaveLength(current.questions.length + 1);
    expect(next.sets).toHaveLength(current.sets.length + 1);
    expect(next.activeSetId).not.toBe(fixtureSet.id);
    expect(next.questions.at(-1)?.setId).toBe(next.activeSetId);
    expect(current.questions).toHaveLength(DEFAULT_QUESTIONS.length);
  });

  it('replaces only question collections while preserving progress and settings', () => {
    const current = saveFixture();
    const next = importQuestionPackage(current, packageFixture(), 'replace');
    expect(next.sets.map((s) => s.id)).toEqual([fixtureSet.id]);
    expect(next.questions.map((q) => q.id)).toEqual([fixtureQuestion.id]);
    expect(next.progress).toBe(current.progress);
    expect(next.settings).toBe(current.settings);
  });

  it('does not allow replacing with an empty package', () => {
    const current = saveFixture();
    expect(() => importQuestionPackage(current, packageQuestions([], []), 'replace')).toThrow(/ไม่มีชุดคำถาม/);
  });
});

describe('resetProgress', () => {
  it('clears score, stars and completion counters while leaving the original untouched', () => {
    const current = saveFixture().progress;
    const reset = resetProgress(current);
    expect(reset).toEqual({ score: 0, unlockedStage: 1, starsByStage: {}, gamesPlayed: 0, correctAnswers: 0, answeredQuestions: 0 });
    expect(current.score).toBe(120);
  });
});
