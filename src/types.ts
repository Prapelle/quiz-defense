export type Subject = 'คณิตศาสตร์' | 'ภาษาอังกฤษ' | 'วิทยาศาสตร์' | 'ภาษาไทย' | 'สังคมศึกษา';
export type Difficulty = 'ง่าย' | 'ปานกลาง' | 'ยาก';

export interface QuizQuestion {
  id: string;
  setId: string;
  question: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  subject: Subject;
  grade: string;
  difficulty: Difficulty;
}

export interface QuestionSet {
  id: string;
  name: string;
  description: string;
  subject: Subject | 'หลายวิชา';
  updatedAt: string;
  questionIds: string[];
}

export interface PlayerProgress {
  score: number;
  unlockedStage: number;
  starsByStage: Record<string, number>;
  gamesPlayed: number;
  correctAnswers: number;
  answeredQuestions: number;
}

export interface GameSettings {
  rewardCorrect: number;
  startingMana: number;
  baseHealth: number;
  questionStreakBonus: number;
  questionStreakEvery: number;
  enemySpawnMs: number;
  maxEnemies: number;
  questionCooldownMs: number;
}

export interface GameSave {
  /** Version of the defaults/settings migration already applied to this local save. */
  settingsVersion?: number;
  questions: QuizQuestion[];
  sets: QuestionSet[];
  progress: PlayerProgress;
  settings: GameSettings;
  activeSetId: string;
  updatedAt: string;
}
