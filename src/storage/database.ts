import { DEFAULT_QUESTIONS, DEFAULT_SETS, DEFAULT_SET_ID } from '../data/defaultQuestions';
import { GRADE2_QUESTIONS, GRADE2_SET, GRADE2_SET_ID } from '../data/grade2Questions';
import { GAME_SETTINGS } from '../game/config';
import { freshProgress } from '../game/progress';
import type { GameSave, PlayerProgress, QuizQuestion, QuestionSet, GameSettings } from '../types';

const DB_NAME = 'quiz-defense-local';
const DB_VERSION = 1;
const STORE = 'app-state';
const KEY = 'save-v1';
const LEGACY_DEFAULT_STARTING_MANA = 150;
const CURRENT_SETTINGS_VERSION = 2;
/** 1 = Grade 2 question bank added. */
const CURRENT_CONTENT_VERSION = 1;

const initialSave = (): GameSave => ({
  settingsVersion: CURRENT_SETTINGS_VERSION,
  contentVersion: CURRENT_CONTENT_VERSION,
  questions: [...GRADE2_QUESTIONS, ...DEFAULT_QUESTIONS],
  sets: [GRADE2_SET, ...DEFAULT_SETS],
  progress: freshProgress(),
  settings: {
    rewardCorrect: GAME_SETTINGS.rewardCorrect,
    startingMana: GAME_SETTINGS.startingMana,
    baseHealth: GAME_SETTINGS.baseHealth,
    questionStreakBonus: GAME_SETTINGS.questionStreakBonus,
    questionStreakEvery: GAME_SETTINGS.questionStreakEvery,
    enemySpawnMs: GAME_SETTINGS.enemySpawnMs,
    maxEnemies: GAME_SETTINGS.maxEnemies,
    questionCooldownMs: GAME_SETTINGS.questionCooldownMs,
    soundMuted: false,
    musicVolume: 0.45,
    sfxVolume: 0.8,
  },
  activeSetId: GRADE2_SET_ID,
  updatedAt: new Date().toISOString(),
});

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('เบราว์เซอร์นี้ไม่รองรับ IndexedDB กรุณาใช้ Safari รุ่นล่าสุดหรือ Chrome'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('เปิดฐานข้อมูลในเครื่องไม่สำเร็จ'));
  });
}

export async function loadSave(): Promise<GameSave> {
  const db = await openDb();
  try {
    const value = await new Promise<GameSave | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result as GameSave | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!value) {
      const fresh = initialSave();
      await writeSave(fresh);
      return fresh;
    }
    return mergeSave(value);
  } finally {
    db.close();
  }
}

export async function writeSave(save: GameSave): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ...save, updatedAt: new Date().toISOString() }, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('บันทึกข้อมูลไม่สำเร็จ'));
      tx.onabort = () => reject(tx.error ?? new Error('การบันทึกถูกยกเลิก'));
    });
  } finally {
    db.close();
  }
}

export function migrateGameSettings(input: Partial<GameSettings> | undefined, settingsVersion?: number): GameSettings {
  const fresh = initialSave().settings;
  const merged = { ...fresh, ...(input ?? {}) };
  // Upgrade saves with the previous default, while preserving deliberate custom values.
  if ((settingsVersion ?? 0) < CURRENT_SETTINGS_VERSION && input?.startingMana === LEGACY_DEFAULT_STARTING_MANA) {
    merged.startingMana = GAME_SETTINGS.startingMana;
  }
  return merged;
}

/** Fills missing fields from defaults; used on load and when restoring a backup file. */
export function normalizeSave(input: Partial<GameSave>): GameSave {
  return mergeSave(input);
}

function mergeSave(input: Partial<GameSave>): GameSave {
  const fresh = initialSave();
  const merged: GameSave = {
    ...fresh,
    ...input,
    settingsVersion: CURRENT_SETTINGS_VERSION,
    contentVersion: CURRENT_CONTENT_VERSION,
    questions: Array.isArray(input.questions) ? input.questions : fresh.questions,
    sets: Array.isArray(input.sets) ? input.sets : fresh.sets,
    progress: { ...fresh.progress, ...(input.progress ?? {}) },
    settings: migrateGameSettings(input.settings, input.settingsVersion),
    activeSetId: typeof input.activeSetId === 'string' ? input.activeSetId : fresh.activeSetId,
  };
  return migrateContent(merged, input.contentVersion);
}

/** Adds built-in question banks to older saves once, without touching the player's own sets. */
export function migrateContent(save: GameSave, contentVersion?: number): GameSave {
  if ((contentVersion ?? 0) >= 1 || save.sets.some((set) => set.id === GRADE2_SET_ID)) return save;
  const existingIds = new Set(save.questions.map((question) => question.id));
  return {
    ...save,
    sets: [GRADE2_SET, ...save.sets],
    questions: [...GRADE2_QUESTIONS.filter((question) => !existingIds.has(question.id)), ...save.questions],
    // Switch only players still on the old starter set; keep anyone who picked their own set.
    activeSetId: save.activeSetId === DEFAULT_SET_ID ? GRADE2_SET_ID : save.activeSetId,
  };
}

export interface QuestionPackage {
  app: 'quiz-defense';
  schemaVersion: 1;
  exportedAt: string;
  sets: QuestionSet[];
  questions: QuizQuestion[];
}

export function packageQuestions(sets: QuestionSet[], questions: QuizQuestion[]): QuestionPackage {
  return { app: 'quiz-defense', schemaVersion: 1, exportedAt: new Date().toISOString(), sets, questions };
}

export function validateQuestionPackage(input: unknown): QuestionPackage {
  if (!input || typeof input !== 'object') throw new Error('ไฟล์ต้องเป็น JSON object');
  const pkg = input as Partial<QuestionPackage>;
  if (pkg.app !== 'quiz-defense' || pkg.schemaVersion !== 1) throw new Error('ไม่รู้จักรูปแบบไฟล์ Quiz Defense (ต้องเป็น schemaVersion 1)');
  if (!Array.isArray(pkg.sets) || !Array.isArray(pkg.questions)) throw new Error('ไฟล์ต้องมี sets และ questions เป็นรายการ');
  const ids = new Set<string>();
  const cleanQuestions = pkg.questions.map((row, i) => {
    const q = row as QuizQuestion;
    if (!q || typeof q !== 'object') throw new Error(`คำถามข้อ ${i + 1}: ข้อมูลไม่ใช่ object`);
    if (typeof q.id !== 'string' || !q.id.trim()) throw new Error(`คำถามข้อ ${i + 1}: ไม่มี id`);
    if (ids.has(q.id)) throw new Error(`พบรหัสคำถามซ้ำ: ${q.id}`);
    ids.add(q.id);
    if (typeof q.question !== 'string' || !q.question.trim()) throw new Error(`คำถามข้อ ${i + 1}: ไม่มีข้อความคำถาม`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || q.choices.some((c) => typeof c !== 'string' || !c.trim())) throw new Error(`คำถามข้อ ${i + 1}: ต้องมีตัวเลือกครบ 4 ข้อ`);
    if (![0, 1, 2, 3].includes(q.answerIndex)) throw new Error(`คำถามข้อ ${i + 1}: answerIndex ต้องเป็น 0, 1, 2 หรือ 3`);
    if (typeof q.setId !== 'string' || !q.setId.trim()) throw new Error(`คำถามข้อ ${i + 1}: ไม่มี setId`);
    if (typeof q.subject !== 'string' || typeof q.grade !== 'string' || typeof q.difficulty !== 'string') throw new Error(`คำถามข้อ ${i + 1}: วิชา ชั้นเรียน และระดับความยากต้องเป็นข้อความ`);
    return { ...q, choices: [...q.choices] as QuizQuestion['choices'], explanation: typeof q.explanation === 'string' ? q.explanation : '' };
  });
  const setIds = new Set<string>();
  const cleanSets = pkg.sets.map((row, i) => {
    const s = row as QuestionSet;
    if (!s || typeof s.id !== 'string' || !s.id.trim() || typeof s.name !== 'string' || !s.name.trim()) throw new Error(`ชุดคำถามข้อ ${i + 1}: ต้องมี id และ name`);
    if (setIds.has(s.id)) throw new Error(`พบรหัสชุดคำถามซ้ำ: ${s.id}`);
    setIds.add(s.id);
    return { ...s, description: typeof s.description === 'string' ? s.description : '', updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(), questionIds: Array.isArray(s.questionIds) ? s.questionIds.filter((id) => typeof id === 'string') : [] };
  });
  for (const q of cleanQuestions) if (!setIds.has(q.setId)) throw new Error(`คำถาม "${q.question.slice(0, 40)}" อ้างถึงชุดคำถามที่ไม่มีอยู่ (${q.setId})`);
  return { app: 'quiz-defense', schemaVersion: 1, exportedAt: typeof pkg.exportedAt === 'string' ? pkg.exportedAt : new Date().toISOString(), sets: cleanSets, questions: cleanQuestions };
}

export function importQuestionPackage(current: GameSave, pkg: QuestionPackage, mode: 'add' | 'replace'): GameSave {
  const parsed = validateQuestionPackage(pkg);
  if (mode === 'replace') {
    if (parsed.sets.length === 0) throw new Error('ไม่สามารถแทนที่ด้วยไฟล์ที่ไม่มีชุดคำถามได้');
    return { ...current, sets: parsed.sets, questions: parsed.questions, activeSetId: parsed.sets[0].id, updatedAt: new Date().toISOString() };
  }
  const suffix = Date.now().toString(36);
  const setIdMap = new Map<string, string>();
  const newSets = parsed.sets.map((s, i) => {
    const id = `${s.id}-import-${suffix}-${i}`;
    setIdMap.set(s.id, id);
    return { ...s, id, questionIds: [] as string[] };
  });
  const newQuestions = parsed.questions.map((q, i) => ({ ...q, id: `${q.id}-import-${suffix}-${i}`, setId: setIdMap.get(q.setId)! }));
  for (const set of newSets) set.questionIds = newQuestions.filter((q) => q.setId === set.id).map((q) => q.id);
  return { ...current, sets: [...current.sets, ...newSets], questions: [...current.questions, ...newQuestions], activeSetId: newSets[0]?.id ?? current.activeSetId, updatedAt: new Date().toISOString() };
}

export function resetProgress(progress: PlayerProgress): PlayerProgress {
  void progress;
  return freshProgress();
}

export type { GameSettings };
