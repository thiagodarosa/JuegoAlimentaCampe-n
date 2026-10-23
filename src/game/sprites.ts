import type { ItemVariant } from './items';

/**
 * Ilustraciones de los objetos del juego, dibujadas con Canvas 2D.
 * Cada función dibuja el objeto centrado en (0, 0) y contenido en un radio R.
 * Las croquetas llevan un halo dorado para distinguirse de los distractores
 * de un vistazo.
 */

type Ctx = CanvasRenderingContext2D;

const KIBBLE_BASE = '#A8692F';
const KIBBLE_DARK = '#6B3D18';
const KIBBLE_LIGHT = '#E7AE63';

function kibbleFill(ctx: Ctx, R: number) {
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R);
  g.addColorStop(0, KIBBLE_LIGHT);
  g.addColorStop(0.55, KIBBLE_BASE);
  g.addColorStop(1, KIBBLE_DARK);
  return g;
}

function halo(ctx: Ctx, R: number) {
  const g = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.15);
  g.addColorStop(0, 'rgba(243, 200, 121, 0.75)');
  g.addColorStop(1, 'rgba(243, 200, 121, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.15, 0, Math.PI * 2);
  ctx.fill();
}

function speckles(ctx: Ctx, R: number) {
  ctx.fillStyle = 'rgba(70, 35, 12, 0.45)';
  const dots: [number, number, number][] = [
    [-0.25, 0.1, 0.06],
    [0.2, 0.25, 0.05],
    [0.05, -0.2, 0.045],
    [0.3, -0.05, 0.04],
    [-0.1, 0.32, 0.04],
  ];
  for (const [x, y, r] of dots) {
    ctx.beginPath();
    ctx.arc(x * R, y * R, r * R, 0, Math.PI * 2);
    ctx.fill();
  }
}

function sheen(ctx: Ctx, R: number) {
  ctx.fillStyle = 'rgba(255, 236, 200, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-R * 0.28, -R * 0.32, R * 0.22, R * 0.11, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function outline(ctx: Ctx, R: number, color = KIBBLE_DARK) {
  ctx.lineWidth = Math.max(1.5, R * 0.06);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function roundedTriangle(ctx: Ctx, R: number) {
  const pts = [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    return [Math.cos(a) * R, Math.sin(a) * R] as const;
  });
  ctx.beginPath();
  const radius = R * 0.32;
  for (let i = 0; i < 3; i++) {
    const p = pts[i]!;
    const next = pts[(i + 1) % 3]!;
    const mid = [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2] as const;
    if (i === 0) {
      const prev = pts[2]!;
      ctx.moveTo((prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2);
    }
    ctx.arcTo(p[0], p[1], mid[0], mid[1], radius);
  }
  ctx.closePath();
}

const DRAW: Record<ItemVariant, (ctx: Ctx, R: number) => void> = {
  'kibble-round'(ctx, R) {
    halo(ctx, R);
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = kibbleFill(ctx, R * 0.72);
    ctx.fill();
    outline(ctx, R);
    speckles(ctx, R * 0.72);
    sheen(ctx, R * 0.72);
  },
  'kibble-ring'(ctx, R) {
    halo(ctx, R);
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.74, 0, Math.PI * 2);
    ctx.arc(0, 0, R * 0.26, 0, Math.PI * 2, true);
    ctx.fillStyle = kibbleFill(ctx, R * 0.74);
    ctx.fill('evenodd');
    outline(ctx, R);
    sheen(ctx, R * 0.74);
  },
  'kibble-tri'(ctx, R) {
    halo(ctx, R);
    ctx.save();
    ctx.translate(0, R * 0.08);
    roundedTriangle(ctx, R * 0.8);
    ctx.fillStyle = kibbleFill(ctx, R * 0.8);
    ctx.fill();
    outline(ctx, R);
    speckles(ctx, R * 0.6);
    sheen(ctx, R * 0.7);
    ctx.restore();
  },
  'kibble-fish'(ctx, R) {
    halo(ctx, R);
    ctx.beginPath();
    ctx.ellipse(-R * 0.1, 0, R * 0.55, R * 0.4, 0, 0, Math.PI * 2);
    ctx.moveTo(R * 0.35, 0);
    ctx.lineTo(R * 0.78, -R * 0.36);
    ctx.quadraticCurveTo(R * 0.66, 0, R * 0.78, R * 0.36);
    ctx.closePath();
    ctx.fillStyle = kibbleFill(ctx, R * 0.7);
    ctx.fill();
    outline(ctx, R);
    ctx.fillStyle = KIBBLE_DARK;
    ctx.beginPath();
    ctx.arc(-R * 0.36, -R * 0.06, R * 0.07, 0, Math.PI * 2);
    ctx.fill();
    sheen(ctx, R * 0.6);
  },

  ball(ctx, R) {
    const r = R * 0.8;
    const colors = ['#E8473B', '#FFFFFF', '#2F7DE1', '#FFFFFF', '#F7C531', '#FFFFFF'];
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
      ctx.closePath();
      ctx.fillStyle = colors[i]!;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    outline(ctx, R, '#3B3B4F');
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.25, r * 0.12, -0.7, 0, Math.PI * 2);
    ctx.fill();
  },
  leaf(ctx, R) {
    ctx.save();
    ctx.rotate(-0.6);
    ctx.beginPath();
    ctx.moveTo(-R * 0.85, 0);
    ctx.quadraticCurveTo(-R * 0.1, -R * 0.75, R * 0.8, 0);
    ctx.quadraticCurveTo(-R * 0.1, R * 0.75, -R * 0.85, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -R * 0.5, 0, R * 0.5);
    g.addColorStop(0, '#7BC24D');
    g.addColorStop(1, '#3E8E2F');
    ctx.fillStyle = g;
    ctx.fill();
    outline(ctx, R, '#2C6A22');
    ctx.strokeStyle = '#D5F0B8';
    ctx.lineWidth = Math.max(1.2, R * 0.05);
    ctx.beginPath();
    ctx.moveTo(-R * 0.95, 0);
    ctx.lineTo(R * 0.7, 0);
    for (const x of [-0.4, 0, 0.35]) {
      ctx.moveTo(x * R, 0);
      ctx.lineTo((x + 0.2) * R, -R * 0.25);
      ctx.moveTo(x * R, 0);
      ctx.lineTo((x + 0.2) * R, R * 0.25);
    }
    ctx.stroke();
    ctx.restore();
  },
  bubble(ctx, R) {
    const r = R * 0.82;
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,0.25)');
    g.addColorStop(0.75, 'rgba(170,220,255,0.18)');
    g.addColorStop(1, 'rgba(200,170,255,0.65)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, R * 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.2, r * 0.1, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.35, r * 0.4, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  },
  rope(ctx, R) {
    ctx.save();
    ctx.rotate(-0.5);
    const len = R * 0.55;
    ctx.lineCap = 'round';
    ctx.lineWidth = R * 0.34;
    ctx.strokeStyle = '#2F7DE1';
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = R * 0.08;
    for (let x = -len + R * 0.1; x < len; x += R * 0.22) {
      ctx.beginPath();
      ctx.moveTo(x, -R * 0.15);
      ctx.lineTo(x + R * 0.12, R * 0.15);
      ctx.stroke();
    }
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#E8473B';
      ctx.beginPath();
      ctx.arc(side * len, 0, R * 0.28, 0, Math.PI * 2);
      ctx.fill();
      outline(ctx, R, '#9E2A22');
      ctx.strokeStyle = '#F7C531';
      ctx.lineWidth = R * 0.07;
      for (const dy of [-0.18, 0, 0.18]) {
        ctx.beginPath();
        ctx.moveTo(side * (len + R * 0.22), dy * R);
        ctx.lineTo(side * (len + R * 0.42), dy * R * 1.6);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
  duck(ctx, R) {
    ctx.fillStyle = '#FFD23F';
    ctx.strokeStyle = '#C99A00';
    ctx.lineWidth = Math.max(1.5, R * 0.06);
    ctx.beginPath();
    ctx.ellipse(0, R * 0.25, R * 0.72, R * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-R * 0.25, -R * 0.3, R * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FF8A1F';
    ctx.beginPath();
    ctx.ellipse(-R * 0.7, -R * 0.22, R * 0.22, R * 0.1, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2B1418';
    ctx.beginPath();
    ctx.arc(-R * 0.35, -R * 0.38, R * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E0B000';
    ctx.beginPath();
    ctx.arc(R * 0.15, R * 0.2, R * 0.28, 0.2, Math.PI - 0.6);
    ctx.stroke();
  },
  yarn(ctx, R) {
    const r = R * 0.75;
    ctx.fillStyle = '#C9508F';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, R, '#8E2C62');
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = '#F19AC6';
    ctx.lineWidth = Math.max(1.2, R * 0.06);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.22, 0, r * 0.9, r * 0.3, 1.0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#C9508F';
    ctx.lineWidth = Math.max(1.5, R * 0.07);
    ctx.beginPath();
    ctx.moveTo(r * 0.6, r * 0.5);
    ctx.quadraticCurveTo(R * 0.95, R * 0.4, R * 0.85, R * 0.9);
    ctx.stroke();
  },
  mouse(ctx, R) {
    ctx.strokeStyle = '#E79AA4';
    ctx.lineWidth = Math.max(1.5, R * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(R * 0.55, R * 0.1);
    ctx.bezierCurveTo(R * 0.95, R * 0.1, R * 0.7, R * 0.7, R * 0.98, R * 0.62);
    ctx.stroke();
    ctx.fillStyle = '#9EA3AE';
    ctx.beginPath();
    ctx.moveTo(-R * 0.8, R * 0.05);
    ctx.quadraticCurveTo(-R * 0.2, -R * 0.65, R * 0.6, R * 0.15);
    ctx.quadraticCurveTo(-R * 0.1, R * 0.5, -R * 0.8, R * 0.05);
    ctx.fill();
    outline(ctx, R, '#5F6573');
    ctx.fillStyle = '#C3C7CF';
    ctx.beginPath();
    ctx.arc(-R * 0.2, -R * 0.28, R * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E79AA4';
    ctx.beginPath();
    ctx.arc(-R * 0.2, -R * 0.28, R * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-R * 0.8, R * 0.05, R * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2B1418';
    ctx.beginPath();
    ctx.arc(-R * 0.48, -R * 0.06, R * 0.06, 0, Math.PI * 2);
    ctx.fill();
  },
};

export function drawItem(ctx: Ctx, variant: ItemVariant, R: number) {
  DRAW[variant](ctx, R);
}

/**
 * Caché de sprites pre-renderizados: cada variante se dibuja una vez por
 * tamaño y densidad de píxeles, y en cada cuadro solo se copia la imagen.
 */
export class SpriteCache {
  private cache = new Map<string, HTMLCanvasElement>();

  get(variant: ItemVariant, radiusPx: number, dpr: number): HTMLCanvasElement {
    const R = Math.round(radiusPx);
    const key = `${variant}|${R}|${dpr}`;
    let canvas = this.cache.get(key);
    if (!canvas) {
      canvas = document.createElement('canvas');
      const size = Math.ceil(R * 2.4 * dpr);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.translate((R * 2.4) / 2, (R * 2.4) / 2);
        drawItem(ctx, variant, R);
      }
      if (this.cache.size > 200) this.cache.clear();
      this.cache.set(key, canvas);
    }
    return canvas;
  }

  clear() {
    this.cache.clear();
  }
}

