/**
 * Razas disponibles. Son referencias visuales para personajes ilustrados
 * originales; no implican ningún ranking de popularidad.
 * La raza solo cambia el aspecto del personaje: las reglas del juego son
 * idénticas para todas.
 */

export type Species = 'perro' | 'gato';

export type DogEar = 'floppy' | 'long' | 'bat' | 'semi' | 'curly' | 'mixed';
export type CatEar = 'pointed' | 'small' | 'tufted';

interface BaseLook {
  fur: string;
  furShade: string;
  muzzle: string;
  nose: string;
  eye: string;
}

export interface DogLook extends BaseLook {
  species: 'perro';
  ear: DogEar;
  earColor: string;
  snout: 'normal' | 'long' | 'flat';
  topknot?: boolean;
  blaze?: string;
  eyePatch?: string;
  mask?: string;
}

export interface CatLook extends BaseLook {
  species: 'gato';
  ear: CatEar;
  earInner: string;
  pattern: 'none' | 'points' | 'tabby' | 'rosettes';
  patternColor?: string;
  fluffy?: boolean;
  ruff?: boolean;
  /** Contorno fino para pelajes claros que se confunden con fondos claros. */
  outline?: string;
  round?: boolean;
  flatFace?: boolean;
}

export type Look = DogLook | CatLook;

export interface Breed {
  id: string;
  species: Species;
  name: string;
  /** Nombre corto para usar en mensajes ("¡Vamos, Golden!"). */
  shortName: string;
  look: Look;
}

export const BREEDS: readonly Breed[] = [
  {
    id: 'golden',
    species: 'perro',
    name: 'Golden Retriever',
    shortName: 'Golden',
    look: {
      species: 'perro',
      fur: '#E3A857',
      furShade: '#C98A3C',
      muzzle: '#F6D9A6',
      nose: '#3A1E14',
      eye: '#3A1E14',
      ear: 'floppy',
      earColor: '#C27F33',
      snout: 'normal',
    },
  },
  {
    id: 'caniche',
    species: 'perro',
    name: 'Caniche',
    shortName: 'Caniche',
    look: {
      species: 'perro',
      fur: '#F2DCC0',
      furShade: '#DDBF9C',
      muzzle: '#FBEEDC',
      nose: '#3A1E14',
      eye: '#3A1E14',
      ear: 'curly',
      earColor: '#E6C9A5',
      snout: 'normal',
      topknot: true,
    },
  },
  {
    id: 'salchicha',
    species: 'perro',
    name: 'Salchicha (Dachshund)',
    shortName: 'Salchicha',
    look: {
      species: 'perro',
      fur: '#A0522D',
      furShade: '#7E3E20',
      muzzle: '#C7794A',
      nose: '#2B1610',
      eye: '#2B1610',
      ear: 'long',
      earColor: '#6E341A',
      snout: 'long',
    },
  },
  {
    id: 'bulldog-frances',
    species: 'perro',
    name: 'Bulldog Francés',
    shortName: 'Frenchie',
    look: {
      species: 'perro',
      fur: '#D9B98E',
      furShade: '#BF9C6E',
      muzzle: '#EBD3B0',
      nose: '#2B1A14',
      eye: '#2B1A14',
      ear: 'bat',
      earColor: '#C9A77A',
      snout: 'flat',
      mask: '#5A3C2C',
    },
  },
  {
    id: 'border-collie',
    species: 'perro',
    name: 'Border Collie',
    shortName: 'Collie',
    look: {
      species: 'perro',
      fur: '#2A2427',
      furShade: '#1A1618',
      muzzle: '#FFFFFF',
      nose: '#1A1618',
      eye: '#3A1E14',
      ear: 'semi',
      earColor: '#2A2427',
      snout: 'normal',
      blaze: '#FFFFFF',
    },
  },
  {
    id: 'perro-mestizo',
    species: 'perro',
    name: 'Mestizo',
    shortName: 'Mestizo',
    look: {
      species: 'perro',
      fur: '#C8925A',
      furShade: '#A97543',
      muzzle: '#F1D7B3',
      nose: '#2B1A14',
      eye: '#2B1A14',
      ear: 'mixed',
      earColor: '#8C5A2E',
      snout: 'normal',
      eyePatch: '#8C5A2E',
    },
  },
  {
    id: 'siames',
    species: 'gato',
    name: 'Siamés',
    shortName: 'Siamés',
    look: {
      species: 'gato',
      fur: '#F3E6D2',
      furShade: '#E2CFB3',
      muzzle: '#F8EFE2',
      nose: '#5A3A32',
      eye: '#5AA9E6',
      ear: 'pointed',
      earInner: '#6B4A3E',
      pattern: 'points',
      patternColor: '#5E4136',
      outline: '#8A6A55',
    },
  },
  {
    id: 'persa',
    species: 'gato',
    name: 'Persa',
    shortName: 'Persa',
    look: {
      species: 'gato',
      fur: '#FBF6EF',
      furShade: '#E2D5C4',
      muzzle: '#FFFFFF',
      nose: '#E79AA4',
      eye: '#D9822B',
      ear: 'small',
      earInner: '#F2B8BF',
      pattern: 'none',
      fluffy: true,
      flatFace: true,
      outline: '#8C7A68',
    },
  },
  {
    id: 'maine-coon',
    species: 'gato',
    name: 'Maine Coon',
    shortName: 'Maine Coon',
    look: {
      species: 'gato',
      fur: '#9C7A5B',
      furShade: '#7A5C42',
      muzzle: '#E9DCC9',
      nose: '#B5655F',
      eye: '#8DB33A',
      ear: 'tufted',
      earInner: '#E3C7A8',
      pattern: 'tabby',
      patternColor: '#4E3826',
      ruff: true,
    },
  },
  {
    id: 'british-shorthair',
    species: 'gato',
    name: 'British Shorthair',
    shortName: 'British',
    look: {
      species: 'gato',
      fur: '#8E99AB',
      furShade: '#76829A',
      muzzle: '#A7B1C0',
      nose: '#5D6577',
      eye: '#E08B2D',
      ear: 'small',
      earInner: '#B9A1A8',
      pattern: 'none',
      round: true,
    },
  },
  {
    id: 'bengali',
    species: 'gato',
    name: 'Bengalí',
    shortName: 'Bengalí',
    look: {
      species: 'gato',
      fur: '#E0A35A',
      furShade: '#C9883F',
      muzzle: '#F6E3C5',
      nose: '#B4594F',
      eye: '#6DB33F',
      ear: 'pointed',
      earInner: '#F1C9A0',
      pattern: 'rosettes',
      patternColor: '#4A2C17',
    },
  },
  {
    id: 'gato-mestizo',
    species: 'gato',
    name: 'Gato doméstico mestizo',
    shortName: 'Michi',
    look: {
      species: 'gato',
      fur: '#E8964A',
      furShade: '#CC7A33',
      muzzle: '#FFF4E6',
      nose: '#D9737A',
      eye: '#C9B02A',
      ear: 'pointed',
      earInner: '#F6C6A8',
      pattern: 'tabby',
      patternColor: '#B2601F',
    },
  },
];

export function breedsFor(species: Species): Breed[] {
  return BREEDS.filter((b) => b.species === species);
}

export function findBreed(id: string | null | undefined): Breed | undefined {
  return BREEDS.find((b) => b.id === id);
}

/** Personaje representativo para las tarjetas de elección de especie. */
export const SPECIES_COVER: Record<Species, string> = {
  perro: 'golden',
  gato: 'siames',
};
