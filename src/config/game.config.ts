import { DEFAULT_BRAND, type BrandId } from './brands';

/**
 * Configuración central del juego. Todos los valores de puntuación, tiempos y
 * dificultad se ajustan desde acá.
 */

export type Trajectory = 'pop' | 'drift' | 'fall' | 'arc' | 'zigzag';

export interface PhaseConfig {
  /** La fase se aplica mientras el tiempo jugado sea menor a este valor (ms). */
  untilMs: number;
  /** Intervalo entre apariciones (ms). Se aplica una variación aleatoria de ±25 %. */
  spawnIntervalMs: number;
  /** Cantidad máxima de objetos simultáneos en pantalla. */
  maxActive: number;
  /** Probabilidad de que un objeto nuevo sea distractor (0 a 1). */
  distractorChance: number;
  /** Multiplicador de velocidad de las trayectorias. */
  speed: number;
  /** Tiempo de vida de los objetos estáticos ('pop'), en ms. */
  lifeMs: number;
  /** Trayectorias posibles con su peso relativo. */
  trajectories: Partial<Record<Trajectory, number>>;
}

export const GAME_CONFIG = {
  durationMs: 30_000,
  countdownSeconds: 3,

  points: {
    kibble: 10,
    distractor: -5,
  },
  minScore: 0,

  /** Tope absoluto de objetos vivos, para mantener el rendimiento estable. */
  maxObjects: 12,
  /** Nunca más de esta cantidad de distractores seguidos. */
  maxConsecutiveDistractors: 2,

  /** Radio de los objetos como fracción del lado menor del área de juego. */
  objectRadius: { min: 0.055, max: 0.07 },
  /** Radio mínimo en píxeles CSS, para que el área táctil nunca sea chica. */
  minRadiusPx: 26,
  /** Margen superior del área de juego (fracción del alto) donde no aparecen objetos estáticos. */
  playfieldTop: 0.03,
  /** Margen extra de detección táctil, como fracción del radio. */
  hitSlop: 0.3,

  phases: [
    {
      untilMs: 10_000,
      spawnIntervalMs: 520,
      maxActive: 5,
      distractorChance: 0.2,
      speed: 1,
      lifeMs: 2100,
      trajectories: { pop: 3, drift: 2, fall: 1 },
    },
    {
      untilMs: 20_000,
      spawnIntervalMs: 380,
      maxActive: 7,
      distractorChance: 0.28,
      speed: 1.25,
      lifeMs: 1800,
      trajectories: { pop: 2, drift: 2, fall: 2, arc: 2, zigzag: 1 },
    },
    {
      untilMs: Number.POSITIVE_INFINITY,
      spawnIntervalMs: 290,
      maxActive: 9,
      distractorChance: 0.33,
      speed: 1.5,
      lifeMs: 1550,
      trajectories: { pop: 1, drift: 2, fall: 2, arc: 3, zigzag: 2 },
    },
  ] satisfies readonly PhaseConfig[],

  /** Pausa: si la app queda oculta más de este tiempo, la experiencia se cancela. */
  pauseTimeoutMs: 120_000,
  resumeCountdownSeconds: 3,

  /** La ambientación de tensión empieza cuando queda este tiempo (ms). */
  tensionFromMs: 10_000,

  /** Duración del cartel "¡TIEMPO!" antes de pasar al resultado. */
  endBannerMs: 1400,
} as const;

export type MedalTier = 'bronce' | 'plata' | 'oro';

/** Textos de la pantalla de premio. */
export interface PrizeTexts {
  title: string;
  text: string;
}

export interface Settings {
  /** Marca activa en este dispositivo. */
  brand: BrandId;
  /** Umbrales y mensajes de medallas: compartidos por todas las marcas (las reglas del juego son las mismas). */
  medals: {
    silverFrom: number;
    goldFrom: number;
    messages: Record<MedalTier, string>;
  };
  /** Textos de premio por marca: cada marca agradece con su propio nombre. */
  prizes: Record<BrandId, PrizeTexts>;
  sound: boolean;
  anonymousMetrics: boolean;
  /** Sin actividad durante este tiempo, la experiencia vuelve al inicio y se borran los datos. */
  idleResetMs: number;
}

/** Valores por defecto; la promotora puede cambiarlos desde su panel. */
export const DEFAULT_SETTINGS: Settings = {
  brand: DEFAULT_BRAND,
  medals: {
    silverFrom: 150,
    goldFrom: 300,
    messages: {
      oro: '¡Tu campeón estuvo imparable!',
      plata: '¡Muy buen trabajo!',
      bronce: '¡Cada croqueta cuenta!',
    },
  },
  prizes: {
    granplus: {
      title: '¡Gracias por jugar con GranPlus!',
      text: 'Acercate a nuestra promotora para recibir tu premio y conocer más sobre la marca.',
    },
    biofresh: {
      title: '¡Gracias por jugar con Biofresh!',
      text: 'Acercate a nuestra promotora para recibir tu premio y conocer más sobre la marca.',
    },
  },
  sound: true,
  anonymousMetrics: false,
  idleResetMs: 90_000,
};

/** Versión de la política de privacidad que acepta el participante. */
export const PRIVACY_POLICY_VERSION = 'provisoria-2026-10';
