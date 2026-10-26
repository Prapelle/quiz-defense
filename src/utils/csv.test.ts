import { describe, expect, it } from 'vitest';
import { parseCsv, questionsToCsv, csvToQuestions } from './csv';
import { DEFAULT_QUESTIONS, DEFAULT_SETS } from '../data/defaultQuestions';

describe('CSV question exchange', () => {
  it('parses commas, quotes and newlines inside quoted fields', () => {
    expect(parseCsv('a,b\n"hello, world","line 1\nline 2"')).toEqual([['a', 'b'], ['hello, world', 'line 1\nline 2']]);
  });
  it('round-trips questions through CSV', () => {
    const csv = questionsToCsv(DEFAULT_SETS, DEFAULT_QUESTIONS.slice(0, 2));
    const parsed = csvToQuestions(csv);
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0].question).toBe(DEFAULT_QUESTIONS[0].question);
    expect(parsed.questions[1].answerIndex).toBe(DEFAULT_QUESTIONS[1].answerIndex);
  });
  it('rejects missing choice values', () => {
    expect(() => csvToQuestions('setName,question,choiceA,choiceB,choiceC,choiceD,answerIndex,explanation,subject,grade,difficulty\nSet,Q,A,B,,D,0,,คณิตศาสตร์,ป.3,ง่าย')).toThrow(/ตัวเลือก/);
  });
});
