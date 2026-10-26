import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameCanvas } from './components/GameCanvas';
import { QuestionManager } from './components/QuestionManager';
import { GHOSTS, PLANTS, STAGES, type PlantId } from './game/config';
import { importQuestionPackage, loadSave, packageQuestions, validateQuestionPackage, writeSave } from './storage/database';
import type { GameSave, PlayerProgress, QuizQuestion } from './types';
import type { GameStats } from './game/GameScene';
import './styles.css';

type Page = 'home' | 'stages' | 'battle' | 'questions' | 'settings' | 'backup';
type BattleResult = { won: boolean; stats: GameStats };

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function pickQuestion(questions: QuizQuestion[], used: Set<string>): QuizQuestion | null {
  if (!questions.length) return null;
  let available = questions.filter((q) => !used.has(q.id));
  if (!available.length) { used.clear(); available = [...questions]; }
  const q = available[Math.floor(Math.random() * available.length)];
  used.add(q.id);
  return q;
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [save, setSave] = useState<GameSave | null>(null);
  const [loadingError, setLoadingError] = useState('');
  const [saving, setSaving] = useState(false);
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const [selectedStage, setSelectedStage] = useState(1);
  const [selectedPlant, setSelectedPlant] = useState<PlantId>('lotus');
  const [stats, setStats] = useState<GameStats>({ mana: 150, health: 5, score: 0, kills: 0, spawned: 0, target: 10, streak: 0, stageName: STAGES[0].name, status: 'playing' });
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState<number | null>(null);
  const [questionModal, setQuestionModal] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [toast, setToast] = useState('');
  const [offlineStatus, setOfflineStatus] = useState<'checking' | 'ready' | 'not-ready'>('checking');
  const [backupNotice, setBackupNotice] = useState('');
  const usedQuestions = useRef(new Set<string>());
  const saveRef = useRef<GameSave | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => { saveRef.current = save; }, [save]);
  useEffect(() => {
    let mounted = true;
    loadSave().then((data) => { if (mounted) { setSave(data); setLoadingError(''); } }).catch((error: unknown) => {
      if (mounted) setLoadingError(error instanceof Error ? error.message : 'เปิดฐานข้อมูลในเครื่องไม่สำเร็จ');
    });
    return () => { mounted = false; if (toastTimer.current) window.clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) { setOfflineStatus('not-ready'); return; }
    navigator.serviceWorker.register('./sw.js').then(async (registration) => {
      await navigator.serviceWorker.ready;
      if (navigator.onLine) setOfflineStatus('ready');
      else setOfflineStatus(registration.active ? 'ready' : 'not-ready');
    }).catch(() => setOfflineStatus('not-ready'));
    const onOnline = () => setOfflineStatus('ready');
    const onOffline = () => setOfflineStatus('ready'); // app shell is local after service-worker control
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const commit = useCallback(async (next: GameSave) => {
    const normalized = { ...next, updatedAt: new Date().toISOString() };
    setSave(normalized); saveRef.current = normalized; setSaving(true);
    try { await writeSave(normalized); setLoadingError(''); }
    catch (error) { setLoadingError(error instanceof Error ? error.message : 'บันทึกข้อมูลในเครื่องไม่สำเร็จ'); }
    finally { setSaving(false); }
  }, []);

  const goPage = (next: Page) => {
    if (next !== 'battle') setGame(null);
    setPage(next); setToast('');
    if (next !== 'battle') { setQuestionModal(false); setBattleResult(null); }
  };

  const activeSet = useMemo(() => save?.sets.find((s) => s.id === save.activeSetId) ?? save?.sets[0], [save]);
  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }

  useEffect(() => {
    if (!game) return;
    const onStats = (next: GameStats) => setStats(next);
    const onToast = (message: string) => showToast(message);
    const onQuiz = () => {
      const current = saveRef.current;
      if (!current) return;
      const set = current.sets.find((s) => s.id === current.activeSetId) ?? current.sets[0];
      const qs = current.questions.filter((q) => q.setId === set?.id);
      const pool = qs.length ? qs : current.questions;
      const question = pickQuestion(pool, usedQuestions.current);
      if (!question) { showToast('ยังไม่มีคำถามในชุดนี้ ไปที่จัดการคำถามเพื่อเพิ่มคำถามก่อน'); return; }
      const scene = game.scene.getScene('GameScene');
      scene.scene.pause();
      setCurrentQuestion(question); setQuestionAnswer(null); setQuestionModal(true);
    };
    const onEnd = (result: BattleResult) => {
      setBattleResult(result); setQuestionModal(false);
      const current = saveRef.current;
      if (!current) return;
      const stars = result.won ? (result.stats.health >= 4 ? 3 : result.stats.health >= 2 ? 2 : 1) : 0;
      const progress: PlayerProgress = {
        ...current.progress,
        score: current.progress.score + result.stats.score,
        unlockedStage: result.won ? Math.max(current.progress.unlockedStage, Math.min(3, selectedStage + 1)) : current.progress.unlockedStage,
        starsByStage: result.won ? { ...current.progress.starsByStage, [selectedStage]: Math.max(current.progress.starsByStage[String(selectedStage)] ?? 0, stars) } : current.progress.starsByStage,
        gamesPlayed: current.progress.gamesPlayed + 1,
      };
      void commit({ ...current, progress });
    };
    game.events.on('stats-changed', onStats);
    game.events.on('toast', onToast);
    game.events.on('quiz-requested', onQuiz);
    game.events.on('game-ended', onEnd);
    return () => {
      game.events.off('stats-changed', onStats); game.events.off('toast', onToast); game.events.off('quiz-requested', onQuiz); game.events.off('game-ended', onEnd);
    };
  }, [game, commit, selectedStage]);

  useEffect(() => {
    if (!game || page !== 'battle' || !save) return;
    const scene = game.scene.getScene('GameScene');
    scene.events.emit('set-game-settings', save.settings);
    scene.events.emit('reset-game', selectedStage);
    setSelectedPlant('lotus');
    usedQuestions.current.clear(); setBattleResult(null); setCurrentQuestion(null); setQuestionAnswer(null); setQuestionModal(false);
  }, [game, selectedStage, page, save?.settings]);

  function startStage(stage: number) {
    setSelectedStage(stage); setPage('battle'); setGame(null); setQuestionModal(false); setBattleResult(null); usedQuestions.current.clear();
  }

  function answerQuestion(index: number) {
    if (!save || !currentQuestion || questionAnswer !== null) return;
    setQuestionAnswer(index);
    const correct = index === currentQuestion.answerIndex;
    const nextProgress = { ...save.progress, answeredQuestions: save.progress.answeredQuestions + 1, correctAnswers: save.progress.correctAnswers + (correct ? 1 : 0) };
    void commit({ ...save, progress: nextProgress });
    if (game) {
      const scene = game.scene.getScene('GameScene');
      scene.events.emit('answer-question', { correct, reward: save.settings.rewardCorrect, streakEvery: save.settings.questionStreakEvery, streakBonus: save.settings.questionStreakBonus });
    }
  }

  function updateSetting<K extends keyof GameSave['settings']>(key: K, value: GameSave['settings'][K]) {
    if (!save) return;
    void commit({ ...save, settings: { ...save.settings, [key]: value } });
  }

  async function exportQuestionsJson() {
    if (!save || !activeSet) return;
    const questions = save.questions.filter((q) => q.setId === activeSet.id);
    const pkg = packageQuestions([{ ...activeSet, questionIds: questions.map((q) => q.id) }], questions);
    downloadFile('quiz-defense-questions.json', JSON.stringify(pkg, null, 2), 'application/json;charset=utf-8');
  }

  async function importJson(file?: File, mode: 'add' | 'replace' = 'add') {
    if (!file || !save) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (parsed && typeof parsed === 'object' && (parsed as { app?: string }).app === 'quiz-defense') {
        const pkg = validateQuestionPackage(parsed);
        if (mode === 'replace' && !window.confirm('การแทนที่ชุดคำถามจะลบชุดคำถามทั้งหมดที่มีอยู่ในเครื่อง ยืนยันหรือไม่?')) return;
        const next = importQuestionPackage(save, pkg, mode);
        await commit(next); setBackupNotice(`นำเข้าชุดคำถามสำเร็จ ${pkg.questions.length} ข้อ`);
      } else if (parsed && typeof parsed === 'object' && (parsed as { app?: string }).app === 'quiz-defense-backup') {
        const pack = parsed as { version?: number; save?: GameSave };
        if (pack.version !== 1 || !pack.save || !Array.isArray(pack.save.questions) || !Array.isArray(pack.save.sets) || !pack.save.progress || !pack.save.settings) throw new Error('ไฟล์สำรองไม่ครบถ้วนหรือไม่ใช่เวอร์ชันที่รองรับ');
        if (!window.confirm('การกู้คืนไฟล์สำรองจะแทนที่ข้อมูลคำถาม คะแนน และการตั้งค่าปัจจุบัน ดำเนินการหรือไม่?')) return;
        await commit(pack.save); setBackupNotice('กู้คืนข้อมูลสำรองเรียบร้อย');
      } else throw new Error('ไฟล์ไม่ใช่ชุดคำถาม Quiz Defense หรือไฟล์สำรองที่รองรับ');
    } catch (error) { setBackupNotice(error instanceof Error ? error.message : 'อ่านไฟล์ไม่สำเร็จ'); }
  }

  if (loadingError && !save) return <main className="loading-screen"><div className="logo-mark">☯</div><h1>Quiz Defense</h1><p>เปิดฐานข้อมูลในเครื่องไม่สำเร็จ</p><p className="error-text">{loadingError}</p><button className="button primary" onClick={() => window.location.reload()}>ลองอีกครั้ง</button></main>;
  if (!save) return <main className="loading-screen"><div className="spirit-orb">🪬</div><h1>Quiz Defense</h1><p>กำลังเตรียมคลังคำถามในเครื่อง…</p></main>;

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => goPage('home')} aria-label="กลับหน้าหลัก"><span className="brand-icon">🧿</span><span><strong>QUIZ <em>DEFENSE</em></strong><small>ศึกหมอผีพิทักษ์อาคม</small></span></button>
      <nav className="main-nav" aria-label="เมนูหลัก">
        <button className={page === 'home' ? 'active' : ''} onClick={() => goPage('home')}>หน้าแรก</button>
        <button className={page === 'stages' ? 'active' : ''} onClick={() => goPage('stages')}>เลือกด่าน</button>
        <button className={page === 'questions' ? 'active' : ''} onClick={() => goPage('questions')}>คลังคำถาม</button>
        <button className={page === 'backup' ? 'active' : ''} onClick={() => goPage('backup')}>ข้อมูลสำรอง</button>
      </nav>
      <div className="top-status"><span className={`status-dot ${offlineStatus === 'ready' ? 'online' : 'warning'}`} />{offlineStatus === 'ready' ? 'ออฟไลน์พร้อมใช้' : offlineStatus === 'not-ready' ? 'ยังไม่พร้อมออฟไลน์' : 'กำลังตรวจสอบ'}<span className="save-indicator">{saving ? 'กำลังบันทึก…' : '● บันทึกในเครื่อง'}</span></div>
    </header>

    {loadingError && <div className="global-warning">⚠ {loadingError}</div>}

    {page === 'home' && <main className="home-screen">
      <div className="home-art"><div className="mist mist-one" /><div className="mist mist-two" /><div className="moon-art">☾</div><div className="floating-spirit spirit-one">🔥</div><div className="floating-spirit spirit-two">👻</div><div className="shrine">⛩️</div><div className="grass-row">🌿　🌱　🍃　🌾　🌿　🌱　🍃</div><div className="hero-ghost">👻</div><div className="hero-kumarn">🧙🏻‍♂️</div><div className="hero-stamp">ยันต์<br />อาคม</div></div>
      <div className="home-copy"><p className="eyebrow">LEARN · PLANT · DEFEND</p><h1><span>Quiz</span><strong>Defense</strong></h1><h2>ศึกหมอผีพิทักษ์อาคม</h2><p className="home-description">ตอบคำถามให้ถูก สะสมพลังอาคม แล้ววางผู้พิทักษ์เพื่อปกป้องหมู่บ้านจากเหล่าผีไทย</p>
        <div className="home-cta"><button className="button play-button" onClick={() => goPage('stages')}>▶ เริ่มการผจญภัย</button><button className="button secondary" onClick={() => goPage('questions')}>✦ จัดการคำถาม</button><button className="button ghost" onClick={() => goPage('settings')}>⚙ ตั้งค่าเกม</button></div>
        <div className="stats-strip"><div><strong>{save.progress.score.toLocaleString('th-TH')}</strong><span>คะแนนสะสม</span></div><div><strong>{Object.values(save.progress.starsByStage).reduce((a, b) => a + b, 0)} ⭐</strong><span>ดาวที่ได้รับ</span></div><div><strong>{save.questions.length}</strong><span>คำถามในเครื่อง</span></div></div>
      </div>
      <div className="home-bottom"><span>☀ ตอบถูกเพื่อรับพลังอาคม</span><i /><span>🪷 เลือกผู้พิทักษ์ให้เหมาะกับผี</span><i /><span>🛡️ ข้อมูลเก็บไว้ในเครื่อง</span></div>
    </main>}

    {page === 'stages' && <main className="stage-page">
      <div className="page-heading"><div><p className="eyebrow">SPIRIT WORLD · MAP</p><h1>เลือกด่านผจญภัย</h1><p>ผ่านด่านเพื่อปลดล็อกเส้นทางใหม่ของหมู่บ้านวิญญาณ</p></div><div className="score-chip">🏆 คะแนนสะสม <strong>{save.progress.score.toLocaleString('th-TH')}</strong></div></div>
      <div className="stage-grid">{STAGES.map((stage, i) => { const unlocked = stage.id <= save.progress.unlockedStage; const stars = save.progress.starsByStage[String(stage.id)] ?? 0; return <article key={stage.id} className={`stage-card stage-${stage.id} ${unlocked ? '' : 'locked'}`}><div className="stage-visual"><span className="stage-number">ด่าน {stage.id}</span><span className="stage-art">{['🏡','🎋','🛕'][i]}</span><span className="stage-spirits">{['✨ 👻 ✨','🔮 👻 🌿','👹 🔥 👻'][i]}</span>{!unlocked && <span className="lock-overlay">🔒</span>}</div><div className="stage-details"><div className="stage-level-row"><span className={`difficulty ${stage.difficulty}`}>{stage.difficulty}</span><span className="stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span></div><h2>{stage.name}</h2><p>{stage.subtitle}</p><div className="stage-meta"><span>👻 {stage.enemies} ตัว</span><span>🛡️ 5 ชีวิต</span></div><button disabled={!unlocked} className={`button ${unlocked ? 'primary' : 'muted'}`} onClick={() => startStage(stage.id)}>{unlocked ? 'เข้าสู่ด่าน →' : 'ยังไม่ปลดล็อก'}</button></div></article>; })}</div>
      <div className="info-panel"><span className="info-icon">💡</span><p><strong>เคล็ดลับหมอผี:</strong> วางกุมารวิญญาณเพื่อสร้างพลังอาคม และใช้ดอกบัวอาคมโจมตีจากด้านหลัง อย่าลืมตอบคำถามเพื่อเติมพลัง!</p></div>
    </main>}

    {page === 'battle' && <main className="battle-page">
      <div className="battle-header"><div><p className="eyebrow">STAGE {selectedStage} · DEFENSE MODE</p><h1>{STAGES.find((s) => s.id === selectedStage)?.name}</h1></div><div className="battle-mini-stats"><span>☀ <b>{stats.mana}</b></span><span>❤ <b>{stats.health}/{save.settings.baseHealth}</b></span><span>★ <b>{stats.score}</b></span><button className="button ghost compact" onClick={() => goPage('stages')}>ออกจากด่าน</button></div></div>
      <div className="battle-layout">
        <section className="game-board-panel"><GameCanvas key={`game-${selectedStage}-${page}`} stage={selectedStage} onReady={setGame} /><div className="board-footer"><span>🟢 แตะช่องในสนามเพื่อวางผู้พิทักษ์</span><span>ด่าน {selectedStage} · ผีที่เกิด {stats.spawned}/{stats.target}</span></div></section>
        <aside className="battle-sidebar">
          <section className="panel mana-panel"><div className="panel-title"><span>☀ พลังอาคม</span><strong>{stats.mana}</strong></div><div className="mana-track"><span style={{ width: `${Math.min(100, stats.mana / 3)}%` }} /></div><button className="button quiz-button" disabled={!game || stats.status !== 'playing'} onClick={() => game?.events.emit('quiz-requested')}>❔ ท้าทายความรู้ <small>ตอบถูก +{save.settings.rewardCorrect} พลัง</small></button><div className="streak-note">{stats.streak > 0 ? `🔥 ตอบถูกต่อเนื่อง ${stats.streak} ข้อ` : 'ตอบถูกต่อเนื่องเพื่อรับโบนัส'}</div></section>
          <section className="panel plant-panel"><div className="panel-title"><span>🌱 เลือกผู้พิทักษ์</span><span className="muted-small">แตะเพื่อเลือก</span></div><div className="plant-picker">{PLANTS.map((plant) => <button key={plant.id} className={`plant-card ${selectedPlant === plant.id ? 'chosen' : ''} ${stats.mana < plant.cost ? 'unaffordable' : ''}`} onClick={() => { setSelectedPlant(plant.id); if (game) game.scene.getScene('GameScene').events.emit('selected-plant', plant.id); }}><span className="plant-emoji">{plant.emoji}</span><strong>{plant.name}</strong><small>{plant.role}</small><span className="plant-cost">☀ {plant.cost}</span></button>)}</div><p className="selected-tip">{PLANTS.find((p) => p.id === selectedPlant)?.description}</p></section>
          <section className="panel enemy-panel"><div className="panel-title"><span>👻 สารานุกรมผี</span><button className="text-button" onClick={() => showToast('ผีแต่ละชนิดมีพลังชีวิตและความเร็วแตกต่างกัน วางผู้พิทักษ์ให้ตรงเลน!')}>ⓘ วิธีรับมือ</button></div><div className="ghost-mini-list">{GHOSTS.map((ghost) => <div key={ghost.id} className="ghost-mini"><span>{ghost.emoji}</span><div><strong>{ghost.name}</strong><small>{ghost.description}</small></div><em>{ghost.hp} HP</em></div>)}</div></section>
        </aside>
      </div>
      {questionModal && currentQuestion && <div className="modal-backdrop"><section className="quiz-modal" role="dialog" aria-modal="true" aria-label="ตอบคำถาม"><div className="quiz-modal-top"><span className="quiz-sigil">✦</span><div><p className="eyebrow">คำท้าทายจากตำราอาคม</p><h2>ตอบให้ถูกเพื่อรับพลัง!</h2></div><button className="close-modal" disabled={questionAnswer === null} onClick={() => setQuestionModal(false)}>×</button></div><div className="quiz-meta"><span>{currentQuestion.subject}</span><span>{currentQuestion.grade}</span><span>{currentQuestion.difficulty}</span></div><p className="quiz-question-text">{currentQuestion.question}</p><div className="quiz-options">{currentQuestion.choices.map((choice, i) => { const answered = questionAnswer !== null; const isCorrect = i === currentQuestion.answerIndex; return <button key={i} disabled={answered} className={`quiz-option ${answered && isCorrect ? 'correct' : ''} ${answered && questionAnswer === i && !isCorrect ? 'wrong' : ''}`} onClick={() => answerQuestion(i)}><span>{String.fromCharCode(65 + i)}</span>{choice}{answered && isCorrect && <b>✓</b>}</button>; })}</div>{questionAnswer !== null && <div className={`explanation-box ${questionAnswer === currentQuestion.answerIndex ? 'good' : 'try-again'}`}><strong>{questionAnswer === currentQuestion.answerIndex ? '✨ เยี่ยมมาก ตอบถูก!' : '🌱 ไม่เป็นไร ลองเรียนรู้จากเฉลยนะ'}</strong><p>{currentQuestion.explanation || `คำตอบที่ถูกคือ ${currentQuestion.choices[currentQuestion.answerIndex]}`}</p><button className="button primary" onClick={() => { setQuestionModal(false); game?.scene.getScene('GameScene').scene.resume(); }}>กลับไปป้องกันหมู่บ้าน</button></div>}</section></div>}
      {battleResult && <div className="modal-backdrop"><section className="result-modal" role="dialog" aria-modal="true"><div className={`result-emblem ${battleResult.won ? 'victory' : 'defeat'}`}>{battleResult.won ? '🏆' : '🧿'}</div><p className="eyebrow">{battleResult.won ? 'VILLAGE PROTECTED' : 'KEEP PRACTICING'}</p><h2>{battleResult.won ? 'ปกป้องหมู่บ้านสำเร็จ!' : 'พลังอาคมหมดลง…'}</h2><p>{battleResult.won ? 'เหล่าผีถอยกลับไปแล้ว หมู่บ้านปลอดภัยอีกครั้ง' : 'ลองวางผู้พิทักษ์และตอบคำถามให้มากขึ้น แล้วกลับมาสู้อีกครั้ง'}</p>{battleResult.won && <div className="result-stars">{'★'.repeat(battleResult.stats.health >= 4 ? 3 : battleResult.stats.health >= 2 ? 2 : 1)}{'☆'.repeat(battleResult.stats.health >= 4 ? 0 : battleResult.stats.health >= 2 ? 1 : 2)}</div>}<div className="result-numbers"><div><strong>{battleResult.stats.score}</strong><span>คะแนน</span></div><div><strong>{battleResult.stats.kills}</strong><span>กำจัดผี</span></div><div><strong>{battleResult.stats.health}/5</strong><span>พลังฐานเหลือ</span></div></div><div className="result-actions"><button className="button primary" onClick={() => { setBattleResult(null); startStage(selectedStage); }}>↻ เล่นอีกครั้ง</button>{battleResult.won && selectedStage < 3 && selectedStage < save.progress.unlockedStage + 1 && <button className="button secondary" onClick={() => startStage(selectedStage + 1)}>ด่านถัดไป →</button>}<button className="button ghost" onClick={() => goPage('stages')}>กลับหน้าเลือกด่าน</button></div></section></div>}
    </main>}

    {page === 'questions' && <QuestionManager save={save} onChange={commit} />}

    {page === 'settings' && <main className="settings-page"><div className="page-heading"><div><p className="eyebrow">GAME BALANCE</p><h1>ตั้งค่าเกม</h1><p>ปรับสมดุลได้จากข้อมูลที่บันทึกไว้ในเครื่อง</p></div></div><div className="settings-grid"><section className="panel settings-card"><h2>⚖️ สมดุลการเล่น</h2><p className="muted">การเปลี่ยนค่าจะมีผลเมื่อเริ่มด่านใหม่</p><label className="setting-row"><span><strong>พลังอาคมเมื่อตอบถูก</strong><small>พลังที่ได้รับต่อหนึ่งคำตอบถูก</small></span><input type="number" min={5} max={100} step={5} value={save.settings.rewardCorrect} onChange={(e) => updateSetting('rewardCorrect', Math.max(5, Math.min(100, Number(e.target.value) || 5)))} /></label><label className="setting-row"><span><strong>พลังอาคมเริ่มต้น</strong><small>พลังที่มีเมื่อเริ่มด่าน</small></span><input type="number" min={0} max={500} step={25} value={save.settings.startingMana} onChange={(e) => updateSetting('startingMana', Math.max(0, Math.min(500, Number(e.target.value) || 0)))} /></label><label className="setting-row"><span><strong>พลังชีวิตฐาน</strong><small>จำนวนครั้งที่ผีผ่านฐานได้</small></span><input type="number" min={1} max={10} value={save.settings.baseHealth} onChange={(e) => updateSetting('baseHealth', Math.max(1, Math.min(10, Number(e.target.value) || 1)))} /></label><label className="setting-row"><span><strong>โบนัสตอบต่อเนื่อง</strong><small>จำนวนพลังพิเศษเมื่อทำสตรีคครบ</small></span><input type="number" min={0} max={50} step={5} value={save.settings.questionStreakBonus} onChange={(e) => updateSetting('questionStreakBonus', Math.max(0, Math.min(50, Number(e.target.value) || 0)))} /></label><label className="setting-row"><span><strong>จำนวนข้อก่อนรับโบนัส</strong><small>ตอบถูกติดต่อกันกี่ข้อ</small></span><input type="number" min={2} max={10} value={save.settings.questionStreakEvery} onChange={(e) => updateSetting('questionStreakEvery', Math.max(2, Math.min(10, Number(e.target.value) || 2)))} /></label><label className="setting-row"><span><strong>เวลาระหว่างผีเกิด (ms)</strong><small>ปรับความเร็วการบุก</small></span><input type="number" min={2500} max={10000} step={500} value={save.settings.enemySpawnMs} onChange={(e) => updateSetting('enemySpawnMs', Math.max(2500, Math.min(10000, Number(e.target.value) || 2500)))} /></label><label className="setting-row"><span><strong>จำนวนผีพื้นฐานต่อด่าน</strong><small>จำนวนเพิ่มขึ้นตามระดับด่าน</small></span><input type="number" min={5} max={30} value={save.settings.maxEnemies} onChange={(e) => updateSetting('maxEnemies', Math.max(5, Math.min(30, Number(e.target.value) || 5)))} /></label></section><section className="panel settings-card"><h2>📊 ความคืบหน้าผู้เล่น</h2><div className="progress-summary"><div><strong>{save.progress.gamesPlayed}</strong><span>ด่านที่เล่นจบ</span></div><div><strong>{save.progress.answeredQuestions}</strong><span>จำนวนคำตอบ</span></div><div><strong>{save.progress.correctAnswers}</strong><span>ตอบถูก</span></div></div><div className="accuracy-track"><span style={{ width: `${save.progress.answeredQuestions ? save.progress.correctAnswers / save.progress.answeredQuestions * 100 : 0}%` }} /></div><p className="muted">อัตราตอบถูก {save.progress.answeredQuestions ? Math.round(save.progress.correctAnswers / save.progress.answeredQuestions * 100) : 0}%</p><button className="button secondary" onClick={() => goPage('backup')}>จัดการไฟล์สำรองข้อมูล</button><button className="button danger" onClick={() => { if (!window.confirm('ล้างคะแนนและความคืบหน้าทั้งหมดหรือไม่? ชุดคำถามจะไม่ถูกลบ')) return; void commit({ ...save, progress: { score: 0, unlockedStage: 1, starsByStage: {}, gamesPlayed: 0, correctAnswers: 0, answeredQuestions: 0 } }); }}>รีเซ็ตความคืบหน้า</button></section></div></main>}

    {page === 'backup' && <main className="backup-page"><div className="page-heading"><div><p className="eyebrow">LOCAL DATA · NO CLOUD API</p><h1>นำเข้า / ส่งออกข้อมูล</h1><p>ย้ายชุดคำถามระหว่างคอมพิวเตอร์และ iPad ด้วยไฟล์ JSON หรือ CSV</p></div></div><div className="backup-grid"><section className="panel backup-card"><div className="backup-icon">📚</div><h2>ชุดคำถาม</h2><p>ส่งออกเฉพาะชุดคำถามที่เลือก หรือดาวน์โหลดไฟล์ตัวอย่างไปแก้ไขในโปรแกรมตารางคำนวณ</p><label className="field-label">ชุดคำถาม<select value={save.activeSetId} onChange={(e) => void commit({ ...save, activeSetId: e.target.value })}>{save.sets.map((s) => <option key={s.id} value={s.id}>{s.name} · {save.questions.filter((q) => q.setId === s.id).length} ข้อ</option>)}</select></label><div className="button-stack"><button className="button primary" onClick={() => void exportQuestionsJson()}>↓ ส่งออก JSON</button><button className="button secondary" onClick={() => { if (!activeSet) return; const qs = save.questions.filter((q) => q.setId === activeSet.id); downloadFile('quiz-defense-questions.csv', csvExportForSet(activeSet.name, qs), 'text/csv;charset=utf-8'); }}>↓ ส่งออก CSV</button><label className="button ghost file-button">↑ นำเข้า JSON<input type="file" accept=".json,application/json" onChange={(e) => { void importJson(e.target.files?.[0], 'add'); e.currentTarget.value = ''; }} /></label><label className="button ghost file-button">แทนที่ชุดคำถาม JSON<input type="file" accept=".json,application/json" onChange={(e) => { void importJson(e.target.files?.[0], 'replace'); e.currentTarget.value = ''; }} /></label><label className="button ghost file-button">↑ นำเข้า CSV<input type="file" accept=".csv,text/csv" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { const { csvToQuestions } = await import('./utils/csv'); const parsed = csvToQuestions(await file.text()); const suffix = Date.now().toString(36); const sets = parsed.sets.map((s, i) => ({ ...s, id: `${s.id}-${suffix}-${i}`, questionIds: [] as string[] })); const map = new Map(parsed.sets.map((s, i) => [s.id, sets[i].id])); const questions = parsed.questions.map((q, i) => ({ ...q, id: `${q.id}-${suffix}-${i}`, setId: map.get(q.setId)! })); sets.forEach((s) => { s.questionIds = questions.filter((q) => q.setId === s.id).map((q) => q.id); }); await commit({ ...save, sets: [...save.sets, ...sets], questions: [...save.questions, ...questions], activeSetId: sets[0]?.id ?? save.activeSetId }); setBackupNotice(`นำเข้า CSV สำเร็จ ${questions.length} ข้อ`); } catch (error) { setBackupNotice(error instanceof Error ? error.message : 'อ่าน CSV ไม่สำเร็จ'); } } e.currentTarget.value = ''; }} /></label></div></section><section className="panel backup-card"><div className="backup-icon">💾</div><h2>สำรองข้อมูลทั้งหมด</h2><p>เก็บชุดคำถาม คะแนน ดาว ด่านที่ปลดล็อก และการตั้งค่าทั้งหมดในไฟล์เดียว</p><div className="backup-includes">{['ชุดคำถามและคำถามทั้งหมด', 'คะแนนและจำนวนดาว', 'ด่านที่ปลดล็อก', 'การตั้งค่าเกม'].map((item) => <div key={item}>✓ {item}</div>)}</div><button className="button primary" onClick={() => downloadFile('quiz-defense-backup.json', JSON.stringify({ app: 'quiz-defense-backup', version: 1, exportedAt: new Date().toISOString(), save }, null, 2), 'application/json;charset=utf-8')}>↓ ส่งออกข้อมูลสำรอง</button><label className="button secondary file-button">↑ กู้คืนข้อมูลสำรอง<input type="file" accept=".json,application/json" onChange={(e) => { void importJson(e.target.files?.[0], 'replace'); e.currentTarget.value = ''; }} /></label><p className="warning-text">การกู้คืนจะเขียนทับข้อมูลปัจจุบัน ควรส่งออกสำรองข้อมูลก่อนทุกครั้ง</p></section></div>{backupNotice && <div className="notice backup-notice" role="status">{backupNotice}</div>}<section className="panel data-location-panel"><span className="data-shield">🛡️</span><div><h3>ข้อมูลเป็นของคุณ อยู่ในเครื่องนี้</h3><p>Quiz Defense ใช้ IndexedDB ในเบราว์เซอร์ ไม่ส่งคำถามหรือคะแนนไปที่เซิร์ฟเวอร์ การล้างข้อมูลเว็บไซต์หรือถอนข้อมูล Safari อาจทำให้ข้อมูลในเครื่องหายได้ ควรสำรองข้อมูลเป็นระยะ</p></div></section></main>}

    {toast && <div className="toast" role="status">✨ {toast}</div>}
    <footer className="app-footer"><span>QUIZ DEFENSE · ศึกหมอผีพิทักษ์อาคม</span><span>☯ เล่นออฟไลน์ได้หลังเตรียมข้อมูลครบ · ข้อมูลเก็บในเครื่อง</span><button onClick={() => goPage('settings')}>ตั้งค่า</button></footer>
  </div>;
}

function csvExportForSet(name: string, questions: QuizQuestion[]) {
  const headers = ['setName', 'question', 'choiceA', 'choiceB', 'choiceC', 'choiceD', 'answerIndex', 'explanation', 'subject', 'grade', 'difficulty'];
  const quote = (v: string) => /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return '\uFEFF' + [headers, ...questions.map((q) => [name, q.question, ...q.choices, String(q.answerIndex), q.explanation, q.subject, q.grade, q.difficulty])].map((row) => row.map(quote).join(',')).join('\r\n');
}
