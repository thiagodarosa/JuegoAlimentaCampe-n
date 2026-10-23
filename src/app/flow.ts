import { findBreed, type Species } from '../config/breeds';
import type { MedalTier } from '../config/game.config';
import type { Participant } from '../participant/types';

/**
 * Máquina de estados de la experiencia. Es una función pura, así el flujo y
 * la limpieza de datos se pueden probar sin interfaz.
 */

export type Step = 'registro' | 'especie' | 'raza' | 'instrucciones' | 'juego' | 'resultado' | 'premio';

export interface GameResult {
  score: number;
  kibbles: number;
  distractors: number;
  bestStreak: number;
  medal: MedalTier;
}

export interface FlowState {
  step: Step;
  participant: Participant | null;
  /** Modo demostración: se juega sin registrar una participación real. */
  demo: boolean;
  species: Species | null;
  breedId: string | null;
  result: GameResult | null;
  /** Cambia en cada reinicio; se usa como `key` para desmontar todo lo anterior. */
  sessionId: number;
  /** Cambia en cada partida nueva. */
  runId: number;
}

export type FlowAction =
  | { type: 'register'; participant: Participant }
  | { type: 'startDemo' }
  | { type: 'chooseSpecies'; species: Species }
  | { type: 'chooseBreed'; breedId: string }
  | { type: 'back' }
  | { type: 'startGame' }
  | { type: 'finishGame'; result: GameResult }
  | { type: 'showPrize' }
  | { type: 'reset' };

export function initialFlow(sessionId = 0): FlowState {
  return {
    step: 'registro',
    participant: null,
    demo: false,
    species: null,
    breedId: null,
    result: null,
    sessionId,
    runId: 0,
  };
}

function canPlay(s: FlowState) {
  return s.participant !== null || s.demo;
}

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'register':
      if (state.step !== 'registro') return state;
      return { ...state, participant: action.participant, demo: false, step: 'especie' };

    case 'startDemo':
      return { ...initialFlow(state.sessionId + 1), demo: true, step: 'especie' };

    case 'chooseSpecies':
      if (!canPlay(state) || (state.step !== 'especie' && state.step !== 'raza')) return state;
      return {
        ...state,
        species: action.species,
        breedId: state.species === action.species ? state.breedId : null,
        step: 'raza',
      };

    case 'chooseBreed': {
      const breed = findBreed(action.breedId);
      if (!canPlay(state) || state.step !== 'raza' || !breed || breed.species !== state.species) return state;
      return { ...state, breedId: breed.id, step: 'instrucciones' };
    }

    case 'back':
      if (state.step === 'raza') return { ...state, step: 'especie' };
      if (state.step === 'instrucciones') return { ...state, step: 'raza' };
      return state;

    case 'startGame':
      if (!canPlay(state) || state.step !== 'instrucciones' || !state.breedId) return state;
      return { ...state, step: 'juego', result: null, runId: state.runId + 1 };

    case 'finishGame':
      if (state.step !== 'juego') return state;
      return { ...state, step: 'resultado', result: action.result };

    case 'showPrize':
      if (state.step !== 'resultado') return state;
      return { ...state, step: 'premio' };

    case 'reset':
      // Se descarta todo, incluidos los datos personales.
      return initialFlow(state.sessionId + 1);
  }
}
