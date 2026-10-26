/**
 * PIN del modo promotora.
 *
 * Evita que un participante abra el panel por accidente o por curiosidad.
 * NO es seguridad real: el PIN viaja dentro del código de la app (cualquiera
 * con conocimientos técnicos puede leerlo) y la app no maneja datos que haya
 * que proteger en el dispositivo. Para cambiarlo, editar PROMOTER_PIN y
 * volver a publicar la app.
 */
export const PROMOTER_PIN = '123456';

/** Intentos fallidos seguidos antes de bloquear el ingreso por un rato. */
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCK_MS = 30_000;

let failures = 0;
let lockedUntil = 0;

export type PinResult = { ok: true } | { ok: false; locked: false; attemptsLeft: number } | { ok: false; locked: true; retryInMs: number };

export function pinLockRemaining(now = Date.now()) {
  return Math.max(0, lockedUntil - now);
}

export function checkPin(input: string, now = Date.now()): PinResult {
  const wait = pinLockRemaining(now);
  if (wait > 0) return { ok: false, locked: true, retryInMs: wait };
  if (input === PROMOTER_PIN) {
    failures = 0;
    return { ok: true };
  }
  failures += 1;
  if (failures >= MAX_PIN_ATTEMPTS) {
    failures = 0;
    lockedUntil = now + PIN_LOCK_MS;
    return { ok: false, locked: true, retryInMs: PIN_LOCK_MS };
  }
  return { ok: false, locked: false, attemptsLeft: MAX_PIN_ATTEMPTS - failures };
}

/** Solo para pruebas. */
export function __resetPinForTests() {
  failures = 0;
  lockedUntil = 0;
}
