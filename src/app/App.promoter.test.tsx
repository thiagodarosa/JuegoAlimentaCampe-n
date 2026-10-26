import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetPinForTests, checkPin, MAX_PIN_ATTEMPTS, PIN_LOCK_MS, PROMOTER_PIN } from '../features/promoter/pin';
import { SettingsProvider } from '../settings/SettingsContext';
import { App } from './App';

function renderApp() {
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
  return user;
}

const corner = () => screen.getByRole('button', { name: 'Acceso de promotora' });

async function tapCorner(user: ReturnType<typeof userEvent.setup>, times: number) {
  for (let i = 0; i < times; i++) await user.click(corner());
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'], shouldAdvanceTime: true });
  __resetPinForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PIN de promotora', () => {
  it('el PIN es 123456', () => {
    expect(PROMOTER_PIN).toBe('123456');
    expect(checkPin('123456')).toEqual({ ok: true });
  });

  it('un PIN incorrecto descuenta intentos y después bloquea un rato', () => {
    const now = 1_000_000;
    for (let i = 1; i < MAX_PIN_ATTEMPTS; i++) {
      expect(checkPin('000000', now)).toEqual({ ok: false, locked: false, attemptsLeft: MAX_PIN_ATTEMPTS - i });
    }
    expect(checkPin('000000', now)).toMatchObject({ ok: false, locked: true });
    // Bloqueado: ni siquiera el PIN correcto entra.
    expect(checkPin(PROMOTER_PIN, now + 1000)).toMatchObject({ ok: false, locked: true });
    // Pasado el bloqueo, vuelve a funcionar.
    expect(checkPin(PROMOTER_PIN, now + PIN_LOCK_MS + 1)).toEqual({ ok: true });
  });
});

describe('acceso al panel de promotora', { timeout: 20_000 }, () => {
  it('5 toques en la esquina no hacen nada; el sexto pide el PIN', async () => {
    const user = renderApp();
    await tapCorner(user, 5);
    expect(screen.queryByRole('dialog', { name: 'Acceso de promotora' })).not.toBeInTheDocument();
    await tapCorner(user, 1);
    expect(screen.getByRole('dialog', { name: 'Acceso de promotora' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Modo promotora' })).not.toBeInTheDocument();
  });

  it('los toques tienen que ser seguidos', async () => {
    const user = renderApp();
    await tapCorner(user, 3);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    await tapCorner(user, 3);
    expect(screen.queryByRole('dialog', { name: 'Acceso de promotora' })).not.toBeInTheDocument();
    await tapCorner(user, 3);
    expect(screen.getByRole('dialog', { name: 'Acceso de promotora' })).toBeInTheDocument();
  });

  it('con el PIN correcto se abre el panel', async () => {
    const user = renderApp();
    await tapCorner(user, 6);
    await user.type(screen.getByLabelText('Ingresá el PIN'), '123456');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByRole('dialog', { name: 'Modo promotora' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Acceso de promotora' })).not.toBeInTheDocument();
  });

  it('con un PIN incorrecto no se abre y muestra el error', async () => {
    const user = renderApp();
    await tapCorner(user, 6);
    const input = screen.getByLabelText('Ingresá el PIN');
    await user.type(input, '654321{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('PIN incorrecto');
    expect(input).toHaveValue('');
    expect(screen.queryByRole('dialog', { name: 'Modo promotora' })).not.toBeInTheDocument();
  });

  it('el campo acepta solo números y no muestra lo que se escribe', async () => {
    const user = renderApp();
    await tapCorner(user, 6);
    const input = screen.getByLabelText('Ingresá el PIN');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    await user.type(input, '12ab34');
    expect(input).toHaveValue('1234');
  });

  it('el atajo de teclado también pide el PIN', async () => {
    const user = renderApp();
    await user.keyboard('{Control>}{Shift>}P{/Shift}{/Control}');
    expect(screen.getByRole('dialog', { name: 'Acceso de promotora' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Modo promotora' })).not.toBeInTheDocument();
  });

  it('cancelar cierra el pedido de PIN sin abrir el panel', async () => {
    const user = renderApp();
    await tapCorner(user, 6);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
