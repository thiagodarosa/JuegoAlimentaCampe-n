import type { MedalTier } from '../config/game.config';
import type { Species } from '../config/breeds';

/**
 * Métricas anónimas y agregadas del dispositivo (solo si la promotora las
 * habilita). No guardan nombres, contactos, fechas por partida ni ningún dato
 * que permita identificar a una persona.
 */

const KEY = 'granplus-campeon:metrics:v1';

export interface Metrics {
  games: number;
  totalScore: number;
  bestScore: number;
  medals: Record<MedalTier, number>;
  species: Record<Species, number>;
}

export function emptyMetrics(): Metrics {
  return { games: 0, totalScore: 0, bestScore: 0, medals: { bronce: 0, plata: 0, oro: 0 }, species: { perro: 0, gato: 0 } };
}

export function loadMetrics(): Metrics {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyMetrics();
    const m = JSON.parse(raw) as Partial<Metrics>;
    const base = emptyMetrics();
    return {
      games: Number(m.games) || 0,
      totalScore: Number(m.totalScore) || 0,
      bestScore: Number(m.bestScore) || 0,
      medals: { ...base.medals, ...m.medals },
      species: { ...base.species, ...m.species },
    };
  } catch {
    return emptyMetrics();
  }
}

export function recordGame(score: number, medal: MedalTier, species: Species): Metrics {
  const m = loadMetrics();
  m.games += 1;
  m.totalScore += score;
  m.bestScore = Math.max(m.bestScore, score);
  m.medals[medal] += 1;
  m.species[species] += 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    // Sin almacenamiento: no se registran métricas.
  }
  return m;
}

export function clearMetrics() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar.
  }
}
