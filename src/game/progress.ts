import type { PlayerProgress, StageBest, Subject } from '../types';

export const freshProgress = (): PlayerProgress => ({
  score: 0, unlockedStage: 1, starsByStage: {}, gamesPlayed: 0, correctAnswers: 0, answeredQuestions: 0,
  knowledgeScore: 0, bestStreak: 0, wins: 0, bestByStage: {}, subjectStats: {}, achievements: [],
});

/** Knowledge points: 10 per correct answer plus 2 per step of the current streak (capped at +10). */
export function knowledgePointsFor(correct: boolean, streakAfterAnswer: number): number {
  if (!correct) return 0;
  return 10 + Math.min(5, Math.max(0, streakAfterAnswer - 1)) * 2;
}

export function applyAnswerProgress(progress: PlayerProgress, subject: Subject, correct: boolean, streakAfterAnswer: number): PlayerProgress {
  const subjectStat = progress.subjectStats[subject] ?? { answered: 0, correct: 0 };
  return {
    ...progress,
    answeredQuestions: progress.answeredQuestions + 1,
    correctAnswers: progress.correctAnswers + (correct ? 1 : 0),
    knowledgeScore: progress.knowledgeScore + knowledgePointsFor(correct, streakAfterAnswer),
    bestStreak: Math.max(progress.bestStreak, correct ? streakAfterAnswer : 0),
    subjectStats: { ...progress.subjectStats, [subject]: { answered: subjectStat.answered + 1, correct: subjectStat.correct + (correct ? 1 : 0) } },
  };
}

export interface BattleOutcome { stage: number; won: boolean; score: number; kills: number; health: number; stars: number; totalStages: number }

export function applyBattleProgress(progress: PlayerProgress, outcome: BattleOutcome): PlayerProgress {
  const key = String(outcome.stage);
  const previous: StageBest | undefined = progress.bestByStage[key];
  const best: StageBest = {
    bestScore: Math.max(previous?.bestScore ?? 0, outcome.score),
    bestKills: Math.max(previous?.bestKills ?? 0, outcome.kills),
    bestHealth: outcome.won ? Math.max(previous?.bestHealth ?? 0, outcome.health) : previous?.bestHealth ?? 0,
    plays: (previous?.plays ?? 0) + 1,
    wins: (previous?.wins ?? 0) + (outcome.won ? 1 : 0),
  };
  return {
    ...progress,
    score: progress.score + outcome.score,
    gamesPlayed: progress.gamesPlayed + 1,
    wins: progress.wins + (outcome.won ? 1 : 0),
    unlockedStage: outcome.won ? Math.max(progress.unlockedStage, Math.min(outcome.totalStages, outcome.stage + 1)) : progress.unlockedStage,
    starsByStage: outcome.won ? { ...progress.starsByStage, [key]: Math.max(progress.starsByStage[key] ?? 0, outcome.stars) } : progress.starsByStage,
    bestByStage: { ...progress.bestByStage, [key]: best },
  };
}

export interface Achievement { id: string; icon: string; name: string; description: string; earned: (p: PlayerProgress) => boolean }

const stageWon = (p: PlayerProgress, stage: number) => (p.bestByStage[String(stage)]?.wins ?? 0) > 0 || (p.starsByStage[String(stage)] ?? 0) > 0;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', icon: '🏮', name: 'หมอผีฝึกหัด', description: 'ชนะด่านแรกได้สำเร็จ', earned: (p) => p.wins >= 1 },
  { id: 'boss-3', icon: '👻', name: 'ผ่านประตูวัดร้าง', description: 'ชนะบอสผีตายทั้งกลมในด่าน 3', earned: (p) => stageWon(p, 3) },
  { id: 'boss-6', icon: '🌊', name: 'สงบคลื่นผีพราย', description: 'ชนะบอสผีพรายเจ้าแม่น้ำในด่าน 6', earned: (p) => stageWon(p, 6) },
  { id: 'boss-9', icon: '🐅', name: 'ปราบผีสมิง', description: 'ชนะบอสสุดท้ายในด่าน 9', earned: (p) => stageWon(p, 9) },
  { id: 'three-stars', icon: '⭐', name: 'ป้องกันไร้รอยขีดข่วน', description: 'ได้ 3 ดาวในด่านใดก็ได้', earned: (p) => Object.values(p.starsByStage).some((stars) => stars >= 3) },
  { id: 'all-stars', icon: '🌟', name: 'ผู้พิทักษ์หมู่บ้าน', description: 'ได้ 3 ดาวครบทั้ง 9 ด่าน', earned: (p) => Array.from({ length: 9 }, (_, i) => p.starsByStage[String(i + 1)] ?? 0).every((stars) => stars >= 3) },
  { id: 'correct-10', icon: '📗', name: 'นักอ่านตำรา', description: 'ตอบถูกครบ 10 ข้อ', earned: (p) => p.correctAnswers >= 10 },
  { id: 'correct-50', icon: '📚', name: 'ผู้รอบรู้', description: 'ตอบถูกครบ 50 ข้อ', earned: (p) => p.correctAnswers >= 50 },
  { id: 'correct-100', icon: '🎓', name: 'ปราชญ์แห่งหมู่บ้าน', description: 'ตอบถูกครบ 100 ข้อ', earned: (p) => p.correctAnswers >= 100 },
  { id: 'streak-5', icon: '🔥', name: 'ไฟอาคม', description: 'ตอบถูกต่อเนื่อง 5 ข้อ', earned: (p) => p.bestStreak >= 5 },
  { id: 'streak-10', icon: '☄️', name: 'อาคมไม่มีวันดับ', description: 'ตอบถูกต่อเนื่อง 10 ข้อ', earned: (p) => p.bestStreak >= 10 },
  { id: 'all-subjects', icon: '🧭', name: 'รู้รอบทุกวิชา', description: 'ตอบถูกอย่างน้อย 5 ข้อในทุกวิชา', earned: (p) => (['คณิตศาสตร์', 'ภาษาไทย', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'สังคมศึกษา'] as Subject[]).every((s) => (p.subjectStats[s]?.correct ?? 0) >= 5) },
];

/** Returns progress with newly earned achievements recorded, plus the ones just unlocked. */
export function awardAchievements(progress: PlayerProgress): { progress: PlayerProgress; unlocked: Achievement[] } {
  const owned = new Set(progress.achievements);
  const unlocked = ACHIEVEMENTS.filter((a) => !owned.has(a.id) && a.earned(progress));
  if (!unlocked.length) return { progress, unlocked };
  return { progress: { ...progress, achievements: [...progress.achievements, ...unlocked.map((a) => a.id)] }, unlocked };
}

/** Subject with the lowest accuracy among those with at least `minAnswered` answers. */
export function weakestSubject(progress: PlayerProgress, minAnswered = 3): Subject | null {
  const entries = Object.entries(progress.subjectStats) as [Subject, { answered: number; correct: number }][];
  const eligible = entries.filter(([, s]) => s.answered >= minAnswered);
  if (!eligible.length) return null;
  eligible.sort((a, b) => a[1].correct / a[1].answered - b[1].correct / b[1].answered);
  const [subject, stat] = eligible[0];
  return stat.correct / stat.answered < 0.8 ? subject : null;
}
