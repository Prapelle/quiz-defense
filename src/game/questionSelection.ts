import type { Difficulty, QuizQuestion } from '../types';

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

/** Difficulty mix per stage: 1–3 easy, 4–6 easy+medium, 7–9 medium+hard. */
export function difficultiesForStage(stage: number): Difficulty[] {
  if (stage <= 3) return ['ง่าย'];
  if (stage <= 6) return ['ง่าย', 'ปานกลาง'];
  return ['ปานกลาง', 'ยาก'];
}

/**
 * Picks an unseen question matching the stage difficulty. When the matching questions are used
 * up (or a teacher's set has none of that level), falls back to any unseen question, then repeats.
 */
export function pickQuestionForStage(questions: QuizQuestion[], usedIds: Set<string>, stage: number): QuizQuestion | null {
  const wanted = new Set(difficultiesForStage(stage));
  const matching = questions.filter((question) => wanted.has(question.difficulty));
  const unseenMatching = matching.filter((question) => !usedIds.has(question.id));
  if (unseenMatching.length) {
    const question = unseenMatching[Math.floor(Math.random() * unseenMatching.length)];
    usedIds.add(question.id);
    return question;
  }
  return pickUnseenQuestion(questions, usedIds);
}
