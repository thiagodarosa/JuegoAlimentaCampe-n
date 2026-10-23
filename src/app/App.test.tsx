import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONFIG } from '../config/game.config';
import { SettingsProvider } from '../settings/SettingsContext';
import { App } from './App';

const NAME = 'Ana Pereira';
const PHONE = '099 123 456';
const EMAIL = 'ana@correo.com';

function renderApp() {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
  return user;
}

async function register(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), NAME);
  await user.type(screen.getByLabelText('Celular'), PHONE);
  await user.type(screen.getByLabelText('Correo electrónico'), EMAIL);
  await user.click(screen.getByRole('checkbox', { name: /acepto la política de privacidad/i }));
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function toInstructions(user: ReturnType<typeof userEvent.setup>) {
  await register(user);
  await user.click(screen.getByRole('button', { name: /mi campeón es un gato/i }));
  await user.click(screen.getByRole('radio', { name: /bengalí/i }));
  await user.click(screen.getByRole('button', { name: /vamos, bengalí/i }));
}

/** Avanza el reloj falso y los cuadros de animación. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('experiencia completa', { timeout: 30_000 }, () => {
  let setItem: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'], shouldAdvanceTime: true });
    setItem = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.useRealTimers();
    setItem.mockRestore();
  });

  it('no deja jugar sin completar el formulario', async () => {
    const user = renderApp();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.queryByText(/quién es tu campeón/i)).not.toBeInTheDocument();
  });

  it('recorre registro → especie → raza → instrucciones → partida → resultado → premio → reinicio', async () => {
    const user = renderApp();
    await register(user);
    expect(screen.getByRole('heading', { name: '¡Hola, Ana!' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mi campeón es un gato/i }));
    expect(screen.getAllByRole('radio')).toHaveLength(6);
    const confirm = screen.getByRole('button', { name: 'Elegí una raza' });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /bengalí/i }));
    expect(screen.getByRole('radio', { name: /bengalí/i })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: /vamos, bengalí/i }));

    expect(screen.getByRole('heading', { name: '¡Tu campeón te necesita!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));

    // El personaje elegido aparece en la partida.
    expect(screen.getByTestId('champion')).toHaveAttribute('data-breed', 'bengali');
    expect(screen.getByTestId('time-left')).toHaveTextContent('30');

    // Cuenta regresiva + 30 s de juego + cartel final.
    await advance(GAME_CONFIG.countdownSeconds * 1000 + 100);
    expect(screen.getByTestId('play-screen')).toHaveAttribute('data-phase', 'running');
    await advance(15_000);
    expect(Number(screen.getByTestId('time-left').textContent)).toBeLessThanOrEqual(15);
    await advance(15_000);
    expect(screen.getByText('¡Tiempo!')).toBeInTheDocument();
    await advance(GAME_CONFIG.endBannerMs + 50);

    expect(screen.getByTestId('result-screen')).toBeInTheDocument();
    expect(screen.getByText('¡Bien jugado, Ana!')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Medalla de bronce' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver mi premio' }));
    expect(screen.getByRole('heading', { name: '¡Gracias por jugar con GranPlus!' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finalizar' }));
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(screen.getByLabelText('Celular')).toHaveValue('');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(document.body).not.toHaveTextContent(/Ana/);
  });

  it('nunca escribe datos personales en el almacenamiento del navegador', async () => {
    const user = renderApp();
    await toInstructions(user);
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    await advance(35_000);
    for (const [, value] of setItem.mock.calls) {
      expect(String(value)).not.toContain(NAME);
      expect(String(value)).not.toContain(PHONE);
      expect(String(value)).not.toContain(EMAIL);
    }
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/Ana|099|correo/);
    expect(sessionStorage.length).toBe(0);
  });

  it('cancelar borra los datos y vuelve al inicio', async () => {
    const user = renderApp();
    await register(user);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Sí, cancelar' }));
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(document.body).not.toHaveTextContent(/Ana/);
  });

  it('la inactividad reinicia la experiencia', async () => {
    const user = renderApp();
    await register(user);
    expect(screen.getByText('¡Hola, Ana!')).toBeInTheDocument();
    await advance(95_000);
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    expect(document.body).not.toHaveTextContent(/Ana/);
  });

  it('si la app pierde visibilidad, la partida se pausa y el tiempo se congela', async () => {
    const user = renderApp();
    await toInstructions(user);
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    await advance(GAME_CONFIG.countdownSeconds * 1000 + 5_000);
    const before = Number(screen.getByTestId('time-left').textContent);

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(20_000);
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(screen.getByRole('dialog', { name: 'Partida en pausa' })).toBeInTheDocument();
    expect(Number(screen.getByTestId('time-left').textContent)).toBe(before);

    await user.click(screen.getByRole('button', { name: 'Seguir jugando' }));
    await advance(GAME_CONFIG.resumeCountdownSeconds * 1000 + 2_000);
    const after = Number(screen.getByTestId('time-left').textContent);
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(before - 4);
    visibility.mockRestore();
  });

  it('una pausa demasiado larga cancela la experiencia', async () => {
    const user = renderApp();
    await toInstructions(user);
    await user.click(screen.getByRole('button', { name: '¡A jugar!' }));
    await advance(GAME_CONFIG.countdownSeconds * 1000 + 2_000);
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(GAME_CONFIG.pauseTimeoutMs + 1_000);
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    visibility.mockRestore();
  });
});
