import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetAudioForTests,
  isTensionPlaying,
  isVoicePlaying,
  play,
  playCelebration,
  playVoice,
  setSoundEnabled,
  setTensionIntensity,
  startTension,
  stopAll,
  stopTension,
  unlockAudio,
  VOICE_CLIPS,
  voiceClipsReady,
} from './sfx';

/* AudioContext falso: registra qué fuentes se crean, arrancan y se detienen. */

const log = { created: 0, started: 0, stopped: 0, bufferStarts: [] as { offset?: number; duration?: number }[] };

class Param {
  value = 0;
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
  linearRampToValueAtTime() {}
  setTargetAtTime() {}
  cancelScheduledValues() {}
}

class Node {
  connect<T>(n: T) {
    return n;
  }
  disconnect() {}
}

class Source extends Node {
  frequency = new Param();
  type = '';
  buffer: unknown = null;
  onended: (() => void) | null = null;
  private stoppedOnce = false;
  constructor() {
    super();
    log.created++;
  }
  start(_when?: number, offset?: number, duration?: number) {
    log.started++;
    if (this.buffer) log.bufferStarts.push({ offset, duration });
  }
  stop() {
    if (this.stoppedOnce) throw new Error('InvalidStateError');
    this.stoppedOnce = true;
    log.stopped++;
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running';
  // El reloj de audio avanza con el reloj falso de las pruebas.
  get currentTime() {
    return performance.now() / 1000;
  }
  sampleRate = 8000;
  destination = new Node();
  createOscillator() {
    return new Source();
  }
  createBufferSource() {
    return new Source();
  }
  createGain() {
    return Object.assign(new Node(), { gain: new Param() });
  }
  createBiquadFilter() {
    return Object.assign(new Node(), { type: '', frequency: new Param(), Q: new Param() });
  }
  decodeAudioData() {
    return Promise.resolve({ duration: 4.4, sampleRate: 48000 } as AudioBuffer);
  }
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return { sampleRate, getChannelData: () => new Float32Array(length) };
  }
  resume() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance', 'setInterval', 'clearInterval'] });
  __resetAudioForTests(FakeAudioContext as unknown as new () => AudioContext);
  // Por defecto las grabaciones no están disponibles (se prueba la versión sintetizada).
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('sin red'))));
  unlockAudio();
  log.created = log.started = log.stopped = 0;
  log.bufferStarts = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  stopAll();
  vi.useRealTimers();
  __resetAudioForTests(null);
});

describe('grabaciones reales de ladrido y maullido', () => {
  async function withRecordings() {
    __resetAudioForTests(FakeAudioContext as unknown as new () => AudioContext);
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })));
    unlockAudio();
    await voiceClipsReady();
    log.bufferStarts = [];
  }

  it('el ladrido usa la grabación y solo el fragmento elegido', async () => {
    await withRecordings();
    playVoice('bark');
    const [from, to] = VOICE_CLIPS.bark.segment;
    expect(log.bufferStarts).toEqual([{ offset: from, duration: expect.closeTo(to - from, 5) }]);
  });

  it('el maullido suena igual cada vez (especie y raza)', async () => {
    await withRecordings();
    for (let i = 0; i < 4; i++) {
      playVoice('meow');
      vi.advanceTimersByTime(500);
    }
    const [from, to] = VOICE_CLIPS.meow.segment;
    expect(log.bufferStarts).toEqual(Array(4).fill({ offset: from, duration: expect.closeTo(to - from, 5) }));
  });

  it('si se pide mientras la grabación todavía carga, espera y usa la grabación (no la sintetizada)', async () => {
    __resetAudioForTests(FakeAudioContext as unknown as new () => AudioContext);
    // Las descargas quedan pendientes hasta que la prueba las libera.
    const pending: ((v: unknown) => void)[] = [];
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => pending.push(resolve))));
    unlockAudio();
    log.created = log.started = 0;
    log.bufferStarts = [];

    playVoice('meow'); // la descarga todavía no terminó
    expect(log.started).toBe(0); // no sonó la versión sintetizada

    for (const resolve of pending) resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    await voiceClipsReady();
    await Promise.resolve();
    expect(log.bufferStarts).toEqual([{ offset: VOICE_CLIPS.meow.segment[0], duration: expect.any(Number) }]);
  });

  it('si la grabación no carga, suena la versión sintetizada', async () => {
    await voiceClipsReady();
    playVoice('bark');
    expect(log.bufferStarts.every((b) => b.offset === undefined)).toBe(true);
    expect(log.started).toBeGreaterThan(0);
  });

  it('las grabaciones están en el proyecto (no se usan enlaces externos)', () => {
    for (const clip of Object.values(VOICE_CLIPS)) expect(clip.url).not.toMatch(/^https?:/);
  });
});

describe('ladrido y maullido', () => {
  it('suenan al pedirlos', () => {
    playVoice('bark');
    expect(log.started).toBeGreaterThan(0);
    expect(isVoicePlaying()).toBe(true);
  });

  it('toques muy seguidos no encimen sonidos', () => {
    playVoice('meow');
    const afterFirst = log.created;
    vi.advanceTimersByTime(50);
    playVoice('meow');
    playVoice('bark');
    expect(log.created).toBe(afterFirst);
  });

  it('un sonido nuevo corta el anterior: nunca suenan dos a la vez', () => {
    playVoice('bark');
    const firstSources = log.created;
    vi.advanceTimersByTime(400);
    playVoice('meow');
    // Todas las fuentes del ladrido recibieron la orden de detenerse.
    expect(log.stopped).toBeGreaterThanOrEqual(firstSources);
  });
});

describe('celebración', () => {
  it('suena una sola vez por resultado', () => {
    expect(playCelebration('1-1')).toBe(true);
    const created = log.created;
    expect(playCelebration('1-1')).toBe(false);
    expect(playCelebration('1-1')).toBe(false);
    expect(log.created).toBe(created);
  });

  it('cada resultado nuevo vuelve a celebrar', () => {
    expect(playCelebration('1-1')).toBe(true);
    expect(playCelebration('2-1')).toBe(true);
  });
});

describe('tensión de los últimos segundos', () => {
  it('es una única instancia aunque se pida muchas veces', () => {
    startTension();
    const created = log.created;
    startTension();
    startTension();
    expect(isTensionPlaying()).toBe(true);
    expect(log.created).toBe(created);
  });

  it('el tic-tac se programa mientras dura y se detiene al terminar', () => {
    startTension();
    setTensionIntensity(0.5);
    const before = log.created;
    vi.advanceTimersByTime(1000);
    expect(log.created).toBeGreaterThan(before); // se programaron tics
    stopTension();
    expect(isTensionPlaying()).toBe(false);
    const afterStop = log.created;
    vi.advanceTimersByTime(2000);
    expect(log.created).toBe(afterStop); // no quedan tics colgados
  });

  it('detenerla dos veces no falla', () => {
    startTension();
    stopTension();
    expect(() => stopTension()).not.toThrow();
  });
});

describe('silencio', () => {
  it('con el sonido desactivado no se reproduce nada', () => {
    setSoundEnabled(false);
    play('kibble');
    playVoice('bark');
    startTension();
    playCelebration('x');
    expect(log.created).toBe(0);
    expect(isTensionPlaying()).toBe(false);
  });

  it('silenciar corta la tensión y la voz que estaban sonando', () => {
    startTension();
    playVoice('meow');
    setSoundEnabled(false);
    expect(isTensionPlaying()).toBe(false);
    expect(isVoicePlaying()).toBe(false);
  });

  it('una celebración bloqueada por el silencio no cuenta como reproducida', () => {
    setSoundEnabled(false);
    expect(playCelebration('9-1')).toBe(false);
    setSoundEnabled(true);
    expect(playCelebration('9-1')).toBe(true);
  });
});
