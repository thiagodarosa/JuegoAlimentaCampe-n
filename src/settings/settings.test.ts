import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../config/game.config';
import { loadMetrics, recordGame } from './metrics';
import { loadSettings, medalFor, sanitizeSettings, saveSettings } from './settings';

describe('medallas', () => {
  const medals = { ...DEFAULT_SETTINGS.medals, silverFrom: 150, goldFrom: 300 };

  it.each([
    [0, 'bronce'],
    [149, 'bronce'],
    [150, 'plata'],
    [299, 'plata'],
    [300, 'oro'],
    [5000, 'oro'],
  ] as const)('%i puntos → %s', (score, medal) => {
    expect(medalFor(score, medals)).toBe(medal);
  });
});

describe('configuración', () => {
  it('usa valores por defecto si no hay nada guardado o está dañado', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem('granplus-campeon:settings:v1', '{no es json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('guarda y recupera cambios', () => {
    const s = structuredClone(DEFAULT_SETTINGS);
    s.medals.silverFrom = 120;
    s.prizes.granplus.title = '¡Gracias!';
    saveSettings(s);
    expect(loadSettings().medals.silverFrom).toBe(120);
    expect(loadSettings().prizes.granplus.title).toBe('¡Gracias!');
  });

  it('corrige umbrales inválidos', () => {
    const s = sanitizeSettings({ medals: { silverFrom: 200, goldFrom: 100 } });
    expect(s.medals.goldFrom).toBeGreaterThan(s.medals.silverFrom);
    expect(sanitizeSettings({ medals: { silverFrom: -5 } }).medals.silverFrom).toBe(DEFAULT_SETTINGS.medals.silverFrom);
  });

  it('no acepta textos vacíos', () => {
    expect(sanitizeSettings({ prizes: { granplus: { title: '   ' } } }).prizes.granplus.title).toBe(
      DEFAULT_SETTINGS.prizes.granplus.title,
    );
  });
});

describe('marca activa', () => {
  it('sin configuración guardada, la marca es GranPlus', () => {
    expect(loadSettings().brand).toBe('granplus');
    expect(DEFAULT_SETTINGS.brand).toBe('granplus');
  });

  it('la marca elegida se guarda y se recupera', () => {
    saveSettings({ ...structuredClone(DEFAULT_SETTINGS), brand: 'biofresh' });
    expect(loadSettings().brand).toBe('biofresh');
  });

  it('una marca desconocida vuelve a GranPlus', () => {
    expect(sanitizeSettings({ brand: 'otra' }).brand).toBe('granplus');
  });

  it('cambiar de marca no altera umbrales ni mensajes de medallas', () => {
    const before = sanitizeSettings({ medals: { silverFrom: 120, goldFrom: 260 } });
    const after = sanitizeSettings({ ...before, brand: 'biofresh' });
    expect(after.medals).toEqual(before.medals);
  });

  it('cada marca tiene su propio texto de premio', () => {
    const s = sanitizeSettings(null);
    expect(s.prizes.granplus.title).toContain('GranPlus');
    expect(s.prizes.biofresh.title).toContain('Biofresh');
  });

  it('migra el texto de premio guardado por la versión anterior a GranPlus', () => {
    const legacy = { prize: { title: 'Premio personalizado', text: 'Texto viejo' }, medals: { silverFrom: 90, goldFrom: 200 } };
    const s = sanitizeSettings(legacy);
    expect(s.prizes.granplus).toEqual({ title: 'Premio personalizado', text: 'Texto viejo' });
    expect(s.prizes.biofresh.title).toContain('Biofresh');
    expect(s.medals.silverFrom).toBe(90);
    expect(s.brand).toBe('granplus');
  });
});

describe('métricas anónimas', () => {
  it('solo guarda totales', () => {
    recordGame(120, 'bronce', 'perro');
    recordGame(320, 'oro', 'gato');
    const m = loadMetrics();
    expect(m).toEqual({
      games: 2,
      totalScore: 440,
      bestScore: 320,
      medals: { bronce: 1, plata: 0, oro: 1 },
      species: { perro: 1, gato: 1 },
    });
  });
});
