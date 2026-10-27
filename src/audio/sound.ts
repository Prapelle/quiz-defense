// Small Web Audio manager. Web Audio (not <audio>) is used because iPad Safari ignores
// HTMLAudioElement.volume, and decoded buffers play overlapping effects with low latency.

export type SfxName = 'click' | 'place' | 'correct' | 'wrong' | 'quiz' | 'shoot' | 'ghost-die' | 'ghost-spawn'
  | 'base-hit' | 'boss' | 'bomb' | 'wave' | 'win' | 'lose' | 'unlock';
export type MusicName = 'music-map' | 'music-battle';

export const SFX: SfxName[] = ['click', 'place', 'correct', 'wrong', 'quiz', 'shoot', 'ghost-die', 'ghost-spawn', 'base-hit', 'boss', 'bomb', 'wave', 'win', 'lose', 'unlock'];

/** Minimum gap between repeats so crowded battles never turn into noise. */
const MIN_GAP_MS: Partial<Record<SfxName, number>> = { shoot: 140, 'ghost-die': 90, 'ghost-spawn': 500, 'base-hit': 200, click: 60, place: 80 };
/** Per-sound loudness relative to the effects volume. */
const GAIN: Partial<Record<SfxName, number>> = { shoot: 0.35, 'ghost-spawn': 0.45, 'ghost-die': 0.6, click: 0.5, boss: 0.9 };

export interface SoundSettings { muted: boolean; musicVolume: number; sfxVolume: number }

const audioUrl = (name: string) => `./audio/${name}.mp3`;

class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  private lastPlayed = new Map<SfxName, number>();
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private currentMusic: MusicName | null = null;
  private wantedMusic: MusicName | null = null;
  private settings: SoundSettings = { muted: false, musicVolume: 0.45, sfxVolume: 0.8 };

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.ctx.destination);
    this.applyVolumes();
    return this.ctx;
  }

  /** Must run inside a user gesture on iOS; safe to call on every tap. */
  unlock(): void {
    const ctx = this.context();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume().then(() => this.syncMusic());
    if (!this.buffers.size && !this.loading.size) SFX.forEach((name) => void this.load(name));
    this.syncMusic();
  }

  configure(next: SoundSettings): void {
    this.settings = next;
    this.applyVolumes();
    this.syncMusic();
  }

  play(name: SfxName): void {
    if (this.settings.muted) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxGain) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < (MIN_GAP_MS[name] ?? 0)) return;
    const buffer = this.buffers.get(name);
    if (!buffer) { void this.load(name); return; }
    this.lastPlayed.set(name, now);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = GAIN[name] ?? 1;
    source.buffer = buffer;
    source.connect(gain).connect(this.sfxGain);
    source.start();
  }

  music(name: MusicName | null): void {
    this.wantedMusic = name;
    this.syncMusic();
  }

  private applyVolumes(): void {
    if (this.musicGain) this.musicGain.gain.value = this.settings.muted ? 0 : this.settings.musicVolume;
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.muted ? 0 : this.settings.sfxVolume;
  }

  private syncMusic(): void {
    const ctx = this.ctx;
    const wanted = this.settings.muted || this.settings.musicVolume <= 0 ? null : this.wantedMusic;
    if (wanted === this.currentMusic) return;
    this.musicSource?.stop(); this.musicSource?.disconnect(); this.musicSource = null; this.currentMusic = null;
    if (!wanted || !ctx || ctx.state !== 'running' || !this.musicGain) return;
    const buffer = this.buffers.get(wanted);
    if (!buffer) { void this.load(wanted).then(() => this.syncMusic()); return; }
    const source = ctx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    source.connect(this.musicGain); source.start();
    this.musicSource = source; this.currentMusic = wanted;
  }

  private load(name: string): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);
    const existing = this.buffers.get(name);
    if (existing) return Promise.resolve(existing);
    const pending = this.loading.get(name);
    if (pending) return pending;
    const promise = fetch(audioUrl(name))
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(response.statusText))))
      // Callback form keeps older Safari (which lacks the promise form) working.
      .then((data) => new Promise<AudioBuffer>((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
      .then((buffer) => { this.buffers.set(name, buffer); return buffer; })
      .catch(() => null)
      .finally(() => { this.loading.delete(name); });
    this.loading.set(name, promise);
    return promise;
  }
}

export const sound = new SoundManager();
