import { describe, expect, it } from 'vitest';
import {
  importQuestionPackage, migrateGameSettings, normalizeSave, packageQuestions, resetProgress, validateQuestionPackage,
} from './database';
import type { GameSave, QuestionSet, QuizQuestion } from '../types';
import { DEFAULT_QUESTIONS, DEFAULT_SETS, DEFAULT_SET_ID } from '../data/defaultQuestions';
import { GRADE2_QUESTIONS, GRADE2_SET, GRADE2_SET_ID } from '../data/grade2Questions';
import { GAME_SETTINGS } from '../game/config';
import { freshProgress } from '../game/progress';

const fixtureSet: QuestionSet = {
  id: 'external-set', name: 'ชุดภายนอก', description: 'fixture', subject: 'คณิตศาสตร์',
  updatedAt: '2026-10-26T00:00:00.000Z', questionIds: ['external-q'],
};
const fixtureQuestion: QuizQuestion = {
  id: 'external-q', setId: 'external-set', question: '2 + 3 ได้เท่าไร?',
  choices: ['4', '5', '6', '7'], answerIndex: 1, explanation: '2 + 3 = 5',
  subject: 'คณิตศาสตร์', grade: 'ป.2', difficulty: 'ง่าย',
};
// Clone nested arrays so malformed-input tests never mutate the shared fixture.
const packageFixture = () => packageQuestions(
  [{ ...fixtureSet, questionIds: [...fixtureSet.questionIds] }],
  [{ ...fixtureQuestion, choices: [...fixtureQuestion.choices] as QuizQuestion['choices'] }],
);
const saveFixture = (): GameSave => ({
  questions: [...DEFAULT_QUESTIONS], sets: [...DEFAULT_SETS], activeSetId: DEFAULT_SET_ID,
  progress: { ...freshProgress(), score: 120, unlockedStage: 2, starsByStage: { '1': 3 }, gamesPlayed: 4, correctAnswers: 12, answeredQuestions: 16 },
  settings: {
    rewardCorrect: GAME_SETTINGS.rewardCorrect, startingMana: GAME_SETTINGS.startingMana,
    baseHealth: GAME_SETTINGS.baseHealth, questionStreakBonus: GAME_SETTINGS.questionStreakBonus,
    questionStreakEvery: GAME_SETTINGS.questionStreakEvery, enemySpawnMs: GAME_SETTINGS.enemySpawnMs,
    maxEnemies: GAME_SETTINGS.maxEnemies, questionCooldownMs: GAME_SETTINGS.questionCooldownMs, soundMuted: false, musicVolume: 0.45, sfxVolume: 0.8,
  },
  updatedAt: '2026-10-26T00:00:00.000Z',
});

describe('game settings migration', () => {
  it('updates saves using the previous default starting mana to 200', () => {
    expect(migrateGameSettings({ startingMana: 150 }).startingMana).toBe(200);
    expect(migrateGameSettings({ startingMana: 150 }, 1).startingMana).toBe(200);
  });

  it('preserves a deliberate custom starting mana value', () => {
    expect(migrateGameSettings({ startingMana: 150 }, 2).startingMana).toBe(150);
    expect(migrateGameSettings({ startingMana: 250 }).startingMana).toBe(250);
    expect(migrateGameSettings({ startingMana: 0 }).startingMana).toBe(0);
  });
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
    expect(reset).toEqual(freshProgress());
    expect(current.score).toBe(120);
  });
});

describe('built-in Grade 2 question bank', () => {
  it('has 75 valid Grade 2 questions spread across subjects, levels and answer positions', () => {
    expect(GRADE2_QUESTIONS).toHaveLength(75);
    expect(new Set(GRADE2_QUESTIONS.map((q) => q.id)).size).toBe(75);
    expect(GRADE2_QUESTIONS.every((q) => q.grade === 'ป.2' && q.explanation && new Set(q.choices).size === 4)).toBe(true);
    for (const level of ['ง่าย', 'ปานกลาง', 'ยาก'] as const) expect(GRADE2_QUESTIONS.filter((q) => q.difficulty === level)).toHaveLength(25);
    for (const position of [0, 1, 2, 3]) expect(GRADE2_QUESTIONS.filter((q) => q.answerIndex === position).length).toBeGreaterThan(10);
    expect(() => validateQuestionPackage(packageQuestions([GRADE2_SET], GRADE2_QUESTIONS))).not.toThrow();
  });

  it('adds the bank to an older save once and switches it on only for starter-set players', () => {
    const old = { ...saveFixture(), contentVersion: undefined };
    const migrated = normalizeSave(old);
    expect(migrated.sets[0].id).toBe(GRADE2_SET_ID);
    expect(migrated.questions.length).toBe(old.questions.length + 75);
    expect(migrated.activeSetId).toBe(GRADE2_SET_ID);
    expect(normalizeSave(migrated).questions.length).toBe(migrated.questions.length);
    const custom = normalizeSave({ ...saveFixture(), activeSetId: 'my-set' });
    expect(custom.activeSetId).toBe('my-set');
  });
});
