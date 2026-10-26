import { useMemo, useState } from 'react';
import type { QuizQuestion, QuestionSet, Subject, Difficulty } from '../types';
import { csvToQuestions } from '../utils/csv';
import type { GameSave } from '../types';

const subjects: Subject[] = ['คณิตศาสตร์', 'ภาษาอังกฤษ', 'วิทยาศาสตร์', 'ภาษาไทย', 'สังคมศึกษา'];
const difficulties: Difficulty[] = ['ง่าย', 'ปานกลาง', 'ยาก'];
const emptyForm = (): Omit<QuizQuestion, 'id'> => ({ setId: '', question: '', choices: ['', '', '', ''], answerIndex: 0, explanation: '', subject: 'คณิตศาสตร์', grade: 'ป.3', difficulty: 'ง่าย' });

interface Props { save: GameSave; onChange: (next: GameSave) => void; }
export function QuestionManager({ save, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ทั้งหมด');
  const [difficultyFilter, setDifficultyFilter] = useState('ทั้งหมด');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<QuizQuestion, 'id'>>(emptyForm());
  const [notice, setNotice] = useState('');
  const [setName, setSetName] = useState('ชุดคำถามใหม่');
  const [setNameDrafts, setSetNameDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => save.questions.filter((q) => {
    const matchesText = `${q.question} ${q.explanation} ${q.choices.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (subjectFilter === 'ทั้งหมด' || q.subject === subjectFilter) && (difficultyFilter === 'ทั้งหมด' || q.difficulty === difficultyFilter);
  }), [save.questions, query, subjectFilter, difficultyFilter]);

  function blankForSet(setId = save.activeSetId) { setEditingId(null); setForm({ ...emptyForm(), setId }); setNotice(''); }
  function editQuestion(q: QuizQuestion) { setEditingId(q.id); setForm({ ...q }); setNotice(''); }
  function saveQuestion() {
    if (!form.question.trim() || form.choices.some((choice) => !choice.trim()) || !form.setId) { setNotice('กรุณากรอกคำถาม ตัวเลือกทั้ง 4 ข้อ และเลือกชุดคำถาม'); return; }
    const id = editingId ?? `q-${Date.now().toString(36)}`;
    const question: QuizQuestion = { ...form, id, question: form.question.trim(), choices: form.choices.map((c) => c.trim()) as QuizQuestion['choices'] };
    const questions = editingId ? save.questions.map((q) => q.id === id ? question : q) : [...save.questions, question];
    const sets = save.sets.map((s) => s.id === form.setId ? { ...s, updatedAt: new Date().toISOString(), questionIds: [...new Set([...s.questionIds, id])] } : s);
    onChange({ ...save, questions, sets }); setNotice(editingId ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มคำถามแล้ว'); blankForSet(form.setId);
  }
  function deleteQuestion(q: QuizQuestion) {
    if (!window.confirm(`ลบคำถาม “${q.question}” หรือไม่?`)) return;
    onChange({ ...save, questions: save.questions.filter((item) => item.id !== q.id), sets: save.sets.map((s) => ({ ...s, questionIds: s.questionIds.filter((id) => id !== q.id) })) });
    if (editingId === q.id) blankForSet(); setNotice('ลบคำถามแล้ว');
  }
  function saveSetName(setId: string) {
    const name = (setNameDrafts[setId] ?? save.sets.find((s) => s.id === setId)?.name ?? '').trim();
    if (!name) { setNotice('ชื่อชุดคำถามห้ามว่าง'); return; }
    if (save.sets.some((s) => s.id !== setId && s.name.trim().toLowerCase() === name.toLowerCase())) { setNotice('มีชื่อชุดคำถามนี้แล้ว'); return; }
    onChange({ ...save, sets: save.sets.map((s) => s.id === setId ? { ...s, name, updatedAt: new Date().toISOString() } : s) });
    setSetNameDrafts((prev) => ({ ...prev, [setId]: name })); setNotice('แก้ไขชื่อชุดคำถามแล้ว');
  }
  function createSet() {
    const name = setName.trim(); if (!name) { setNotice('กรุณาตั้งชื่อชุดคำถาม'); return; }
    const id = `set-${Date.now().toString(36)}`;
    const set: QuestionSet = { id, name, description: 'ชุดคำถามที่สร้างในเครื่อง', subject: 'หลายวิชา', updatedAt: new Date().toISOString(), questionIds: [] };
    onChange({ ...save, sets: [...save.sets, set], activeSetId: id }); setSetName(''); blankForSet(id); setNotice(`สร้างชุด “${name}” แล้ว`);
  }
  async function importCsv(file?: File) {
    if (!file) return;
    try {
      const parsed = csvToQuestions(await file.text());
      const stamp = Date.now().toString(36);
      const idMap = new Map(parsed.sets.map((s, i) => [s.id, `${s.id}-${stamp}-${i}`]));
      const sets = parsed.sets.map((s) => ({ ...s, id: idMap.get(s.id)!, questionIds: [] as string[] }));
      const questions = parsed.questions.map((q, i) => ({ ...q, id: `${q.id}-${stamp}-${i}`, setId: idMap.get(q.setId)! }));
      sets.forEach((s) => { s.questionIds = questions.filter((q) => q.setId === s.id).map((q) => q.id); });
      onChange({ ...save, sets: [...save.sets, ...sets], questions: [...save.questions, ...questions], activeSetId: sets[0]?.id ?? save.activeSetId });
      setNotice(`นำเข้า CSV สำเร็จ ${questions.length} คำถาม`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'อ่าน CSV ไม่สำเร็จ'); }
  }

  return <div className="manager-page">
    <div className="page-heading"><div><p className="eyebrow">TEACHER TOOLS</p><h1>จัดการคลังคำถาม</h1><p>เพิ่มคำถามเป็นชุดและนำไปเล่นได้โดยไม่ต้องต่ออินเทอร์เน็ต</p></div><div className="heading-actions"><a className="button ghost sample-link" href="./samples/questions.csv" download="quiz-defense-sample.csv">ดาวน์โหลด CSV ตัวอย่าง</a><label className="button secondary file-button">นำเข้า CSV<input type="file" accept=".csv,text/csv" onChange={(e) => { void importCsv(e.target.files?.[0]); e.currentTarget.value = ''; }} /></label><button className="button primary" onClick={() => blankForSet()}>＋ เพิ่มคำถาม</button></div></div>
    <div className="manager-grid">
      <section className="panel editor-panel">
        <div className="panel-title"><span>{editingId ? '✏️ แก้ไขคำถาม' : '✨ สร้างคำถาม'}</span><span className="mini-tag">4 ตัวเลือก</span></div>
        <label className="field-label">ชุดคำถาม<select value={form.setId} onChange={(e) => setForm({ ...form, setId: e.target.value })}>{save.sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="field-label">คำถาม<textarea rows={3} value={form.question} placeholder="พิมพ์คำถามที่นี่..." onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
        <div className="choice-editor">{form.choices.map((choice, i) => <label className={`choice-input ${form.answerIndex === i ? 'is-answer' : ''}`} key={i}><button type="button" title="เลือกเป็นคำตอบที่ถูก" onClick={() => setForm({ ...form, answerIndex: i as 0 | 1 | 2 | 3 })}>{String.fromCharCode(65 + i)}</button><input value={choice} placeholder={`ตัวเลือก ${String.fromCharCode(65 + i)}`} onChange={(e) => setForm({ ...form, choices: form.choices.map((c, j) => j === i ? e.target.value : c) as QuizQuestion['choices'] })} /></label>)}</div>
        <label className="field-label">คำอธิบายเฉลย<textarea rows={2} value={form.explanation} placeholder="อธิบายให้เด็กเข้าใจว่าทำไมคำตอบนี้จึงถูก" onChange={(e) => setForm({ ...form, explanation: e.target.value })} /></label>
        <div className="field-row"><label className="field-label">วิชา<select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}>{subjects.map((s) => <option key={s}>{s}</option>)}</select></label><label className="field-label">ระดับชั้น<input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="เช่น ป.3" /></label></div>
        <label className="field-label">ระดับความยาก<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}>{difficulties.map((d) => <option key={d}>{d}</option>)}</select></label>
        <div className="answer-hint">✅ คำตอบที่ถูกต้อง: ตัวเลือก {String.fromCharCode(65 + form.answerIndex)}</div>
        {notice && <div className="notice" role="status">{notice}</div>}
        <div className="form-actions"><button className="button primary" onClick={saveQuestion}>{editingId ? 'บันทึกการแก้ไข' : 'เพิ่มคำถามในชุด'}</button><button className="button ghost" onClick={() => blankForSet()}>ล้างแบบฟอร์ม</button></div>
        <hr className="soft-divider" />
        <div className="panel-title"><span>📚 สร้างชุดคำถาม</span></div><div className="create-set-row"><input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="ชื่อชุดคำถาม" /><button className="button secondary" onClick={createSet}>สร้างชุด</button></div>
        <div className="set-manage-list">{save.sets.map((set) => <div className="set-manage-item" key={set.id}><input aria-label={`ชื่อชุด ${set.name}`} value={setNameDrafts[set.id] ?? set.name} onChange={(e) => setSetNameDrafts((prev) => ({ ...prev, [set.id]: e.target.value }))} /><span>{save.questions.filter((q) => q.setId === set.id).length} ข้อ</span><button className="button ghost compact" onClick={() => saveSetName(set.id)}>บันทึกชื่อ</button></div>)}</div>
      </section>
      <section className="panel list-panel">
        <div className="panel-title"><span>คลังคำถาม <strong className="count-pill">{filtered.length}</strong></span><span className="muted-small">บันทึกในเครื่อง</span></div>
        <div className="filter-row"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="⌕ ค้นหาคำถาม..." /><select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}><option>ทั้งหมด</option>{subjects.map((s) => <option key={s}>{s}</option>)}</select><select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}><option>ทั้งหมด</option>{difficulties.map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="question-list">{filtered.map((q) => <article className="question-row" key={q.id}><div className="question-bullet">Q</div><div className="question-row-content"><p>{q.question}</p><div className="question-meta"><span>{q.subject}</span><span>{q.grade}</span><span className={`difficulty ${q.difficulty}`}>{q.difficulty}</span></div><div className="correct-snippet">✓ {String.fromCharCode(65 + q.answerIndex)} · {q.choices[q.answerIndex]}</div></div><div className="row-actions"><button title="แก้ไข" onClick={() => editQuestion(q)}>✎</button><button title="ลบ" onClick={() => deleteQuestion(q)}>⌫</button></div></article>)}{filtered.length === 0 && <div className="empty-state">ไม่พบคำถามที่ตรงกับการค้นหา</div>}</div>
      </section>
    </div>
  </div>;
}
