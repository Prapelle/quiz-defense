import type { QuizQuestion, QuestionSet, Subject, Difficulty } from '../types';

const HEADERS = ['setName', 'question', 'choiceA', 'choiceB', 'choiceC', 'choiceD', 'answerIndex', 'explanation', 'subject', 'grade', 'difficulty'] as const;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); if (row.some((v) => v.trim())) rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (quoted) throw new Error('พบเครื่องหมายอัญประกาศเปิดค้างในไฟล์ CSV');
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); if (row.some((v) => v.trim())) rows.push(row); }
  return rows;
}

export function csvToQuestions(text: string): { questions: QuizQuestion[]; sets: QuestionSet[] } {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV ต้องมีแถวหัวตารางและคำถามอย่างน้อย 1 ข้อ');
  const header = rows[0].map((h) => h.trim());
  const missing = HEADERS.filter((h) => !header.includes(h));
  if (missing.length) throw new Error(`หัวตารางขาดคอลัมน์: ${missing.join(', ')}`);
  const index = (name: string) => header.indexOf(name);
  const setMap = new Map<string, QuestionSet>();
  const questions: QuizQuestion[] = rows.slice(1).map((values, i) => {
    const cell = (name: string) => (values[index(name)] ?? '').trim();
    const setName = cell('setName') || 'ชุดนำเข้า CSV';
    if (!setMap.has(setName)) setMap.set(setName, { id: `csv-${slug(setName)}-${setMap.size + 1}`, name: setName, description: 'นำเข้าจากไฟล์ CSV', subject: 'หลายวิชา', updatedAt: new Date().toISOString(), questionIds: [] });
    const question = cell('question');
    const choices = [cell('choiceA'), cell('choiceB'), cell('choiceC'), cell('choiceD')];
    const answerIndex = Number(cell('answerIndex'));
    if (!question) throw new Error(`แถว ${i + 2}: ไม่มีข้อความคำถาม`);
    if (choices.some((c) => !c)) throw new Error(`แถว ${i + 2}: ต้องใส่ตัวเลือก A-D ให้ครบ`);
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) throw new Error(`แถว ${i + 2}: answerIndex ต้องเป็น 0-3 (A=0, B=1, C=2, D=3)`);
    const subject = cell('subject') || 'คณิตศาสตร์';
    const difficulty = cell('difficulty') || 'ง่าย';
    if (!(['คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'ภาษาไทย', 'สังคมศึกษา'] as string[]).includes(subject)) throw new Error(`แถว ${i + 2}: วิชาไม่ถูกต้อง (${subject})`);
    if (!(['ง่าย', 'ปานกลาง', 'ยาก'] as string[]).includes(difficulty)) throw new Error(`แถว ${i + 2}: ระดับความยากต้องเป็น ง่าย, ปานกลาง หรือ ยาก`);
    const setId = setMap.get(setName)!.id;
    const id = `csv-q-${i + 1}-${slug(question).slice(0, 18)}`;
    setMap.get(setName)!.questionIds.push(id);
    return { id, setId, question, choices: choices as [string, string, string, string], answerIndex: answerIndex as 0 | 1 | 2 | 3, explanation: cell('explanation'), subject: subject as Subject, grade: cell('grade') || 'ไม่ระบุ', difficulty: difficulty as Difficulty };
  });
  return { questions, sets: [...setMap.values()] };
}

export function questionsToCsv(sets: QuestionSet[], questions: QuizQuestion[]): string {
  const setNames = new Map(sets.map((s) => [s.id, s.name]));
  const rows = [HEADERS as unknown as string[], ...questions.map((q) => [setNames.get(q.setId) ?? q.setId, q.question, ...q.choices, String(q.answerIndex), q.explanation, q.subject, q.grade, q.difficulty])];
  return '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
}

function escapeCsv(value: string): string { return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value; }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-|-$/g, '') || 'set'; }
