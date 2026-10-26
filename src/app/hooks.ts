import { useCallback, useEffect, useRef } from 'react';

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

const CORNER_TAPS = 6;
/** Tiempo máximo entre un toque y el siguiente para que cuenten como seguidos. */
const TAP_GAP_MS = 1500;

/**
 * Acceso discreto al modo promotora: tocar 6 veces seguidas la esquina
 * superior derecha de la pantalla de registro. Después se pide el PIN
 * (ver features/promoter/pin.ts). En computadora, Ctrl + Shift + P también
 * abre el pedido de PIN.
 */
export function usePromoterGesture(onUnlock: () => void, enabled: boolean) {
  const taps = useRef(0);
  const lastTap = useRef(-Infinity);
  const cb = useRef(onUnlock);
  cb.current = onUnlock;

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

  const onCornerTap = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    taps.current = now - lastTap.current <= TAP_GAP_MS ? taps.current + 1 : 1;
    lastTap.current = now;
    if (taps.current >= CORNER_TAPS) {
      taps.current = 0;
      cb.current();
    }
  }, [enabled]);

  return { onCornerTap };
}
