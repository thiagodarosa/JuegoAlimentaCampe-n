import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `onIdle` si no hay interacción durante `ms`. Se usa para que los
 * datos de un participante que se fue no queden a la vista del siguiente.
 */
export function useIdleTimer(ms: number, enabled: boolean, onIdle: () => void) {
  const cb = useRef(onIdle);
  cb.current = onIdle;

  useEffect(() => {
    if (!enabled) return;
    let timer = setTimeout(() => cb.current(), ms);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cb.current(), ms);
    };
    const events = ['pointerdown', 'keydown', 'input', 'wheel'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [ms, enabled]);
}

const LONG_PRESS_MS = 3000;
const ARMED_MS = 6000;
const CORNER_TAPS = 3;

/**
 * Acceso discreto al modo promotora: mantener presionado el logo de la
 * pantalla inicial 3 segundos y, dentro de los 6 segundos siguientes, tocar
 * 3 veces la esquina inferior derecha. En computadora también funciona
 * Ctrl + Shift + P.
 *
 * Esto evita aperturas accidentales; NO es un mecanismo de seguridad.
 */
export function usePromoterGesture(onUnlock: () => void, enabled: boolean) {
  const [armed, setArmed] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const armedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const taps = useRef(0);
  const cb = useRef(onUnlock);
  cb.current = onUnlock;

  const disarm = useCallback(() => {
    setArmed(false);
    taps.current = 0;
    clearTimeout(armedTimer.current);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        cb.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  useEffect(
    () => () => {
      clearTimeout(pressTimer.current);
      clearTimeout(armedTimer.current);
    },
    [],
  );

  const logoHandlers = {
    onPointerDown: () => {
      if (!enabled) return;
      clearTimeout(pressTimer.current);
      pressTimer.current = setTimeout(() => {
        setArmed(true);
        taps.current = 0;
        clearTimeout(armedTimer.current);
        armedTimer.current = setTimeout(disarm, ARMED_MS);
      }, LONG_PRESS_MS);
    },
    onPointerUp: () => clearTimeout(pressTimer.current),
    onPointerLeave: () => clearTimeout(pressTimer.current),
  };

  const onCornerTap = () => {
    if (!armed) return;
    taps.current += 1;
    if (taps.current >= CORNER_TAPS) {
      disarm();
      cb.current();
    }
  };

  return { armed, logoHandlers, onCornerTap };
}
