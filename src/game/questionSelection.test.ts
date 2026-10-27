import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuizQuestion } from '../types';
import { difficultiesForStage, pickQuestionForStage, pickUnseenQuestion } from './questionSelection';

const makeQuestion = (id: string): QuizQuestion => ({
  id,
  setId: 'set-1',
  question: `Question ${id}`,
  choices: ['A', 'B', 'C', 'D'],
  answerIndex: 0,
  explanation: '',
  subject: 'คณิตศาสตร์',
  grade: 'ป.3',
  difficulty: 'ง่าย',
});

afterEach(() => vi.restoreAllMocks());

describe('pickUnseenQuestion', () => {
  it('does not repeat questions until the available pool has been exhausted', () => {
    const questions = [makeQuestion('q1'), makeQuestion('q2')];
    const used = new Set<string>();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(pickUnseenQuestion(questions, used)?.id).toBe('q1');
    expect(pickUnseenQuestion(questions, used)?.id).toBe('q2');
    expect(used.size).toBe(2);

    // A repeat becomes eligible only after all questions have been used.
    expect(pickUnseenQuestion(questions, used)?.id).toBe('q1');
    expect([...used]).toEqual(['q1']);
  });

  it('returns null for an empty set without changing its used IDs', () => {
    const used = new Set(['old-question']);
    expect(pickUnseenQuestion([], used)).toBeNull();
    expect([...used]).toEqual(['old-question']);
  });
});

describe('stage-based question selection', () => {
  const make = (id: string, difficulty: QuizQuestion['difficulty']): QuizQuestion => ({
    id, setId: 's', question: id, choices: ['a', 'b', 'c', 'd'], answerIndex: 0, explanation: '', subject: 'คณิตศาสตร์', grade: 'ป.2', difficulty,
  });
  const pool = [make('e1', 'ง่าย'), make('e2', 'ง่าย'), make('m1', 'ปานกลาง'), make('h1', 'ยาก')];

  it('maps stages to difficulty mixes', () => {
    expect(difficultiesForStage(1)).toEqual(['ง่าย']);
    expect(difficultiesForStage(5)).toEqual(['ง่าย', 'ปานกลาง']);
    expect(difficultiesForStage(9)).toEqual(['ปานกลาง', 'ยาก']);
  });

  it('prefers matching difficulty, then falls back to other unseen questions', () => {
    const used = new Set<string>();
    const first = [pickQuestionForStage(pool, used, 1)!.id, pickQuestionForStage(pool, used, 1)!.id].sort();
    expect(first).toEqual(['e1', 'e2']);
    expect(['m1', 'h1']).toContain(pickQuestionForStage(pool, used, 1)!.id);
  });

  it('only asks medium or hard questions on late stages while they last', () => {
    const used = new Set<string>();
    const ids = [pickQuestionForStage(pool, used, 8)!.id, pickQuestionForStage(pool, used, 8)!.id].sort();
    expect(ids).toEqual(['h1', 'm1']);
  });
});
