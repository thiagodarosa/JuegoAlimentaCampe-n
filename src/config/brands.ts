import type { Species } from './breeds';
import gpLogo from '../assets/brand/logo-granplus.png';
import gpCatGourmet from '../assets/brand/pack-gato-gourmet-castrado.webp';
import gpCatMenu from '../assets/brand/pack-gato-menu-gatito.webp';
import gpDogGourmet from '../assets/brand/pack-perro-gourmet-adulto.webp';
import gpDogMenu from '../assets/brand/pack-perro-menu-senior.webp';
import bfLogo from '../assets/brand/biofresh/logo-biofresh.png';
import bfCatAdult from '../assets/brand/biofresh/pack-gato-adulto.png';
import bfDogAdult from '../assets/brand/biofresh/pack-perro-adulto.webp';

/**
 * Marcas disponibles. La promotora elige una desde su panel y todos los
 * participantes de ese dispositivo ven esa marca. Los colores y las
 * tipografías de cada marca están en `src/styles/global.css`
 * (`:root[data-brand="…"]`); acá están los recursos y los textos.
 *
 * El motor de juego, los personajes, las razas y las reglas son los mismos
 * para todas las marcas.
 */

export type BrandId = 'granplus' | 'biofresh';

export const BRAND_IDS: readonly BrandId[] = ['granplus', 'biofresh'];
export const DEFAULT_BRAND: BrandId = 'granplus';

export interface PackImage {
  src: string;
  alt: string;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  logo: {
    src: string;
    /** Relación de aspecto del recorte (el PNG tiene margen transparente). */
    aspect: string;
    /**
     * true: el logotipo oficial se recolorea en blanco con un filtro CSS para
     * fondos oscuros (versión provisoria). false: se muestra sin alterar.
     */
    whiteOnDark: boolean;
    /** Factor de tamaño respecto del logotipo de GranPlus. */
    scale: number;
  };
  /** Envases de la pantalla de premio (el primero va adelante). PNG/WebP con fondo transparente. */
  packs: Record<Species, PackImage[]>;
  /** Relación de aspecto del recorte de los envases (las imágenes tienen margen transparente). */
  packAspect: number;
  confetti: string[];
  /** Cinta de la medalla: claro, oscuro, filete. */
  medalRibbon: [string, string, string];
  /** Tipografía de los textos dibujados en el Canvas. */
  canvasFont: string;
  /** Tono del campo de juego: en campos claros los objetos se dibujan con sombra. */
  fieldTone: 'dark' | 'light';
  themeColor: string;
}

export const BRANDS: Record<BrandId, BrandConfig> = {
  granplus: {
    id: 'granplus',
    name: 'GranPlus',
    logo: { src: gpLogo, aspect: '680 / 400', whiteOnDark: true, scale: 1 },
    packs: {
      perro: [
        { src: gpDogMenu, alt: 'Envase GranPlus Menu para perros' },
        { src: gpDogGourmet, alt: 'Envase GranPlus Gourmet para perros' },
      ],
      gato: [
        { src: gpCatMenu, alt: 'Envase GranPlus Menu para gatos' },
        { src: gpCatGourmet, alt: 'Envase GranPlus Gourmet para gatos' },
      ],
    },
    packAspect: 0.52,
    confetti: ['#F3C879', '#FF8B7B', '#FFFFFF', '#CA6976', '#FFE3A8'],
    medalRibbon: ['#84103F', '#6A0032', '#F3C879'],
    canvasFont: 'Figtree, system-ui, sans-serif',
    fieldTone: 'dark',
    themeColor: '#54032A',
  },
  biofresh: {
    id: 'biofresh',
    name: 'Biofresh',
    logo: { src: bfLogo, aspect: '900 / 230', whiteOnDark: false, scale: 1.35 },
    packs: {
      // Un envase de perro y uno de gato; adelante, el de la especie elegida.
      perro: [
        { src: bfDogAdult, alt: 'Envase Biofresh para perros adultos' },
        { src: bfCatAdult, alt: 'Envase Biofresh para gatos adultos' },
      ],
      gato: [
        { src: bfCatAdult, alt: 'Envase Biofresh para gatos adultos' },
        { src: bfDogAdult, alt: 'Envase Biofresh para perros adultos' },
      ],
    },
    packAspect: 0.66,
    confetti: ['#F9A8D4', '#90DFFF', '#CFF3E9', '#FCC6BB', '#FFFFFF', '#1F2937'],
    medalRibbon: ['#2B4C6F', '#1A2E45', '#F9A8D4'],
    canvasFont: '"Nunito Sans", system-ui, sans-serif',
    fieldTone: 'light',
    themeColor: '#FFFFFF',
  },
};

export function isBrandId(value: unknown): value is BrandId {
  return typeof value === 'string' && (BRAND_IDS as readonly string[]).includes(value);
}
