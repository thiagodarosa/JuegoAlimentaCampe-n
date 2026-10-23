import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/game.config';
import { GameEngine, type GameObject } from './engine';
import { seededRng } from './random';

const VP = { width: 1000, height: 700 };

function makeEngine(seed = 1, species: 'perro' | 'gato' = 'perro') {
  return new GameEngine({ species, rng: seededRng(seed), viewport: VP });
}

/** Avanza el juego cuadro a cuadro (60 fps) hasta `untilMs` de tiempo real. */
function run(engine: GameEngine, from: number, untilMs: number, frame = 16) {
  let now = from;
  while (now < untilMs) {
    now = Math.min(untilMs, now + frame);
    engine.update(now);
  }
  return now;
}

function centerOf(o: GameObject) {
  return { x: o.x * VP.width, y: o.y * VP.height };
}

/** Avanza hasta que haya un objeto tocable del tipo pedido. */
function waitFor(engine: GameEngine, now: number, kind: 'kibble' | 'distractor') {
  for (let i = 0; i < 2000; i++) {
    const o = engine.objects.find(
      (x) => x.kind === kind && x.hitAt === null && engine.scaleOf(x) >= 1 && x.x > 0.05 && x.x < 0.95 && x.y > 0.05 && x.y < 0.95,
    );
    if (o) return { o, now };
    now += 16;
    engine.update(now);
  }
  throw new Error(`No apareció ningún ${kind}`);
}

describe('cronómetro', () => {
  it('dura 30 segundos de juego', () => {
    expect(GAME_CONFIG.durationMs).toBe(30_000);
    const e = makeEngine();
    e.start(1000);
    expect(e.remaining(1000)).toBe(30_000);
    e.update(30_999);
    expect(e.state).toBe('running');
    expect(e.remaining(30_999)).toBe(1);
    e.update(31_000);
    expect(e.state).toBe('finished');
    expect(e.remaining(31_000)).toBe(0);
  });

  it('se calcula con marcas temporales aunque los cuadros sean irregulares', () => {
    const e = makeEngine();
    e.start(0);
    const frames = [5, 120, 16, 900, 33, 16, 2500, 7];
    let now = 0;
    for (const f of frames) {
      now += f;
      e.update(now);
    }
    expect(e.elapsed(now)).toBe(frames.reduce((a, b) => a + b, 0));
  });

  it('emite un único evento de fin', () => {
    const e = makeEngine();
    e.start(0);
    run(e, 0, 31_000);
    e.update(40_000);
    const ends = e.drainEvents().filter((ev) => ev.type === 'end');
    expect(ends).toHaveLength(1);
  });

  it('la pausa congela el tiempo y los objetos', () => {
    const e = makeEngine();
    e.start(0);
    let now = run(e, 0, 5000);
    e.pause(now);
    const snapshot = e.objects.map((o) => ({ id: o.id, x: o.x, y: o.y }));
    now += 60_000;
    e.update(now);
    expect(e.state).toBe('paused');
    expect(e.elapsed(now)).toBe(5000);
    expect(e.objects.map((o) => ({ id: o.id, x: o.x, y: o.y }))).toEqual(snapshot);
    e.resume(now);
    now = run(e, now, now + 25_000);
    expect(e.state).toBe('finished');
  });

  it('no se puede sumar en pausa', () => {
    const e = makeEngine();
    e.start(0);
    const found = waitFor(e, 0, 'kibble');
    e.pause(found.now);
    const { x, y } = centerOf(found.o);
    expect(e.tap(x, y, found.now + 10)).toBeNull();
    expect(e.score).toBe(0);
  });
});

describe('puntuación', () => {
  it('una croqueta suma 10', () => {
    const e = makeEngine();
    e.start(0);
    const { o, now } = waitFor(e, 0, 'kibble');
    const { x, y } = centerOf(o);
    const ev = e.tap(x, y, now);
    expect(ev).toMatchObject({ type: 'hit', kind: 'kibble', delta: 10, score: 10 });
    expect(e.score).toBe(GAME_CONFIG.points.kibble);
  });

  it('un distractor resta 5 y el puntaje nunca baja de 0', () => {
    const e = makeEngine(3);
    e.start(0);
    let { o, now } = waitFor(e, 0, 'distractor');
    let p = centerOf(o);
    e.tap(p.x, p.y, now);
    expect(e.score).toBe(0); // 0 - 5 → 0

    ({ o, now } = waitFor(e, now, 'kibble'));
    p = centerOf(o);
    e.tap(p.x, p.y, now);
    expect(e.score).toBe(10);

    ({ o, now } = waitFor(e, now, 'distractor'));
    p = centerOf(o);
    const ev = e.tap(p.x, p.y, now);
    expect(ev).toMatchObject({ kind: 'distractor', delta: -5 });
    expect(e.score).toBe(5);
    expect(e.getStats()).toMatchObject({ kibbles: 1, distractors: 2 });
  });

  it('un mismo objeto no se puede contar dos veces', () => {
    const e = makeEngine();
    e.start(0);
    const { o, now } = waitFor(e, 0, 'kibble');
    const { x, y } = centerOf(o);
    expect(e.tap(x, y, now)).not.toBeNull();
    const firstHitAt = o.hitAt;
    // Un segundo toque inmediato en el mismo lugar no vuelve a contar ese objeto
    // (solo podría acertar a otro objeto distinto que esté debajo).
    const second = e.tap(x, y, now + 1);
    expect(o.hitAt).toBe(firstHitAt);
    expect(e.getStats().kibbles + e.getStats().distractors).toBe(second ? 2 : 1);
  });

  it('tocar una zona vacía no hace nada', () => {
    const e = makeEngine();
    e.start(0);
    expect(e.tap(-50, -50, 100)).toBeNull();
    expect(e.score).toBe(0);
  });

  it('no suma puntos después del final', () => {
    const e = makeEngine();
    e.start(0);
    const { o, now } = waitFor(e, 0, 'kibble');
    const { x, y } = centerOf(o);
    // El toque llega con una marca posterior al final: no cuenta.
    expect(e.tap(x, y, 30_000 + now)).toBeNull();
    expect(e.state).toBe('finished');
    expect(e.score).toBe(0);
    expect(e.objects).toHaveLength(0);
  });

  it('no suma antes de empezar', () => {
    const e = makeEngine();
    expect(e.tap(500, 350, 0)).toBeNull();
  });
});

describe('aparición de objetos y justicia', () => {
  /** Simula una partida completa y registra cada objeto que aparece. */
  function simulate(seed: number, species: 'perro' | 'gato' = 'perro') {
    const e = makeEngine(seed, species);
    e.start(0);
    const seen = new Map<number, { kind: string; bornAt: number }>();
    let maxActive = 0;
    let framesWithoutKibble = 0;
    let worstGap = 0;
    for (let now = 16; now <= 30_016; now += 16) {
      e.update(now);
      const alive = e.objects.filter((o) => o.hitAt === null);
      maxActive = Math.max(maxActive, alive.length);
      if (now > 1500) {
        framesWithoutKibble = alive.some((o) => o.kind === 'kibble') ? 0 : framesWithoutKibble + 1;
        worstGap = Math.max(worstGap, framesWithoutKibble);
      }
      for (const o of e.objects) if (!seen.has(o.id)) seen.set(o.id, { kind: o.kind, bornAt: o.bornAt });
    }
    const list = [...seen.values()].sort((a, b) => a.bornAt - b.bornAt);
    return { e, list, maxActive, worstGapMs: worstGap * 16 };
  }

  it.each([1, 2, 3, 4, 5, 42, 99])('semilla %i: límites, variedad y siempre hay croquetas', (seed) => {
    const { list, maxActive, worstGapMs } = simulate(seed);
    expect(maxActive).toBeLessThanOrEqual(GAME_CONFIG.maxObjects);

    let run = 0;
    for (const o of list) {
      run = o.kind === 'distractor' ? run + 1 : 0;
      expect(run).toBeLessThanOrEqual(GAME_CONFIG.maxConsecutiveDistractors);
    }

    const kibbles = list.filter((o) => o.kind === 'kibble').length;
    const share = (list.length - kibbles) / list.length;
    expect(kibbles).toBeGreaterThan(30);
    expect(share).toBeGreaterThan(0.1);
    expect(share).toBeLessThan(0.4);
    // Nunca pasa más de un segundo sin ninguna croqueta tocable en pantalla.
    expect(worstGapMs).toBeLessThan(1000);
  });

  it('la dificultad aumenta por fases', () => {
    const { list } = simulate(7);
    const inWindow = (a: number, b: number) => list.filter((o) => o.bornAt >= a && o.bornAt < b).length;
    const p1 = inWindow(0, 10_000);
    const p2 = inWindow(10_000, 20_000);
    const p3 = inWindow(20_000, 30_000);
    expect(p2).toBeGreaterThan(p1);
    expect(p3).toBeGreaterThan(p2);
  });

  it('perros y gatos tienen la misma dificultad', () => {
    const dog = simulate(11, 'perro').list.length;
    const cat = simulate(11, 'gato').list.length;
    expect(Math.abs(dog - cat)).toBeLessThanOrEqual(Math.max(3, dog * 0.1));
  });

  it('usa objetos de la especie elegida', () => {
    const e = makeEngine(5, 'gato');
    e.start(0);
    run(e, 0, 20_000);
    const variants = new Set(e.objects.map((o) => o.variant));
    expect([...variants].every((v) => !['rope', 'duck', 'kibble-tri'].includes(v))).toBe(true);
  });
});

describe('cambio de tamaño u orientación', () => {
  it('no reinicia el tiempo ni duplica objetos', () => {
    const e = makeEngine();
    e.start(0);
    const now = run(e, 0, 8000);
    const ids = e.objects.map((o) => o.id);
    const elapsed = e.elapsed(now);
    e.setViewport({ width: 700, height: 1000 });
    expect(e.objects.map((o) => o.id)).toEqual(ids);
    expect(e.elapsed(now)).toBe(elapsed);
    e.update(now + 16);
    expect(new Set(e.objects.map((o) => o.id)).size).toBe(e.objects.length);
  });

  it('los toques usan el tamaño nuevo', () => {
    const e = makeEngine();
    e.start(0);
    const { o, now } = waitFor(e, 0, 'kibble');
    e.setViewport({ width: 600, height: 900 });
    expect(e.tap(o.x * 600, o.y * 900, now)).not.toBeNull();
  });

  it('el área táctil nunca es menor al mínimo', () => {
    const e = new GameEngine({ species: 'perro', rng: seededRng(1), viewport: { width: 320, height: 300 } });
    e.start(0);
    run(e, 0, 3000);
    for (const o of e.objects) expect(e.radiusPx(o)).toBeGreaterThanOrEqual(GAME_CONFIG.minRadiusPx);
  });
});
