import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QuizQuestion } from '../types';
import { pickUnseenQuestion } from './questionSelection';

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
