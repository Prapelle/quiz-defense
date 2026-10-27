export type PlantId = 'kumarn' | 'lotus' | 'bindLotus' | 'ward' | 'fireLotus';
export type GhostId = 'tanian' | 'krasue' | 'pret' | 'krahang' | 'pop' | 'kongkoi' | 'phrong' | 'nangram' | 'huakhad' | 'khomot';

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
  /** Bomb guardian: explodes once after this delay. */
  fuseMs?: number;
}

export type BossAbility = 'charm' | 'waterSurge' | 'tigerShift';

export type GhostAbility = 'camouflage' | 'lunge' | 'laneHop' | 'lifesteal' | 'vanish' | 'charm' | 'fear' | 'smoke';

/** Timings for ghost abilities (ms, px). Kept here so balance changes stay in one place. */
export const GHOST_ABILITY = {
  camouflageEveryMs: 8000, camouflageMs: 2000,
  lungeEveryMs: 6000, lungeDistance: 104,
  laneHopEveryMs: 2600, laneHopLowHpEveryMs: 1800,
  vanishBelowHpRatio: 0.5, vanishMs: 2000,
  charmEveryMs: 8000, charmMs: 2500, charmRange: 320,
  fearRadius: 150, fearAttackSlowdown: 2,
  smokeEveryMs: 7000, smokeMs: 2000, smokeDamageReduction: 0.6,
} as const;

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
  /** Artwork file under public/bosses (without extension). */
  art: string;
}

export const BOSSES: BossConfig[] = [
  { stage: 3, name: 'ผีตายทั้งกลม', emoji: '👻', hp: 720, speed: 7, damage: 18, reward: 120, description: 'บอสประจำด่าน 3 — ส่งเสียงคร่ำครวญสะกดผู้พิทักษ์ทั้งเลนให้หยุดโจมตี 3 วินาที', ability: 'charm', art: 'tai-thang-klom' },
  { stage: 6, name: 'ผีพรายเจ้าแม่น้ำ', emoji: '🌊', hp: 1250, speed: 6, damage: 24, reward: 220, description: 'โจมตีน้ำเป็นระลอก สร้างความเสียหายแก่ผู้พิทักษ์ทั่วทั้งแผนที่', ability: 'waterSurge', art: 'phrai' },
  { stage: 9, name: 'ผีสมิง', emoji: '🐅', hp: 2200, speed: 8, damage: 30, reward: 500, description: 'สลับร่างคนกับร่างเสือ และเรียกเสือบริวารเข้าช่วยรบ', ability: 'tigerShift', art: 'saming' },
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
  /** Krasue: floats over the ward pillar only. Krahang: flies over every protector. */
  flying?: boolean;
  flyOverAll?: boolean;
  /** Special ability from the development plan; tuned by the timings below. */
  ability?: GhostAbility;
  abilityLabel?: string;
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
  { id: 'fireLotus', name: 'ระเบิดอาคม', emoji: '🏺', cost: 150, unlockAtStreak: 4, hp: 90, role: 'ระเบิดพื้นที่', description: 'วางลงบนช่องแล้วระเบิดใน 3 วินาที สร้างความเสียหายแก่ผีในช่องรอบข้าง 1 ช่อง', attackDamage: 90, attackRange: 0, attackMs: 0, splashRadius: 1, fuseMs: 3000 },
];

export const GHOSTS: GhostConfig[] = [
  { id: 'tanian', name: 'ผีตานี', emoji: '👻', hp: 90, speed: 20, damage: 5, reward: 15, description: 'อำพรางตัวในดงกล้วยเป็นระยะ ระหว่างนั้นโจมตีไม่โดน', ability: 'camouflage', abilityLabel: 'อำพรางตัว', size: 27 },
  { id: 'krasue', name: 'ผีกระสือ', emoji: '🔮', hp: 120, speed: 15, damage: 9, reward: 20, description: 'ลอยข้ามเสาหลักอาคมได้ แต่ถูกผู้พิทักษ์อื่นขวางไว้', flying: true, abilityLabel: 'ลอยข้ามเสาหลัก', size: 30 },
  { id: 'pret', name: 'ผีเปรต', emoji: '👹', hp: 260, speed: 9, damage: 15, reward: 30, description: 'พลังชีวิตสูงมาก และก้าวยาวพุ่งไปข้างหน้า 1 ช่องเป็นระยะ', ability: 'lunge', abilityLabel: 'ก้าวยาว', size: 36 },
  { id: 'krahang', name: 'ผีกระหัง', emoji: '🪶', hp: 135, speed: 21, damage: 7, reward: 24, description: 'บินข้ามผู้พิทักษ์ทุกชนิด ต้องยิงให้ตกก่อนถึงฐาน', flying: true, flyOverAll: true, abilityLabel: 'บินข้ามสิ่งกีดขวาง', size: 31 },
  { id: 'pop', name: 'ผีปอบ', emoji: '🦷', hp: 150, speed: 13, damage: 12, reward: 25, description: 'ดูดพลังชีวิตผู้พิทักษ์ที่กัด มาฟื้นฟูตัวเอง', ability: 'lifesteal', abilityLabel: 'ดูดพลังชีวิต', size: 31 },
  { id: 'kongkoi', name: 'ผีกองกอย', emoji: '🦶', hp: 75, speed: 30, damage: 4, reward: 17, description: 'กระโดดเปลี่ยนเลนระหว่างบุก และกระโดดถี่ขึ้นเมื่อบาดเจ็บ', ability: 'laneHop', abilityLabel: 'กระโดดเปลี่ยนเลน', size: 25 },
  { id: 'phrong', name: 'ผีโพรง', emoji: '🌑', hp: 115, speed: 16, damage: 7, reward: 22, description: 'เมื่อบาดเจ็บหนักจะหายตัวในเงามืดชั่วคราว', ability: 'vanish', abilityLabel: 'หายตัว', size: 29 },
  { id: 'nangram', name: 'ผีนางรำ', emoji: '💃', hp: 165, speed: 10, damage: 8, reward: 28, description: 'ร่ายรำสะกดผู้พิทักษ์ข้างหน้าในเลนให้หยุดโจมตีชั่วคราว', ability: 'charm', abilityLabel: 'ร่ายรำสะกด', size: 33 },
  { id: 'huakhad', name: 'ผีหัวขาด', emoji: '💀', hp: 110, speed: 18, damage: 10, reward: 25, description: 'ทำให้ผู้พิทักษ์รอบตัวหวาดกลัว โจมตีช้าลงครึ่งหนึ่ง', ability: 'fear', abilityLabel: 'หวาดกลัว', size: 31 },
  { id: 'khomot', name: 'ผีโขมด', emoji: '🌫️', hp: 200, speed: 12, damage: 10, reward: 28, description: 'แปลงร่างเป็นควันเป็นระยะ ลดความเสียหายที่ได้รับ 60%', ability: 'smoke', abilityLabel: 'ร่างควัน', size: 34 },
];

export const STAGES = [
  { id: 1, name: 'หมู่บ้านใต้แสงจันทร์', subtitle: 'เริ่มต้นปกป้องหมู่บ้านจากผีสองชนิด', difficulty: 'ง่าย', enemies: 10, waves: [3, 3, 4], waveBreakMs: 5000, spawnMs: 6500, allowedGhosts: ['tanian', 'krasue'] as GhostId[] },
  { id: 2, name: 'ป่ากล้วยต้องคำสาป', subtitle: 'ผีเปรตและผีกระหังเข้าร่วมการบุก', difficulty: 'ง่าย', enemies: 15, waves: [5, 5, 5], waveBreakMs: 4800, spawnMs: 6100, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang'] as GhostId[] },
  { id: 3, name: 'ประตูวัดร้าง', subtitle: 'ผีปอบและผีกองกอยปรากฏตัว', difficulty: 'ปานกลาง', enemies: 20, waves: [6, 7, 7], waveBreakMs: 4500, spawnMs: 5700, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi'] as GhostId[] },
  { id: 4, name: 'หมู่บ้านใต้แสงจันทร์ — ยามค่ำ', subtitle: 'ผีโพรงและผีนางรำเสริมกำลัง', difficulty: 'ปานกลาง', enemies: 25, waves: [8, 8, 9], waveBreakMs: 4200, spawnMs: 5300, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phrong', 'nangram'] as GhostId[] },
  { id: 5, name: 'ป่ากล้วยต้องคำสาป — ยามดึก', subtitle: 'ผีครบทั้งสิบชนิด พร้อมความสามารถพิเศษ', difficulty: 'ยาก', enemies: 30, waves: [10, 10, 10], waveBreakMs: 4000, spawnMs: 4900, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phrong', 'nangram', 'huakhad', 'khomot'] as GhostId[] },
  { id: 6, name: 'ประตูวัดร้าง — ยามค่ำคืน', subtitle: 'ศึกยืดเยื้อ ผีทุกชนิดบุกเป็นระลอก', difficulty: 'ยาก', enemies: 35, waves: [11, 12, 12], waveBreakMs: 3700, spawnMs: 4500, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phrong', 'nangram', 'huakhad', 'khomot'] as GhostId[] },
  { id: 7, name: 'หมู่บ้านใต้แสงจันทร์ — พายุวิญญาณ', subtitle: 'จำนวนผีเพิ่มขึ้นและจังหวะบุกถี่ขึ้น', difficulty: 'ยาก', enemies: 40, waves: [13, 13, 14], waveBreakMs: 3400, spawnMs: 4200, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phrong', 'nangram', 'huakhad', 'khomot'] as GhostId[] },
  { id: 8, name: 'ป่ากล้วยต้องคำสาป — พายุ', subtitle: 'ผีทั้งสิบชนิดบุกด้วยความหนาแน่นสูง', difficulty: 'โหด', enemies: 45, waves: [15, 15, 15], waveBreakMs: 3000, spawnMs: 3900, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phrong', 'nangram', 'huakhad', 'khomot'] as GhostId[] },
  { id: 9, name: 'ประตูวัดร้าง — คืนเดือนดับ', subtitle: 'ด่านสุดท้าย 50 ตัว ต้องวางแผนให้ดี', difficulty: 'โหด', enemies: 50, waves: [16, 17, 17], waveBreakMs: 2600, spawnMs: 3600, allowedGhosts: ['tanian', 'krasue', 'pret', 'krahang', 'pop', 'kongkoi', 'phrong', 'nangram', 'huakhad', 'khomot'] as GhostId[] },
];
