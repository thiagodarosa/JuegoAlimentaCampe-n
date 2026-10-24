import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, GAME_CONFIG, type Settings } from '../config/game.config';
import { SettingsProvider, useSettings } from '../settings/SettingsContext';
import { App } from './App';

// Se espía el módulo de audio: estas pruebas verifican CUÁNDO suenan las cosas.
vi.mock('../audio/sfx', () => ({
  play: vi.fn(),
  playVoice: vi.fn(),
  playCelebration: vi.fn(),
  startTension: vi.fn(),
  setTensionIntensity: vi.fn(),
  stopTension: vi.fn(),
  stopAll: vi.fn(),
  setSoundEnabled: vi.fn(),
  unlockAudio: vi.fn(),
  preloadVoiceClips: vi.fn(),
}));
const sfx = await import('../audio/sfx');

let settingsApi: ReturnType<typeof useSettings> | null = null;
function SettingsSpy() {
  settingsApi = useSettings();
  return null;
}

function renderApp(initial?: Partial<Settings>) {
  const user = userEvent.setup();
  render(
    <SettingsProvider initial={initial ? { ...structuredClone(DEFAULT_SETTINGS), ...initial } : undefined}>
      <SettingsSpy />
      <App />
    </SettingsProvider>,
  );
  return user;
}

async function register(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana Pereira');
  await user.type(screen.getByLabelText('Celular'), '099 123 456');
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
  await user.click(screen.getByRole('checkbox', { name: /acepto la política de privacidad/i }));
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'],
    shouldAdvanceTime: true,
  });
  vi.clearAllMocks();
  settingsApi = null;
  delete document.documentElement.dataset.brand;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('marca activa', { timeout: 30_000 }, () => {
  it('sin configuración, la experiencia es GranPlus', () => {
    renderApp();
    expect(document.documentElement.dataset.brand).toBe('granplus');
    expect(screen.getByRole('img', { name: 'GranPlus' })).toBeInTheDocument();
    expect(screen.getByText(/promociones de GranPlus/)).toBeInTheDocument();
  });

  it('con Biofresh activa, cambia la marca en toda la experiencia', async () => {
    const user = renderApp({ brand: 'biofresh' });
    expect(document.documentElement.dataset.brand).toBe('biofresh');
    expect(document.title).toContain('Biofresh');
    expect(screen.getByRole('img', { name: 'Biofresh' })).toBeInTheDocument();
    expect(screen.getByText(/promociones de Biofresh/)).toBeInTheDocument();

    await register(user);
    expect(screen.getByRole('img', { name: 'Biofresh' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /mi campeón es un gato/i }));
    await user.click(screen.getByRole('radio', { name: /persa/i }));
    await user.click(screen.getByRole('button', { name: /vamos, persa/i }));
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    expect(screen.getByRole('img', { name: 'Biofresh' })).toBeInTheDocument();
    await advance(GAME_CONFIG.countdownSeconds * 1000 + GAME_CONFIG.durationMs + GAME_CONFIG.endBannerMs + 500);
    expect(screen.getByTestId('result-screen')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver mi premio' }));
    expect(screen.getByRole('heading', { name: '¡Gracias por jugar con Biofresh!' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /envase biofresh/i })).toHaveLength(2);
  });

  it('un cambio de marca durante una experiencia se aplica recién en la siguiente', async () => {
    const user = renderApp();
    await register(user);
    await user.click(screen.getByRole('button', { name: /mi campeón es un perro/i }));
    await user.click(screen.getByRole('radio', { name: /golden/i }));
    await user.click(screen.getByRole('button', { name: /vamos, golden/i }));
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    await advance(GAME_CONFIG.countdownSeconds * 1000 + 5_000);

    // Otra parte de la app (u otra pestaña) cambia la marca guardada en plena partida.
    act(() => settingsApi!.update({ ...settingsApi!.settings, brand: 'biofresh' }));
    await advance(500);
    expect(document.documentElement.dataset.brand).toBe('granplus');
    expect(screen.getByRole('img', { name: 'GranPlus' })).toBeInTheDocument();
    expect(screen.getByTestId('play-screen')).toHaveAttribute('data-phase', 'running');

    // Al terminar la experiencia, la siguiente ya usa Biofresh.
    await advance(GAME_CONFIG.durationMs + GAME_CONFIG.endBannerMs);
    await user.click(screen.getByRole('button', { name: 'Ver mi premio' }));
    expect(screen.getByRole('heading', { name: '¡Gracias por jugar con GranPlus!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Finalizar' }));
    expect(document.documentElement.dataset.brand).toBe('biofresh');
    expect(screen.getByRole('img', { name: 'Biofresh' })).toBeInTheDocument();
  });

  it('los umbrales de medalla son los mismos para ambas marcas', async () => {
    const user = renderApp({ brand: 'biofresh', medals: { ...DEFAULT_SETTINGS.medals, silverFrom: 0, goldFrom: 10_000 } });
    await register(user);
    await user.click(screen.getByRole('button', { name: /mi campeón es un perro/i }));
    await user.click(screen.getByRole('radio', { name: /caniche/i }));
    await user.click(screen.getByRole('button', { name: /vamos, caniche/i }));
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    await advance(GAME_CONFIG.countdownSeconds * 1000 + GAME_CONFIG.durationMs + GAME_CONFIG.endBannerMs + 500);
    expect(screen.getByRole('img', { name: 'Medalla de plata' })).toBeInTheDocument();
  });
});

describe('sonidos', { timeout: 30_000 }, () => {
  it('ladrido al elegir perro y raza canina, sin repetir por re-render ni por tocar la misma tarjeta', async () => {
    const user = renderApp();
    await register(user);
    expect(sfx.playVoice).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /mi campeón es un perro/i }));
    expect(sfx.playVoice).toHaveBeenCalledTimes(1);
    expect(sfx.playVoice).toHaveBeenLastCalledWith('bark');
    await user.click(screen.getByRole('radio', { name: /border collie/i }));
    expect(sfx.playVoice).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('radio', { name: /border collie/i }));
    expect(sfx.playVoice).toHaveBeenCalledTimes(2);
    await user.hover(screen.getByRole('radio', { name: /golden/i }));
    expect(sfx.playVoice).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: /vamos, collie/i }));
    expect(sfx.playVoice).toHaveBeenCalledTimes(2);
  });

  it('maullido al elegir gato y raza felina', async () => {
    const user = renderApp();
    await register(user);
    await user.click(screen.getByRole('button', { name: /mi campeón es un gato/i }));
    await user.click(screen.getByRole('radio', { name: /siamés/i }));
    expect(vi.mocked(sfx.playVoice).mock.calls).toEqual([['meow'], ['meow']]);
  });

  it('la tensión empieza a los 10 segundos finales y se detiene al terminar; la celebración suena una vez', async () => {
    const user = renderApp();
    await register(user);
    await user.click(screen.getByRole('button', { name: /mi campeón es un gato/i }));
    await user.click(screen.getByRole('radio', { name: /bengalí/i }));
    await user.click(screen.getByRole('button', { name: /vamos, bengalí/i }));
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));

    await advance(GAME_CONFIG.countdownSeconds * 1000 + 100);
    await advance(GAME_CONFIG.durationMs - GAME_CONFIG.tensionFromMs - 1_000); // quedan ~11 s
    expect(sfx.startTension).not.toHaveBeenCalled();
    await advance(2_000); // quedan ~9 s
    expect(sfx.startTension).toHaveBeenCalled();
    expect(sfx.setTensionIntensity).toHaveBeenCalled();
    const intensities = vi.mocked(sfx.setTensionIntensity).mock.calls.map(([k]) => k);
    expect(Math.min(...intensities)).toBeGreaterThanOrEqual(0);

    vi.mocked(sfx.stopTension).mockClear();
    await advance(10_000);
    expect(screen.getByText('¡Tiempo!')).toBeInTheDocument();
    expect(sfx.stopTension).toHaveBeenCalled();
    const lastIntensity = vi.mocked(sfx.setTensionIntensity).mock.calls.at(-1)![0];
    expect(lastIntensity).toBeGreaterThan(0.8); // creció hasta el final

    expect(sfx.playCelebration).not.toHaveBeenCalled();
    await advance(GAME_CONFIG.endBannerMs + 100);
    expect(screen.getByTestId('result-screen')).toBeInTheDocument();
    expect(sfx.playCelebration).toHaveBeenCalledTimes(1);
    const [resultId] = vi.mocked(sfx.playCelebration).mock.calls[0]!;

    // Re-renders de la pantalla de resultado (por ejemplo, al cambiar el sonido) no vuelven a pedirla.
    await user.click(screen.getByTestId('sound-toggle'));
    await user.click(screen.getByTestId('sound-toggle'));
    expect(vi.mocked(sfx.playCelebration).mock.calls.every(([id]) => id === resultId)).toBe(true);
    expect(sfx.playCelebration).toHaveBeenCalledTimes(1);
  });

  it('salir de la partida detiene la tensión', async () => {
    const user = renderApp();
    await register(user);
    await user.click(screen.getByRole('button', { name: /mi campeón es un perro/i }));
    await user.click(screen.getByRole('radio', { name: /golden/i }));
    await user.click(screen.getByRole('button', { name: /vamos, golden/i }));
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    await advance(GAME_CONFIG.countdownSeconds * 1000 + 22_000);
    expect(sfx.startTension).toHaveBeenCalled();
    vi.mocked(sfx.stopTension).mockClear();

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(sfx.stopTension).toHaveBeenCalled();
    visibility.mockRestore();
  });

  it('el botón de sonido silencia, se mantiene entre pantallas y se guarda', async () => {
    const user = renderApp();
    const toggle = () => screen.getByTestId('sound-toggle');
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(sfx.setSoundEnabled).toHaveBeenLastCalledWith(false);

    await register(user);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: /mi campeón es un perro/i }));
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(JSON.parse(localStorage.getItem('granplus-campeon:settings:v1')!).sound).toBe(false);

    await user.click(toggle());
    expect(sfx.setSoundEnabled).toHaveBeenLastCalledWith(true);
  });
});
