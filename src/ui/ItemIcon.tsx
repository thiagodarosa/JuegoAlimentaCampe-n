import { useEffect, useRef } from 'react';
import type { ItemVariant } from '../game/items';
import { drawItem } from '../game/sprites';

/** Muestra un objeto del juego con el mismo dibujo que se usa en la partida. */
export function ItemIcon({ variant, size = 64, label }: { variant: ItemVariant; size?: number; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, size / 2 * dpr, size / 2 * dpr);
    ctx.clearRect(-size, -size, size * 2, size * 2);
    drawItem(ctx, variant, size / 2.4);
  }, [variant, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
