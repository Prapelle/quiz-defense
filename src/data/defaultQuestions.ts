import type { QuestionSet, QuizQuestion, Subject } from '../types';

export const DEFAULT_SET_ID = 'starter-th-primary';

const raw: Array<Omit<QuizQuestion, 'id' | 'setId'>> = [
  { question: '27 + 15 ได้เท่าไร?', choices: ['32', '42', '43', '52'], answerIndex: 1, explanation: '27 + 10 = 37 แล้วบวกอีก 5 ได้ 42', subject: 'คณิตศาสตร์', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'ข้อใดเป็นจำนวนคู่?', choices: ['17', '23', '36', '41'], answerIndex: 2, explanation: '36 หารด้วย 2 ลงตัว จึงเป็นจำนวนคู่', subject: 'คณิตศาสตร์', grade: 'ป.2', difficulty: 'ง่าย' },
  { question: 'ถ้ามีมะม่วง 4 ถุง ถุงละ 5 ผล มีมะม่วงทั้งหมดกี่ผล?', choices: ['9 ผล', '15 ผล', '20 ผล', '25 ผล'], answerIndex: 2, explanation: '4 × 5 = 20 ผล', subject: 'คณิตศาสตร์', grade: 'ป.3', difficulty: 'ปานกลาง' },
  { question: 'ผลลัพธ์ของ 8 × 7 คือข้อใด?', choices: ['54', '56', '63', '64'], answerIndex: 1, explanation: '8 คูณ 7 เท่ากับ 56', subject: 'คณิตศาสตร์', grade: 'ป.3', difficulty: 'ปานกลาง' },
  { question: 'คำว่า “cat” แปลว่าอะไร?', choices: ['สุนัข', 'แมว', 'นก', 'ปลา'], answerIndex: 1, explanation: 'Cat หมายถึง แมว', subject: 'ภาษาอังกฤษ', grade: 'ป.2', difficulty: 'ง่าย' },
  { question: 'What color is the sky on a clear day?', choices: ['Green', 'Blue', 'Pink', 'Black'], answerIndex: 1, explanation: 'On a clear day, the sky usually looks blue.', subject: 'ภาษาอังกฤษ', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'คำว่า “Thank you” ใช้เมื่อใด?', choices: ['ขอบคุณ', 'ขอโทษ', 'ลาก่อน', 'ราตรีสวัสดิ์'], answerIndex: 0, explanation: 'Thank you ใช้กล่าวขอบคุณ', subject: 'ภาษาอังกฤษ', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'พืชใช้ส่วนใดดูดน้ำจากดินเป็นหลัก?', choices: ['ดอก', 'ใบ', 'ราก', 'ผล'], answerIndex: 2, explanation: 'รากช่วยดูดน้ำและแร่ธาตุจากดิน', subject: 'วิทยาศาสตร์', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'น้ำแข็งเปลี่ยนเป็นน้ำเมื่อได้รับสิ่งใด?', choices: ['ความร้อน', 'ความมืด', 'เสียง', 'ลมเท่านั้น'], answerIndex: 0, explanation: 'น้ำแข็งละลายเมื่อได้รับพลังงานความร้อน', subject: 'วิทยาศาสตร์', grade: 'ป.4', difficulty: 'ง่าย' },
  { question: 'สัตว์ชนิดใดเป็นสัตว์เลี้ยงลูกด้วยนม?', choices: ['กบ', 'ปลาทอง', 'ค้างคาว', 'ผีเสื้อ'], answerIndex: 2, explanation: 'ค้างคาวเป็นสัตว์เลี้ยงลูกด้วยนมและมีขน', subject: 'วิทยาศาสตร์', grade: 'ป.4', difficulty: 'ปานกลาง' },
  { question: 'คำว่า “วิ่ง” เป็นคำชนิดใด?', choices: ['คำนาม', 'คำกริยา', 'คำสรรพนาม', 'คำบุพบท'], answerIndex: 1, explanation: 'วิ่งแสดงอาการหรือการกระทำ จึงเป็นคำกริยา', subject: 'ภาษาไทย', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'ประเทศไทยมีเมืองหลวงชื่ออะไร?', choices: ['เชียงใหม่', 'ขอนแก่น', 'กรุงเทพมหานคร', 'นครราชสีมา'], answerIndex: 2, explanation: 'กรุงเทพมหานครเป็นเมืองหลวงของประเทศไทย', subject: 'สังคมศึกษา', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'หนึ่งชั่วโมงมีกี่นาที?', choices: ['30 นาที', '45 นาที', '60 นาที', '100 นาที'], answerIndex: 2, explanation: '1 ชั่วโมงมี 60 นาที', subject: 'คณิตศาสตร์', grade: 'ป.2', difficulty: 'ง่าย' },
  { question: 'ข้อใดเป็นแหล่งพลังงานแสงธรรมชาติ?', choices: ['เทียน', 'หลอดไฟ', 'ดวงอาทิตย์', 'ไฟฉาย'], answerIndex: 2, explanation: 'ดวงอาทิตย์ปล่อยแสงและพลังงานตามธรรมชาติ', subject: 'วิทยาศาสตร์', grade: 'ป.3', difficulty: 'ง่าย' },
  { question: 'Choose the correct greeting in the morning.', choices: ['Good night', 'Good morning', 'Good bye', 'Thank you'], answerIndex: 1, explanation: 'Good morning ใช้ทักทายในตอนเช้า', subject: 'ภาษาอังกฤษ', grade: 'ป.4', difficulty: 'ปานกลาง' },
  { question: 'หากแบ่งขนม 18 ชิ้น ให้เด็ก 3 คนเท่า ๆ กัน คนละกี่ชิ้น?', choices: ['3 ชิ้น', '5 ชิ้น', '6 ชิ้น', '9 ชิ้น'], answerIndex: 2, explanation: '18 ÷ 3 = 6 ชิ้นต่อคน', subject: 'คณิตศาสตร์', grade: 'ป.3', difficulty: 'ปานกลาง' },
  { question: 'โลกได้รับแสงและความร้อนจากดาวดวงใด?', choices: ['ดวงจันทร์', 'ดาวอังคาร', 'ดวงอาทิตย์', 'ดาวเหนือ'], answerIndex: 2, explanation: 'ดวงอาทิตย์เป็นแหล่งพลังงานหลักของโลก', subject: 'วิทยาศาสตร์', grade: 'ป.4', difficulty: 'ง่าย' },
  { question: 'คำตรงข้ามของ “สูง” คือข้อใด?', choices: ['ใหญ่', 'เตี้ย', 'กว้าง', 'ยาว'], answerIndex: 1, explanation: 'สูงและเตี้ยเป็นคำที่มีความหมายตรงข้ามกัน', subject: 'ภาษาไทย', grade: 'ป.2', difficulty: 'ง่าย' },
];

export const DEFAULT_QUESTIONS: QuizQuestion[] = raw.map((q, i) => ({ ...q, id: `starter-${i + 1}`, setId: DEFAULT_SET_ID }));

export const DEFAULT_SETS: QuestionSet[] = [{
  id: DEFAULT_SET_ID,
  name: 'ชุดเริ่มต้น ป.2–ป.4',
  description: 'ตัวอย่างคำถามหลายวิชาสำหรับทดสอบเกม สามารถแก้ไขหรือนำเข้าชุดใหม่ได้',
  subject: 'หลายวิชา' as Subject | 'หลายวิชา',
  updatedAt: new Date().toISOString(),
  questionIds: DEFAULT_QUESTIONS.map((q) => q.id),
}];
