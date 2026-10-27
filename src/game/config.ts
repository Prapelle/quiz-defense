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

export type BossAbility = 'waterSurge' | 'tigerShift';

export interface BossConfig {
  stage: number;
  name: string;
  emoji: string;
  hp: number;
  speed: number;
  damage: number;
  reward: number;
  description: string;
  ability: BossAbility;
}

export const BOSSES: BossConfig[] = [
  { stage: 3, name: 'นางรำเฝ้าประตู', emoji: '💃', hp: 720, speed: 7, damage: 18, reward: 120, description: 'บอสประจำด่าน 3 — ร่ายรำหลอกล่อและเคลื่อนที่ช้าแต่ทนทาน', ability: 'waterSurge' },
  { stage: 6, name: 'ผีพรายเจ้าแม่น้ำ', emoji: '🌊', hp: 1250, speed: 6, damage: 24, reward: 220, description: 'โจมตีน้ำเป็นระลอก สร้างความเสียหายแก่ผู้พิทักษ์ทั่วทั้งแผนที่', ability: 'waterSurge' },
  { stage: 9, name: 'ผีสมิง', emoji: '🐅', hp: 2200, speed: 8, damage: 30, reward: 500, description: 'สลับร่างคนกับร่างเสือ และเรียกเสือบริวารเข้าช่วยรบ', ability: 'tigerShift' },
];

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
  { id: 1, name: 'หมู่บ้านใต้แสงจันทร์', subtitle: 'เริ่มต้นปกป้องหมู่บ้านจากผีสองชนิด', difficulty: 'ง่าย', enemies: 10, waves: [3, 3, 4], waveBreakMs: 5000, spawnMs: 6500, allowedGhosts: ['tanian', 'krasue'] as GhostId[] },
  { id: 2, name: 'ป่ากล้วยต้องคำสาป', subtitle: 'ผีเปรตและผีกระหังเข้าร่วมการบุก', difficulty: 'ง่าย', enemies: 15, waves: [5, 5, 5], waveBreakMs: 4800, spawnMs: 6100, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang'] as GhostId[] },
  { id: 3, name: 'ประตูวัดร้าง', subtitle: 'ผีปอบและผีกองกอยปรากฏตัว', difficulty: 'ปานกลาง', enemies: 20, waves: [6, 7, 7], waveBreakMs: 4500, spawnMs: 5700, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi'] as GhostId[] },
  { id: 4, name: 'หมู่บ้านใต้แสงจันทร์ — ยามค่ำ', subtitle: 'ผีโพงและผีแม่ม่ายเสริมกำลัง', difficulty: 'ปานกลาง', enemies: 25, waves: [8, 8, 9], waveBreakMs: 4200, spawnMs: 5300, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai'] as GhostId[] },
  { id: 5, name: 'ป่ากล้วยต้องคำสาป — ยามดึก', subtitle: 'ผีครบทั้งสิบชนิด พร้อมความสามารถพิเศษ', difficulty: 'ยาก', enemies: 30, waves: [10, 10, 10], waveBreakMs: 4000, spawnMs: 4900, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai', 'taihong', 'khomot'] as GhostId[] },
  { id: 6, name: 'ประตูวัดร้าง — ยามค่ำคืน', subtitle: 'ศึกยืดเยื้อ ผีทุกชนิดบุกเป็นระลอก', difficulty: 'ยาก', enemies: 35, waves: [11, 12, 12], waveBreakMs: 3700, spawnMs: 4500, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai', 'taihong', 'khomot'] as GhostId[] },
  { id: 7, name: 'หมู่บ้านใต้แสงจันทร์ — พายุวิญญาณ', subtitle: 'จำนวนผีเพิ่มขึ้นและจังหวะบุกถี่ขึ้น', difficulty: 'ยาก', enemies: 40, waves: [13, 13, 14], waveBreakMs: 3400, spawnMs: 4200, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai', 'taihong', 'khomot'] as GhostId[] },
  { id: 8, name: 'ป่ากล้วยต้องคำสาป — พายุ', subtitle: 'ผีทั้งสิบชนิดบุกด้วยความหนาแน่นสูง', difficulty: 'โหด', enemies: 45, waves: [15, 15, 15], waveBreakMs: 3000, spawnMs: 3900, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai', 'taihong', 'khomot'] as GhostId[] },
  { id: 9, name: 'ประตูวัดร้าง — คืนเดือนดับ', subtitle: 'ด่านสุดท้าย 50 ตัว ต้องวางแผนให้ดี', difficulty: 'โหด', enemies: 50, waves: [16, 17, 17], waveBreakMs: 2600, spawnMs: 3600, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phong', 'maemai', 'taihong', 'khomot'] as GhostId[] },
];
