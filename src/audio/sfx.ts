/**
 * Efectos de sonido sintetizados con Web Audio: no hay archivos que
 * descargar, así que funcionan sin conexión. El contexto de audio se crea
 * recién con el primer gesto del usuario (requisito de los navegadores).
 */

type Sfx = 'kibble' | 'oops' | 'tick' | 'go' | 'end' | 'tap';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

/** Llamar desde un gesto del usuario (toque o clic) para habilitar el audio. */
export function unlockAudio() {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, endFreq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function play(sfx: Sfx) {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  switch (sfx) {
    case 'kibble':
      tone(520, 1040, t, 0.11, 'triangle', 0.22);
      tone(1040, 1400, t + 0.05, 0.08, 'sine', 0.1);
      break;
    case 'oops':
      tone(260, 140, t, 0.22, 'square', 0.07);
      break;
    case 'tick':
      tone(660, 660, t, 0.09, 'sine', 0.18);
      break;
    case 'go':
      tone(880, 1320, t, 0.2, 'triangle', 0.22);
      break;
    case 'tap':
      tone(700, 900, t, 0.06, 'sine', 0.1);
      break;
    case 'end':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, f, t + i * 0.12, 0.22, 'triangle', 0.18));
      break;
  }
}
