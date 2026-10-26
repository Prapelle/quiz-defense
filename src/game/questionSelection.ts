import type { QuizQuestion } from '../types';

/**
 * Returns a question that has not been seen during the current stage.
 * Questions are only eligible for repeats after the whole pool has been used.
 */
export function pickUnseenQuestion(questions: QuizQuestion[], usedIds: Set<string>): QuizQuestion | null {
  if (questions.length === 0) return null;
  let available = questions.filter((question) => !usedIds.has(question.id));
  if (available.length === 0) {
    usedIds.clear();
    available = [...questions];
  }
  const question = available[Math.floor(Math.random() * available.length)];
  usedIds.add(question.id);
  return question;
}
