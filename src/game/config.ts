export type PlantId = 'kumarn' | 'lotus' | 'bindLotus' | 'ward' | 'fireLotus';
export type GhostId = 'tanian' | 'krasue' | 'pret';

export interface PlantConfig {
  id: PlantId;
  name: string;
  emoji: string;
  cost: number;
  /** Correct-answer streak needed to unlock this plant for the current battle. */
  unlockAtStreak: number;
  hp: number;
  role: string;
  description: string;
  attackDamage: number;
  attackRange: number;
  attackMs: number;
  manaEveryMs?: number;
  slowMs?: number;
  splashRadius?: number;
}

export interface GhostConfig {
  id: GhostId;
  name: string;
  emoji: string;
  hp: number;
  speed: number;
  damage: number;
  reward: number;
  description: string;
  flying?: boolean;
  size: number;
}

export const GAME_SETTINGS = {
  rewardCorrect: 25,
  startingMana: 150,
  baseHealth: 5,
  questionStreakBonus: 10,
  questionStreakEvery: 3,
  enemySpawnMs: 5200,
  maxEnemies: 14,
  questionCooldownMs: 900,
  gridRows: 5,
  gridCols: 9,
  canvasWidth: 1280,
  canvasHeight: 620,
  laneStartX: 150,
  laneEndX: 1115,
  laneStartY: 142,
  laneGapY: 90,
} as const;

export const PLANTS: PlantConfig[] = [
  { id: 'kumarn', name: 'กุมารวิญญาณ', emoji: '🧒🏻', cost: 50, unlockAtStreak: 0, hp: 45, role: 'สร้างพลังอาคม', description: 'สร้างพลังอาคมเพิ่มทุก 8 วินาที', attackDamage: 0, attackRange: 0, attackMs: 0, manaEveryMs: 8000 },
  { id: 'lotus', name: 'ดอกบัวอาคม', emoji: '🪷', cost: 75, unlockAtStreak: 0, hp: 40, role: 'โจมตีระยะไกล', description: 'ยิงประกายอาคมไปยังผีในเลนเดียวกัน', attackDamage: 24, attackRange: 700, attackMs: 1700 },
  { id: 'bindLotus', name: 'บัวสะกดวิญญาณ', emoji: '🪻', cost: 100, unlockAtStreak: 2, hp: 45, role: 'ลดความเร็ว', description: 'สะกดผีให้เคลื่อนที่ช้าลง', attackDamage: 8, attackRange: 680, attackMs: 2100, slowMs: 2400 },
  { id: 'ward', name: 'เสาหลักอาคม', emoji: '🗿', cost: 125, unlockAtStreak: 3, hp: 180, role: 'ป้องกัน', description: 'รับการโจมตีแทนแนวหลัง', attackDamage: 0, attackRange: 0, attackMs: 0 },
  { id: 'fireLotus', name: 'ดอกบัวเพลิง', emoji: '🌺', cost: 150, unlockAtStreak: 4, hp: 42, role: 'โจมตีวงกว้าง', description: 'ระเบิดอาคมใส่ผีบริเวณใกล้เคียง', attackDamage: 42, attackRange: 420, attackMs: 2900, splashRadius: 105 },
];

export const GHOSTS: GhostConfig[] = [
  { id: 'tanian', name: 'ผีตานี', emoji: '👻', hp: 90, speed: 20, damage: 1, reward: 15, description: 'ตัวไว ชอบลอบเข้าหาฐาน', size: 27 },
  { id: 'krasue', name: 'ผีกระสือ', emoji: '🔮', hp: 120, speed: 15, damage: 1, reward: 20, description: 'ลอยข้ามเสาหลักอาคมได้', flying: true, size: 30 },
  { id: 'pret', name: 'ผีเปรต', emoji: '👹', hp: 260, speed: 9, damage: 2, reward: 30, description: 'อึด เคลื่อนที่ช้า แต่รับความเสียหายได้นาน', size: 36 },
];

export const STAGES = [
  { id: 1, name: 'หมู่บ้านใต้แสงจันทร์', subtitle: 'ฝึกตอบคำถามและวางแนวป้องกัน', difficulty: 'ง่าย', enemies: 10, waves: [3, 3, 4], waveBreakMs: 5000, spawnMs: 6500, allowedGhosts: ['tanian'] as GhostId[] },
  { id: 2, name: 'ป่ากล้วยต้องคำสาป', subtitle: 'ผีตานีและผีกระสือเริ่มบุกพร้อมกัน', difficulty: 'ปานกลาง', enemies: 14, waves: [4, 4, 6], waveBreakMs: 4500, spawnMs: 5200, allowedGhosts: ['tanian', 'krasue'] as GhostId[] },
  { id: 3, name: 'ประตูวัดร้าง', subtitle: 'ระวังผีเปรตผู้ทรงพลัง', difficulty: 'ยาก', enemies: 18, waves: [4, 6, 8], waveBreakMs: 3500, spawnMs: 4100, allowedGhosts: ['tanian', 'krasue', 'pret'] as GhostId[] },
];
