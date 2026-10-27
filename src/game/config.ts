export type PlantId = 'kumarn' | 'lotus' | 'bindLotus' | 'ward' | 'fireLotus';
export type GhostId = 'tanian' | 'krasue' | 'pret' | 'krahang' | 'pop' | 'kongkoi' | 'phong' | 'maemai' | 'taihong' | 'khomot';

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
  manaGain?: number;
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
  /** Speed and attack multipliers while below a health ratio. */
  enrageBelowHpRatio?: number;
  enrageSpeedMultiplier?: number;
  enrageDamageMultiplier?: number;
  /** Poison damage over time applied to protectors on a hit. */
  poisonDamage?: number;
  poisonIntervalMs?: number;
  poisonDurationMs?: number;
  /** Nearby ghosts move faster while inside this aura. */
  speedAuraRadius?: number;
  speedAuraMultiplier?: number;
  /** Damage applied to nearby protectors when this ghost is defeated. */
  deathBurstDamage?: number;
  deathBurstRadius?: number;
  /** Incoming projectile damage reduction, clamped by gameplay code. */
  damageReduction?: number;
  size: number;
}

export const GAME_SETTINGS = {
  rewardCorrect: 25,
  startingMana: 200,
  killManaReward: 5,
  baseHealth: 5,
  questionStreakBonus: 10,
  questionStreakEvery: 3,
  enemySpawnMs: 5200,
  maxEnemies: 14,
  questionCooldownMs: 900,
  questionIntervalMs: 15000,
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
  { id: 'kumarn', name: 'กุมารวิญญาณ', emoji: '🧒🏻', cost: 50, unlockAtStreak: 0, hp: 45, role: 'สร้างพลังอาคม', description: 'สร้างพลังอาคม +10 ทุก 5 วินาที', attackDamage: 0, attackRange: 0, attackMs: 0, manaEveryMs: 5000, manaGain: 10 },
  { id: 'lotus', name: 'ดอกบัวอาคม', emoji: '🪷', cost: 75, unlockAtStreak: 0, hp: 40, role: 'โจมตีระยะไกล', description: 'ยิงประกายอาคมแรงขึ้นจากระยะไกลในเลนเดียวกัน', attackDamage: 28, attackRange: 700, attackMs: 1800 },
  { id: 'bindLotus', name: 'บัวสะกดวิญญาณ', emoji: '🪻', cost: 100, unlockAtStreak: 2, hp: 45, role: 'ลดความเร็ว', description: 'สร้างความเสียหายเล็กน้อยพร้อมสะกดผีให้ช้าลง', attackDamage: 10, attackRange: 680, attackMs: 2200, slowMs: 2800 },
  { id: 'ward', name: 'เสาหลักอาคม', emoji: '🗿', cost: 125, unlockAtStreak: 3, hp: 180, role: 'ป้องกัน', description: 'รับการโจมตีแทนแนวหลัง', attackDamage: 0, attackRange: 0, attackMs: 0 },
  { id: 'fireLotus', name: 'ดอกบัวเพลิง', emoji: '🌺', cost: 150, unlockAtStreak: 4, hp: 42, role: 'โจมตีวงกว้าง', description: 'ระเบิดอาคมแรงสูงใส่ผีหลายตัวที่อยู่ใกล้กัน', attackDamage: 48, attackRange: 420, attackMs: 3200, splashRadius: 105 },
];

export const GHOSTS: GhostConfig[] = [
  { id: 'tanian', name: 'ผีตานี', emoji: '👻', hp: 90, speed: 20, damage: 5, reward: 15, description: 'ตัวไว ชอบลอบเข้าหาฐาน', size: 27 },
  { id: 'krasue', name: 'ผีกระสือ', emoji: '🔮', hp: 120, speed: 15, damage: 9, reward: 20, description: 'ผีบิน ลอยข้ามเสาหลักอาคมได้', flying: true, size: 30 },
  { id: 'pret', name: 'ผีเปรต', emoji: '👹', hp: 260, speed: 9, damage: 15, reward: 30, description: 'อึดมาก เคลื่อนที่ช้าแต่โจมตีรุนแรง', size: 36 },
  { id: 'krahang', name: 'ผีกระหัง', emoji: '🪶', hp: 135, speed: 21, damage: 7, reward: 24, description: 'ผีบินที่เคลื่อนที่เร็ว ข้ามเสาหลักอาคมได้', flying: true, size: 31 },
  { id: 'pop', name: 'ผีปอบ', emoji: '🦷', hp: 150, speed: 13, damage: 12, reward: 25, description: 'เมื่อพลังชีวิตเหลือครึ่งหนึ่ง จะโกรธและโจมตีเร็วแรงขึ้น', enrageBelowHpRatio: 0.5, enrageSpeedMultiplier: 1.5, enrageDamageMultiplier: 1.25, size: 31 },
  { id: 'kongkoi', name: 'ผีกองกอย', emoji: '🦶', hp: 75, speed: 30, damage: 4, reward: 17, description: 'ตัวเล็กและวิ่งเร็วมาก แต่พลังชีวิตต่ำ', size: 25 },
  { id: 'phong', name: 'ผีโพง', emoji: '🔥', hp: 115, speed: 16, damage: 7, reward: 22, description: 'การโจมตีปล่อยพิษ ทำให้ผู้พิทักษ์เสียพลังชีวิตต่อเนื่อง', poisonDamage: 3, poisonIntervalMs: 1000, poisonDurationMs: 3000, size: 29 },
  { id: 'maemai', name: 'ผีแม่ม่าย', emoji: '👰', hp: 165, speed: 10, damage: 8, reward: 28, description: 'เพิ่มความเร็วให้ผีที่อยู่ใกล้กัน', speedAuraRadius: 160, speedAuraMultiplier: 1.3, size: 33 },
  { id: 'taihong', name: 'ผีตายโหง', emoji: '💀', hp: 110, speed: 18, damage: 10, reward: 25, description: 'เมื่อถูกกำจัดจะระเบิด สร้างความเสียหายแก่ผู้พิทักษ์ใกล้เคียง', deathBurstDamage: 18, deathBurstRadius: 125, size: 31 },
  { id: 'khomot', name: 'ผีโขมด', emoji: '🌫️', hp: 200, speed: 12, damage: 10, reward: 28, description: 'ร่างหมอกช่วยลดความเสียหายที่ได้รับ 25%', damageReduction: 0.25, size: 34 },
];

export const STAGES = [
  { id: 1, name: 'หมู่บ้านใต้แสงจันทร์', subtitle: 'ฝึกตอบคำถามและวางแนวป้องกัน', difficulty: 'ง่าย', enemies: 10, waves: [3, 3, 4], waveBreakMs: 5000, spawnMs: 6500, allowedGhosts: ['tanian'] as GhostId[] },
  { id: 2, name: 'ป่ากล้วยต้องคำสาป', subtitle: 'ผีบิน ผีพิษ และผีสายเร็วเริ่มบุก', difficulty: 'ปานกลาง', enemies: 14, waves: [4, 4, 6], waveBreakMs: 4500, spawnMs: 5200, allowedGhosts: ['tanian', 'krasue', 'krahang', 'kongkoi', 'phong'] as GhostId[] },
  { id: 3, name: 'ประตูวัดร้าง', subtitle: 'เผชิญหน้าผีทั้งสิบชนิดและความสามารถพิเศษ', difficulty: 'ยาก', enemies: 18, waves: [4, 6, 8], waveBreakMs: 3500, spawnMs: 4100, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai', 'taihong', 'khomot'] as GhostId[] },
];
