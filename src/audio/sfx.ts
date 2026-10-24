import barkUrl from '../assets/sounds/ladrido-bigsoundbank-2955.mp3';
import meowUrl from '../assets/sounds/maullido-bigsoundbank-0098.mp3';

/**
 * Sonidos del juego, con Web Audio.
 *
 * - Ladrido y maullido: grabaciones reales con licencia CC0 (BigSoundBank,
 *   ver src/assets/sounds/LICENCIAS.md), guardadas en el proyecto para que
 *   funcionen sin conexión. Si no se pueden cargar, se usa una versión
 *   sintetizada.
 * - El resto (croquetas, tensión, celebración…) es original y se sintetiza en
 *   el navegador.
 * - El contexto de audio se crea recién con un gesto del usuario, como exigen
 *   los navegadores (`unlockAudio`).
 * - Con el sonido desactivado no se crea ni se reproduce nada, y lo que esté
 *   sonando se corta al instante.
 * - Canales únicos: hay a lo sumo una "voz" (ladrido o maullido) y una
 *   ambientación de tensión a la vez; nunca se superponen instancias.
 */

export type Sfx = 'kibble' | 'oops' | 'tick' | 'go' | 'timeUp' | 'tap';
export type Voice = 'bark' | 'meow';

type AudioCtor = new () => AudioContext;

/**
 * Fragmento de cada grabación (segundos) y ganancia para igualar volúmenes.
 * Se reproduce siempre el mismo fragmento, para que el sonido sea idéntico al
 * elegir la especie y la raza; el archivo original no se modifica.
 * Ladrido: los dos primeros ladridos. Maullido: el segundo maullido de la grabación.
 */
interface VoiceClip {
  url: string;
  segment: [number, number];
  gain: number;
}

export const VOICE_CLIPS: Record<Voice, VoiceClip> = {
  bark: { url: barkUrl, segment: [0.06, 0.62], gain: 0.9 },
  meow: { url: meowUrl, segment: [1.1, 1.82], gain: 0.36 },
};

const VOICES = Object.keys(VOICE_CLIPS) as Voice[];
/** Si la grabación todavía se está decodificando, se espera hasta este tiempo antes de descartar el sonido. */
const VOICE_WAIT_MS = 1200;

const voiceData: Partial<Record<Voice, Promise<ArrayBuffer | null>>> = {};
const voiceBuffers: Partial<Record<Voice, AudioBuffer>> = {};
let voiceLoad: Promise<void> | null = null;
let voiceLoadDone = false;

/**
 * Descarga las grabaciones apenas abre la app (no necesita audio habilitado),
 * así ya están listas cuando el participante elige su mascota.
 */
export function preloadVoiceClips() {
  for (const voice of VOICES) {
    voiceData[voice] ??= fetch(VOICE_CLIPS[voice].url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
  }
}

/** Decodifica las grabaciones una sola vez, cuando el audio queda habilitado. */
function decodeVoiceClips(c: AudioContext) {
  preloadVoiceClips();
  voiceLoad ??= Promise.all(
    VOICES.map(async (voice) => {
      const data = await voiceData[voice];
      if (!data) return;
      try {
        voiceBuffers[voice] = await c.decodeAudioData(data.slice(0));
      } catch {
        // Sin la grabación se usa la versión sintetizada.
      }
    }),
  ).then(() => {
    voiceLoadDone = true;
  });
  return voiceLoad;
}

let ctx: AudioContext | null = null;
let enabled = true;
let ctorOverride: AudioCtor | null = null;

/* ------------------------------- Contexto -------------------------------- */

export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value) stopAll();
}

export function isSoundEnabled() {
  return enabled;
}

/** Llamar desde un gesto del usuario (toque o clic) para habilitar el audio. */
export function unlockAudio() {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctor =
      ctorOverride ??
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    void decodeVoiceClips(ctx);
  } catch {
    ctx = null;
  }
}

/** Para pruebas: espera a que terminen de cargarse las grabaciones. */
export function voiceClipsReady() {
  return voiceLoad ?? Promise.resolve();
}

function ready(): AudioContext | null {
  if (!enabled || !ctx || ctx.state !== 'running') return null;
  return ctx;
}

/** Solo para pruebas: reemplaza el constructor de AudioContext y reinicia el estado. */
export function __resetAudioForTests(ctor: AudioCtor | null) {
  stopAll();
  ctorOverride = ctor;
  ctx = null;
  enabled = true;
  celebrated = new Set();
  lastVoiceAt = -Infinity;
  voiceLoad = null;
  voiceLoadDone = false;
  for (const voice of VOICES) {
    delete voiceBuffers[voice];
    delete voiceData[voice];
  }
}

/* ------------------------------- Utilidades ------------------------------ */

function tone(
  c: AudioContext,
  dest: AudioNode,
  freq: number,
  endFreq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain: number,
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.03);
  return osc;
}

function safeStop(node: AudioScheduledSourceNode, when: number) {
  try {
    node.stop(when);
  } catch {
    // Ya estaba detenido.
  }
}

let noise: AudioBuffer | null = null;
function noiseBuffer(c: AudioContext) {
  if (noise && noise.sampleRate === c.sampleRate) return noise;
  noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/* ------------------------------ Efectos breves ---------------------------- */

export function play(sfx: Sfx) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime;
  const out = c.destination;
  switch (sfx) {
    case 'kibble':
      tone(c, out, 520, 1040, t, 0.11, 'triangle', 0.22);
      tone(c, out, 1040, 1400, t + 0.05, 0.08, 'sine', 0.1);
      break;
    case 'oops':
      tone(c, out, 260, 140, t, 0.22, 'square', 0.07);
      break;
    case 'tick':
      tone(c, out, 660, 660, t, 0.09, 'sine', 0.18);
      break;
    case 'go':
      tone(c, out, 880, 1320, t, 0.2, 'triangle', 0.22);
      break;
    case 'tap':
      tone(c, out, 700, 900, t, 0.06, 'sine', 0.1);
      break;
    case 'timeUp':
      // Campana doble de fin de tiempo (la celebración suena después, con el confeti).
      tone(c, out, 988, 980, t, 0.35, 'sine', 0.2);
      tone(c, out, 784, 778, t + 0.18, 0.5, 'sine', 0.2);
      break;
  }
}

/* ----------------------------- Ladrido / maullido -------------------------- */

interface VoiceHandle {
  master: GainNode;
  sources: AudioScheduledSourceNode[];
}

let currentVoice: VoiceHandle | null = null;
let lastVoiceAt = -Infinity;
/** Toques más rápidos que esto se ignoran para no encimar sonidos. */
const VOICE_DEBOUNCE_MS = 180;

function stopVoice() {
  const v = currentVoice;
  currentVoice = null;
  if (!v || !ctx) return;
  const t = ctx.currentTime;
  v.master.gain.cancelScheduledValues(t);
  v.master.gain.setTargetAtTime(0, t, 0.015);
  for (const s of v.sources) safeStop(s, t + 0.08);
}

/** Un ladrido corto y amable: golpe de aire + tono que cae, filtrado como una "boca". */
function bark(c: AudioContext, dest: AudioNode, t: number, pitch: number, sources: AudioScheduledSourceNode[]) {
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c);
  const nf = c.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 1500;
  nf.Q.value = 1.1;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.35, t + 0.006);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  n.connect(nf).connect(ng).connect(dest);
  n.start(t);
  n.stop(t + 0.1);
  sources.push(n);

  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(330 * pitch, t);
  osc.frequency.exponentialRampToValueAtTime(520 * pitch, t + 0.03);
  osc.frequency.exponentialRampToValueAtTime(190 * pitch, t + 0.17);
  const f1 = c.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = 650;
  f1.Q.value = 2.5;
  const f2 = c.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = 1250;
  f2.Q.value = 3.5;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
  osc.connect(f1).connect(g);
  osc.connect(f2).connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.22);
  sources.push(osc);
}

/** Maullido "mi-a-u": tono que sube y baja con un filtro que imita la boca abriéndose y cerrándose. */
function meow(c: AudioContext, dest: AudioNode, t: number, sources: AudioScheduledSourceNode[]) {
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(560, t);
  osc.frequency.linearRampToValueAtTime(820, t + 0.14);
  osc.frequency.linearRampToValueAtTime(740, t + 0.38);
  osc.frequency.linearRampToValueAtTime(500, t + 0.62);

  const lfo = c.createOscillator();
  lfo.frequency.value = 6;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain).connect(osc.frequency);

  const formant = c.createBiquadFilter();
  formant.type = 'bandpass';
  formant.Q.value = 4;
  formant.frequency.setValueAtTime(900, t);
  formant.frequency.linearRampToValueAtTime(1600, t + 0.2);
  formant.frequency.linearRampToValueAtTime(1100, t + 0.45);
  formant.frequency.linearRampToValueAtTime(700, t + 0.64);
  const formant2 = c.createBiquadFilter();
  formant2.type = 'bandpass';
  formant2.Q.value = 6;
  formant2.frequency.value = 2700;
  const f2g = c.createGain();
  f2g.gain.value = 0.35;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.75, t + 0.06);
  g.gain.setValueAtTime(0.75, t + 0.42);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  osc.connect(formant).connect(g);
  osc.connect(formant2).connect(f2g).connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.74);
  lfo.start(t);
  lfo.stop(t + 0.74);
  sources.push(osc, lfo);
}

/** Reproduce un fragmento de la grabación con entrada y salida suaves (sin clics). */
function playRecording(
  c: AudioContext,
  master: GainNode,
  t: number,
  voice: Voice,
  buffer: AudioBuffer,
  sources: AudioScheduledSourceNode[],
) {
  const clip = VOICE_CLIPS[voice];
  const [from, to] = clip.segment;
  const duration = Math.max(0.05, Math.min(to, buffer.duration) - from);
  master.gain.value = clip.gain;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.01);
  env.gain.setValueAtTime(1, t + duration - 0.08);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(env).connect(master);
  src.start(t, from, duration);
  sources.push(src);
}

/**
 * Ladrido o maullido al elegir mascota o raza. Solo hay un canal: un toque
 * nuevo corta el sonido anterior, y los toques muy seguidos se ignoran.
 */
export function playVoice(voice: Voice) {
  const c = ready();
  if (!c) return;
  const now = performance.now();
  if (now - lastVoiceAt < VOICE_DEBOUNCE_MS) return;
  lastVoiceAt = now;

  // Si la grabación todavía se está decodificando, se espera a que esté lista
  // en lugar de sonar la versión sintetizada (así suena siempre igual).
  if (!voiceBuffers[voice] && voiceLoad && !voiceLoadDone) {
    const requestedAt = now;
    void voiceLoad.then(() => {
      if (lastVoiceAt === requestedAt && performance.now() - requestedAt < VOICE_WAIT_MS) startVoice(voice);
    });
    return;
  }
  startVoice(voice);
}

function startVoice(voice: Voice) {
  const c = ready();
  if (!c) return;
  stopVoice();

  const master = c.createGain();
  master.gain.value = 0.32;
  master.connect(c.destination);
  const sources: AudioScheduledSourceNode[] = [];
  const t = c.currentTime + 0.01;
  const recording = voiceBuffers[voice];
  if (recording) {
    playRecording(c, master, t, voice, recording, sources);
  } else if (voice === 'bark') {
    bark(c, master, t, 1, sources);
    bark(c, master, t + 0.2, 0.9, sources);
  } else {
    meow(c, master, t, sources);
  }
  const handle: VoiceHandle = { master, sources };
  currentVoice = handle;
  sources[sources.length - 1]!.onended = () => {
    if (currentVoice === handle) currentVoice = null;
  };
}

export function isVoicePlaying() {
  return currentVoice !== null;
}

/* -------------------------------- Celebración ------------------------------ */

let celebrated = new Set<string>();

/**
 * Fanfarria corta y destellos al aparecer el confeti. Suena una sola vez por
 * resultado: repetir la llamada con el mismo id (re-render, doble montaje en
 * desarrollo, volver a la pantalla) no la dispara de nuevo.
 */
export function playCelebration(resultId: string) {
  if (celebrated.has(resultId)) return false;
  const c = ready();
  if (!c) return false;
  celebrated.add(resultId);
  if (celebrated.size > 50) celebrated = new Set([resultId]);

  const t = c.currentTime + 0.02;
  const master = c.createGain();
  master.gain.value = 0.55;
  master.connect(c.destination);

  // "Pop" del confeti.
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c);
  const nf = c.createBiquadFilter();
  nf.type = 'highpass';
  nf.frequency.value = 2500;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.25, t + 0.005);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  n.connect(nf).connect(ng).connect(master);
  n.start(t);
  n.stop(t + 0.15);

  // Arpegio ascendente y acorde final (do mayor).
  [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(c, master, f, f, t + 0.06 + i * 0.085, 0.2, 'triangle', 0.22));
  for (const f of [523.25, 659.25, 783.99, 1046.5]) {
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = c.createGain();
    const s = t + 0.42;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.12, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
    osc.connect(g).connect(master);
    osc.start(s);
    osc.stop(s + 0.95);
  }
  // Destellos.
  for (let i = 0; i < 7; i++) {
    const f = 1800 + ((i * 397) % 1400);
    tone(c, master, f, f * 1.02, t + 0.45 + i * 0.09, 0.12, 'sine', 0.06);
  }
  return true;
}

/* ---------------------------------- Tensión -------------------------------- */

interface TensionState {
  master: GainNode;
  filter: BiquadFilterNode;
  drones: OscillatorNode[];
  timer: ReturnType<typeof setInterval>;
  nextTick: number;
  beat: number;
  intensity: number;
}

let tension: TensionState | null = null;

/**
 * Ambientación de "se acaba el tiempo": un pulso grave suave y un tic-tac que
 * se acelera y sube de tono con la intensidad. Es una única instancia: llamar
 * de nuevo mientras suena no crea otra.
 */
export function startTension() {
  if (tension) return;
  const c = ready();
  if (!c) return;
  const t = c.currentTime;

  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.5, t + 0.4);
  master.connect(c.destination);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  const droneGain = c.createGain();
  droneGain.gain.value = 0.07;
  filter.connect(droneGain).connect(master);

  const drones = [55, 110, 110.6].map((f, i) => {
    const o = c.createOscillator();
    o.type = i === 0 ? 'sine' : 'triangle';
    o.frequency.value = f;
    o.connect(filter);
    o.start(t);
    return o;
  });

  const state: TensionState = {
    master,
    filter,
    drones,
    nextTick: t + 0.05,
    beat: 0,
    intensity: 0,
    timer: setInterval(() => schedule(), 40),
  };
  tension = state;

  function schedule() {
    const cc = ctx;
    if (!cc || tension !== state) return;
    // Programación con anticipación sobre el reloj de audio: el ritmo no depende de los temporizadores.
    while (state.nextTick < cc.currentTime + 0.15) {
      const k = state.intensity;
      const high = state.beat % 2 === 0;
      const base = (high ? 1250 : 930) * (1 + k * 0.35);
      tone(cc, master, base, base * 0.97, state.nextTick, 0.05, 'sine', 0.1 + k * 0.08);
      state.beat++;
      state.nextTick += 0.5 - 0.27 * k; // 120 → ~260 pulsos por minuto
    }
  }
  schedule();
}

/** 0 (quedan 10 s) a 1 (se termina): acelera el tic-tac y abre el filtro del pulso. */
export function setTensionIntensity(k: number) {
  if (!tension || !ctx) return;
  const v = Math.min(1, Math.max(0, k));
  tension.intensity = v;
  tension.filter.frequency.setTargetAtTime(320 + 900 * v, ctx.currentTime, 0.2);
}

export function stopTension() {
  const s = tension;
  tension = null;
  if (!s) return;
  clearInterval(s.timer);
  if (!ctx) return;
  const t = ctx.currentTime;
  s.master.gain.cancelScheduledValues(t);
  s.master.gain.setTargetAtTime(0, t, 0.02);
  for (const o of s.drones) safeStop(o, t + 0.12);
}

export function isTensionPlaying() {
  return tension !== null;
}

/** Detiene todo lo que tenga duración (tensión y voces). */
export function stopAll() {
  stopTension();
  stopVoice();
}
