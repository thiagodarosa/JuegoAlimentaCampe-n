import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/* jsdom no implementa Canvas 2D ni ResizeObserver: se usan dobles mínimos. */

function fakeContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop() {} };
  const store: Record<string | symbol, unknown> = {};
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: function getContext() {
    return fakeContext();
  },
});

class FakeResizeObserver {
  constructor(private readonly cb: ResizeObserverCallback) {}
  observe() {
    queueMicrotask(() => this.cb([], this as unknown as ResizeObserver));
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= FakeResizeObserver as unknown as typeof ResizeObserver;

// Tamaño ficticio para que el área de juego se considere lista.
const rect = { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 600, width: 800, height: 600, toJSON() {} };
HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return rect as DOMRect;
};

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
