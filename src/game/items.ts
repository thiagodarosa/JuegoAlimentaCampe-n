import type { Species } from '../config/breeds';

/** Variantes visuales de los objetos del juego. */
export type KibbleVariant = 'kibble-round' | 'kibble-ring' | 'kibble-tri' | 'kibble-fish';
export type DistractorVariant = 'ball' | 'leaf' | 'bubble' | 'rope' | 'duck' | 'yarn' | 'mouse';
export type ItemVariant = KibbleVariant | DistractorVariant;

export const KIBBLES: Record<Species, readonly KibbleVariant[]> = {
  perro: ['kibble-round', 'kibble-ring', 'kibble-tri'],
  gato: ['kibble-round', 'kibble-ring', 'kibble-fish'],
};

export const DISTRACTORS: Record<Species, readonly DistractorVariant[]> = {
  perro: ['ball', 'leaf', 'bubble', 'rope', 'duck'],
  gato: ['ball', 'leaf', 'bubble', 'yarn', 'mouse'],
};

/** Mensajes breves al tocar un distractor: divertidos, sin castigar. */
export const DISTRACTOR_MESSAGES: Record<DistractorVariant, string> = {
  ball: '¡Uy, una pelota!',
  leaf: '¡Era una hoja!',
  bubble: '¡Plop! Una burbuja',
  rope: '¡Esa cuerda es para jugar!',
  duck: '¡Cuac! Ese no era',
  yarn: '¡El ovillo es para jugar!',
  mouse: '¡Es un ratón de juguete!',
};

export const DISTRACTOR_NAMES: Record<DistractorVariant, string> = {
  ball: 'Pelota',
  leaf: 'Hoja',
  bubble: 'Burbuja',
  rope: 'Juguete de cuerda',
  duck: 'Patito de goma',
  yarn: 'Ovillo de lana',
  mouse: 'Ratón de juguete',
};

export const KIBBLE_CHEERS = ['¡Ñam!', '¡Rico!', '¡Qué crocante!', '¡Otra más!'];

export function isKibble(variant: ItemVariant): variant is KibbleVariant {
  return variant.startsWith('kibble-');
}
