import { describe, expect, it } from 'vitest';
import type { Participant } from '../participant/types';
import { flowReducer, initialFlow, type FlowAction, type FlowState } from './flow';

const participant: Participant = {
  fullName: 'Ana Pereira',
  phone: '099 123 456',
  email: 'ana@correo.com',
  consent: { privacyAccepted: true, privacyPolicyVersion: 'test', promotionsOptIn: false, acceptedAt: '2026-10-22T00:00:00Z' },
};

const result = { score: 120, kibbles: 13, distractors: 2, bestStreak: 6, medal: 'bronce' as const };

function apply(state: FlowState, ...actions: FlowAction[]) {
  return actions.reduce(flowReducer, state);
}

describe('flujo de la experiencia', () => {
  it('recorre todas las pantallas en orden', () => {
    let s = initialFlow();
    expect(s.step).toBe('registro');
    s = apply(s, { type: 'register', participant });
    expect(s.step).toBe('especie');
    s = apply(s, { type: 'chooseSpecies', species: 'gato' });
    expect(s.step).toBe('raza');
    s = apply(s, { type: 'chooseBreed', breedId: 'siames' });
    expect(s.step).toBe('instrucciones');
    s = apply(s, { type: 'startGame' });
    expect(s.step).toBe('juego');
    s = apply(s, { type: 'finishGame', result });
    expect(s.step).toBe('resultado');
    s = apply(s, { type: 'showPrize' });
    expect(s.step).toBe('premio');
  });

  it('no permite saltear el registro', () => {
    const s = apply(
      initialFlow(),
      { type: 'chooseSpecies', species: 'perro' },
      { type: 'chooseBreed', breedId: 'golden' },
      { type: 'startGame' },
    );
    expect(s.step).toBe('registro');
    expect(s.species).toBeNull();
  });

  it('no acepta una raza de otra especie', () => {
    const s = apply(initialFlow(), { type: 'register', participant }, { type: 'chooseSpecies', species: 'perro' }, { type: 'chooseBreed', breedId: 'siames' });
    expect(s.step).toBe('raza');
    expect(s.breedId).toBeNull();
  });

  it('no pide los datos dos veces: registrar de nuevo no hace nada', () => {
    const s = apply(initialFlow(), { type: 'register', participant });
    const again = flowReducer(s, { type: 'register', participant: { ...participant, fullName: 'Otro Nombre' } });
    expect(again).toBe(s);
  });

  it('volver mantiene la especie y permite cambiarla', () => {
    let s = apply(initialFlow(), { type: 'register', participant }, { type: 'chooseSpecies', species: 'perro' }, { type: 'chooseBreed', breedId: 'golden' });
    s = apply(s, { type: 'back' });
    expect(s.step).toBe('raza');
    s = apply(s, { type: 'back' });
    expect(s.step).toBe('especie');
    s = apply(s, { type: 'chooseSpecies', species: 'gato' });
    expect(s.breedId).toBeNull();
  });

  it('el reinicio borra los datos del participante y la partida', () => {
    const s = apply(
      initialFlow(),
      { type: 'register', participant },
      { type: 'chooseSpecies', species: 'perro' },
      { type: 'chooseBreed', breedId: 'golden' },
      { type: 'startGame' },
      { type: 'finishGame', result },
      { type: 'showPrize' },
      { type: 'reset' },
    );
    expect(s.step).toBe('registro');
    expect(s.participant).toBeNull();
    expect(s.result).toBeNull();
    expect(s.species).toBeNull();
    expect(s.breedId).toBeNull();
    expect(JSON.stringify(s)).not.toContain('Ana');
    expect(s.sessionId).toBe(1);
  });

  it('cancelar a mitad de camino también borra todo', () => {
    const s = apply(initialFlow(), { type: 'register', participant }, { type: 'chooseSpecies', species: 'perro' }, { type: 'reset' });
    expect(s).toEqual(initialFlow(1));
  });

  it('el modo demo permite jugar sin participante', () => {
    const s = apply(
      initialFlow(),
      { type: 'startDemo' },
      { type: 'chooseSpecies', species: 'perro' },
      { type: 'chooseBreed', breedId: 'golden' },
      { type: 'startGame' },
    );
    expect(s.step).toBe('juego');
    expect(s.demo).toBe(true);
    expect(s.participant).toBeNull();
  });

  it('cada partida tiene un identificador nuevo', () => {
    const s = apply(initialFlow(), { type: 'register', participant }, { type: 'chooseSpecies', species: 'perro' }, { type: 'chooseBreed', breedId: 'golden' }, { type: 'startGame' });
    expect(s.runId).toBe(1);
  });

  it('el resultado solo se registra desde la partida', () => {
    const s = flowReducer(initialFlow(), { type: 'finishGame', result });
    expect(s.step).toBe('registro');
    expect(s.result).toBeNull();
  });
});
