import type { Species } from '../config/breeds';
import { GAME_CONFIG, type PhaseConfig, type Trajectory } from '../config/game.config';
import { DISTRACTORS, KIBBLES, type ItemVariant } from './items';
import { between, pick, pickWeighted, type Rng } from './random';

/**
 * Motor del juego, independiente de React y del Canvas.
 *
 * - El tiempo se calcula con marcas temporales (`now`, en ms, normalmente
 *   `performance.now()`), nunca contando intervalos.
 * - Solo avanza el "tiempo de juego" mientras la partida está en curso: en
 *   pausa los objetos quedan congelados y el cronómetro no corre.
 * - Las posiciones se guardan normalizadas (0 a 1 del ancho y del alto), así
 *   un cambio de tamaño u orientación no reinicia ni duplica nada.
 */

export type ObjectKind = 'kibble' | 'distractor';
export type EngineState = 'ready' | 'running' | 'paused' | 'finished';

export interface GameObject {
  id: number;
  kind: ObjectKind;
  variant: ItemVariant;
  traj: Trajectory;
  /** Posición normalizada: x en fracción del ancho, y en fracción del alto. */
  x: number;
  y: number;
  /** Velocidad en fracciones por segundo. */
  vx: number;
  vy: number;
  /** Aceleración vertical (trayectoria en arco). */
  ay: number;
  baseX: number;
  zigAmp: number;
  zigFreq: number;
  /** Radio como fracción del lado menor del área de juego. */
  r: number;
  rot: number;
  spin: number;
  /** Momento de aparición, en ms de juego. */
  bornAt: number;
  /** Duración de los objetos estáticos ('pop'). */
  lifeMs: number | null;
  /** Momento en que se tocó (ms de juego), o null. */
  hitAt: number | null;
  removed: boolean;
}

export interface Viewport {
  width: number;
  height: number;
}

export type GameEvent =
  | { type: 'hit'; kind: ObjectKind; variant: ItemVariant; x: number; y: number; delta: number; score: number; streak: number }
  | { type: 'phase'; index: number }
  | { type: 'end'; score: number };

export interface GameStats {
  score: number;
  kibbles: number;
  distractors: number;
  bestStreak: number;
}

type GameConfig = typeof GAME_CONFIG;

export interface EngineOptions {
  species: Species;
  rng?: Rng;
  config?: GameConfig;
  viewport?: Viewport;
}

const POP_IN_MS = 160;
const POP_OUT_MS = 180;
export const HIT_ANIM_MS = 260;

export class GameEngine {
  readonly species: Species;
  private readonly cfg: GameConfig;
  private readonly rng: Rng;

  private _state: EngineState = 'ready';
  private viewport: Viewport;

  /** Tiempo de juego acumulado antes de la última reanudación. */
  private elapsedBefore = 0;
  /** Marca temporal desde la que corre el tiempo, o null si no corre. */
  private runningSince: number | null = null;
  /** Último tiempo de juego simulado. */
  private simTime = 0;

  private nextSpawnAt = 0;
  private nextId = 1;
  private phaseIndex = 0;
  private consecutiveDistractors = 0;
  private streak = 0;

  private _objects: GameObject[] = [];
  private events: GameEvent[] = [];
  private stats: GameStats = { score: 0, kibbles: 0, distractors: 0, bestStreak: 0 };

  constructor(opts: EngineOptions) {
    this.species = opts.species;
    this.cfg = opts.config ?? GAME_CONFIG;
    this.rng = opts.rng ?? Math.random;
    this.viewport = opts.viewport ?? { width: 1024, height: 768 };
  }

  get state() {
    return this._state;
  }

  get objects(): readonly GameObject[] {
    return this._objects;
  }

  get score() {
    return this.stats.score;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  get durationMs() {
    return this.cfg.durationMs;
  }

  /* ------------------------------- Tiempo ------------------------------- */

  start(now: number) {
    if (this._state !== 'ready') return;
    this._state = 'running';
    this.runningSince = now;
    this.nextSpawnAt = 250;
  }

  pause(now: number) {
    if (this._state !== 'running') return;
    this.update(now);
    if (this.runningSince === null) return; // la actualización pudo terminar la partida
    this.elapsedBefore += now - this.runningSince;
    this.runningSince = null;
    this._state = 'paused';
  }

  resume(now: number) {
    if (this._state !== 'paused') return;
    this._state = 'running';
    this.runningSince = now;
  }

  /** Tiempo de juego transcurrido (ms), con tope en la duración. */
  elapsed(now: number) {
    const running = this.runningSince === null ? 0 : Math.max(0, now - this.runningSince);
    return Math.min(this.cfg.durationMs, this.elapsedBefore + running);
  }

  remaining(now: number) {
    return this.cfg.durationMs - this.elapsed(now);
  }

  /** Tiempo de juego usado para animar (no avanza en pausa ni después del final). */
  get gameTime() {
    return this.simTime;
  }

  setViewport(vp: Viewport) {
    if (vp.width > 0 && vp.height > 0) this.viewport = { ...vp };
  }

  /* ----------------------------- Simulación ----------------------------- */

  update(now: number) {
    if (this._state !== 'running') return;
    const t = this.elapsed(now);
    // Pasos de simulación acotados: si el navegador se trabó, no "teletransportamos" objetos.
    while (this.simTime < t) {
      const step = Math.min(32, t - this.simTime);
      this.step(this.simTime + step, step / 1000);
    }
    if (t >= this.cfg.durationMs) this.finish();
  }

  private step(t: number, dt: number) {
    this.simTime = t;

    const phaseIndex = this.phaseIndexAt(t);
    if (phaseIndex !== this.phaseIndex) {
      this.phaseIndex = phaseIndex;
      this.events.push({ type: 'phase', index: phaseIndex });
    }
    const phase = this.phase();

    for (const o of this._objects) {
      if (o.removed) continue;
      if (o.hitAt !== null) {
        if (t - o.hitAt >= HIT_ANIM_MS) o.removed = true;
        continue;
      }
      o.rot += o.spin * dt;
      switch (o.traj) {
        case 'pop':
          if (o.lifeMs !== null && t - o.bornAt >= o.lifeMs + POP_OUT_MS) o.removed = true;
          break;
        case 'zigzag':
          o.y += o.vy * dt;
          o.x = o.baseX + Math.sin(((t - o.bornAt) / 1000) * o.zigFreq) * o.zigAmp;
          break;
        default:
          o.vy += o.ay * dt;
          o.x += o.vx * dt;
          o.y += o.vy * dt;
      }
      if (o.x < -0.25 || o.x > 1.25 || o.y > 1.3 || o.y < -0.6) o.removed = true;
    }
    this._objects = this._objects.filter((o) => !o.removed);

    if (t >= this.nextSpawnAt) {
      if (this.activeCount() < Math.min(phase.maxActive, this.cfg.maxObjects)) {
        this.spawn(t, phase);
        this.nextSpawnAt = t + phase.spawnIntervalMs * between(this.rng, 0.75, 1.25);
      } else {
        this.nextSpawnAt = t + 90;
      }
    }
  }

  private phaseIndexAt(t: number) {
    const idx = this.cfg.phases.findIndex((p) => t < p.untilMs);
    return idx === -1 ? this.cfg.phases.length - 1 : idx;
  }

  private phase(): PhaseConfig {
    const p = this.cfg.phases[this.phaseIndex];
    if (!p) throw new Error('Fase inexistente');
    return p;
  }

  /** Objetos vivos y no tocados. */
  private activeCount() {
    return this._objects.filter((o) => o.hitAt === null && !o.removed).length;
  }

  private aliveKibbles() {
    return this._objects.filter((o) => o.kind === 'kibble' && o.hitAt === null && !o.removed).length;
  }

  private chooseKind(phase: PhaseConfig): ObjectKind {
    // Reglas de justicia: siempre tiene que haber algo para sumar.
    if (this.consecutiveDistractors >= this.cfg.maxConsecutiveDistractors) return 'kibble';
    if (this.aliveKibbles() === 0) return 'kibble';
    return this.rng() < phase.distractorChance ? 'distractor' : 'kibble';
  }

  private spawn(t: number, phase: PhaseConfig) {
    const kind = this.chooseKind(phase);
    this.consecutiveDistractors = kind === 'distractor' ? this.consecutiveDistractors + 1 : 0;
    const variant: ItemVariant =
      kind === 'kibble' ? pick(this.rng, KIBBLES[this.species]) : pick(this.rng, DISTRACTORS[this.species]);
    const traj = pickWeighted(this.rng, phase.trajectories);

    const { width, height } = this.viewport;
    const minSide = Math.min(width, height);
    const r = Math.max(between(this.rng, this.cfg.objectRadius.min, this.cfg.objectRadius.max), this.cfg.minRadiusPx / minSide);
    // Márgenes en fracciones de cada eje, para que el objeto entre completo.
    const mx = (r * minSide) / width;
    const my = (r * minSide) / height;
    const s = phase.speed;

    const o: GameObject = {
      id: this.nextId++,
      kind,
      variant,
      traj,
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: 0,
      ay: 0,
      baseX: 0.5,
      zigAmp: 0,
      zigFreq: 0,
      r,
      rot: between(this.rng, -0.5, 0.5),
      spin: between(this.rng, -1.2, 1.2),
      bornAt: t,
      lifeMs: null,
      hitAt: null,
      removed: false,
    };

    // Pequeño margen superior para que nada aparezca pegado al borde.
    const top = this.cfg.playfieldTop + my;
    const bottom = 1 - my - 0.02;

    switch (traj) {
      case 'pop': {
        o.lifeMs = phase.lifeMs * between(this.rng, 0.85, 1.15);
        o.spin *= 0.3;
        let best = { x: 0.5, y: 0.5, d: -1 };
        for (let i = 0; i < 8; i++) {
          const x = between(this.rng, mx + 0.03, 1 - mx - 0.03);
          const y = between(this.rng, top, bottom);
          const d = this.minDistancePx(x, y);
          if (d > best.d) best = { x, y, d };
          if (d > r * minSide * 2.6) break;
        }
        o.x = best.x;
        o.y = best.y;
        break;
      }
      case 'drift': {
        const fromLeft = this.rng() < 0.5;
        o.x = fromLeft ? -mx : 1 + mx;
        o.y = between(this.rng, top, bottom);
        o.vx = (fromLeft ? 1 : -1) * between(this.rng, 0.17, 0.25) * s;
        o.vy = between(this.rng, -0.03, 0.03);
        break;
      }
      case 'fall': {
        o.x = between(this.rng, mx + 0.03, 1 - mx - 0.03);
        o.y = -my;
        o.vy = between(this.rng, 0.2, 0.28) * s;
        break;
      }
      case 'zigzag': {
        o.baseX = between(this.rng, 0.15 + mx, 0.85 - mx);
        o.x = o.baseX;
        o.y = -my;
        o.vy = between(this.rng, 0.17, 0.23) * s;
        o.zigAmp = between(this.rng, 0.05, 0.09);
        o.zigFreq = between(this.rng, 3.5, 5) * Math.sqrt(s);
        break;
      }
      case 'arc': {
        // Se lanza desde abajo y cae por gravedad; la altura máxima no depende de la velocidad.
        const peak = between(this.rng, 0.62, 0.78);
        o.ay = 1.1 * s * s;
        o.vy = -Math.sqrt(2 * o.ay * peak);
        o.x = between(this.rng, 0.15, 0.85);
        o.y = 1 + my;
        o.vx = between(this.rng, -0.12, 0.12) * s;
        break;
      }
    }

    this._objects.push(o);
  }

  private minDistancePx(x: number, y: number) {
    const { width, height } = this.viewport;
    let min = Number.POSITIVE_INFINITY;
    for (const o of this._objects) {
      if (o.removed || o.hitAt !== null) continue;
      min = Math.min(min, Math.hypot((o.x - x) * width, (o.y - y) * height));
    }
    return min;
  }

  /** Escala visual de aparición y desaparición (0 a 1). */
  scaleOf(o: GameObject) {
    const t = this.simTime;
    const age = t - o.bornAt;
    let k = Math.min(1, age / POP_IN_MS);
    if (o.traj === 'pop' && o.lifeMs !== null && age > o.lifeMs) {
      k = Math.max(0, 1 - (age - o.lifeMs) / POP_OUT_MS);
    }
    return k;
  }

  /** Radio en píxeles CSS para el tamaño de pantalla actual. */
  radiusPx(o: GameObject) {
    const minSide = Math.min(this.viewport.width, this.viewport.height);
    return Math.max(o.r * minSide, this.cfg.minRadiusPx);
  }

  /* ------------------------------- Toques ------------------------------- */

  /**
   * Procesa un toque en coordenadas CSS relativas al área de juego.
   * Devuelve el evento generado o null si no tocó nada válido.
   */
  tap(px: number, py: number, now: number): GameEvent | null {
    if (this._state !== 'running') return null;
    this.update(now);
    if (this._state !== 'running') return null; // terminó justo ahora: no suma

    const { width, height } = this.viewport;
    let target: GameObject | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const o of this._objects) {
      if (o.removed || o.hitAt !== null) continue;
      if (this.scaleOf(o) < 0.35) continue; // desapareciendo o recién nacido
      const d = Math.hypot(o.x * width - px, o.y * height - py);
      const reach = this.radiusPx(o) * (1 + this.cfg.hitSlop);
      // Ante superposición gana el más cercano; a igual distancia, el más nuevo (dibujado arriba).
      if (d <= reach && d <= bestDist) {
        target = o;
        bestDist = d;
      }
    }
    if (!target) return null;

    target.hitAt = this.simTime;
    const delta = target.kind === 'kibble' ? this.cfg.points.kibble : this.cfg.points.distractor;
    const prev = this.stats.score;
    this.stats.score = Math.max(this.cfg.minScore, prev + delta);
    if (target.kind === 'kibble') {
      this.stats.kibbles++;
      this.streak++;
      this.stats.bestStreak = Math.max(this.stats.bestStreak, this.streak);
    } else {
      this.stats.distractors++;
      this.streak = 0;
    }

    const event: GameEvent = {
      type: 'hit',
      kind: target.kind,
      variant: target.variant,
      x: target.x * width,
      y: target.y * height,
      delta: this.stats.score - prev,
      score: this.stats.score,
      streak: this.streak,
    };
    this.events.push(event);
    return event;
  }

  private finish() {
    if (this._state === 'finished') return;
    if (this.runningSince !== null) {
      this.elapsedBefore = this.cfg.durationMs;
      this.runningSince = null;
    }
    this._state = 'finished';
    // Se detiene la aparición y se retiran los objetos que quedaban.
    this._objects = [];
    this.events.push({ type: 'end', score: this.stats.score });
  }

  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}
