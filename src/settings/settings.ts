import { DEFAULT_SETTINGS, type MedalTier, type Settings } from '../config/game.config';

/**
 * Configuración de la activación (umbrales de medallas, textos de premio,
 * sonido). Se guarda en localStorage del dispositivo porque no contiene datos
 * personales y tiene que sobrevivir a un reinicio de la tablet.
 */

const KEY = 'granplus-campeon:settings:v1';

export function medalFor(score: number, medals: Settings['medals']): MedalTier {
  if (score >= medals.goldFrom) return 'oro';
  if (score >= medals.silverFrom) return 'plata';
  return 'bronce';
}

function text(value: unknown, fallback: string, max = 160) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
}

function int(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

/** Valida y completa una configuración leída de almacenamiento. */
export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  if (!raw || typeof raw !== 'object') return structuredClone(d);
  const r = raw as Record<string, any>;
  const silverFrom = int(r.medals?.silverFrom, d.medals.silverFrom);
  let goldFrom = int(r.medals?.goldFrom, d.medals.goldFrom);
  if (goldFrom <= silverFrom) goldFrom = silverFrom + 10;
  return {
    medals: {
      silverFrom,
      goldFrom,
      messages: {
        oro: text(r.medals?.messages?.oro, d.medals.messages.oro),
        plata: text(r.medals?.messages?.plata, d.medals.messages.plata),
        bronce: text(r.medals?.messages?.bronce, d.medals.messages.bronce),
      },
    },
    prize: {
      title: text(r.prize?.title, d.prize.title),
      text: text(r.prize?.text, d.prize.text, 300),
    },
    sound: typeof r.sound === 'boolean' ? r.sound : d.sound,
    anonymousMetrics: typeof r.anonymousMetrics === 'boolean' ? r.anonymousMetrics : d.anonymousMetrics,
    idleResetMs: Math.max(30_000, int(r.idleResetMs, d.idleResetMs)),
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return sanitizeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Almacenamiento no disponible: la configuración dura hasta recargar.
  }
}
