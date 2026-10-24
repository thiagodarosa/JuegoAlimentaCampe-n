import { HIT_ANIM_MS, type GameEngine, type GameEvent } from './engine';
import { SpriteCache } from './sprites';

/**
 * Dibuja el estado del motor en un Canvas, más efectos visuales
 * (partículas y textos flotantes). No modifica el estado del juego.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'dot' | 'star';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 140;
const MAX_TEXTS = 8;
const KIBBLE_COLORS = ['#F3C879', '#C98C4A', '#FFE3A8', '#8A5528'];
const DISTRACTOR_COLORS = ['#FFFFFF', '#FFC6CD', '#FF8B7B'];

export class GameRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites = new SpriteCache();
  private particles: Particle[] = [];
  private texts: FloatingText[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private readonly reducedMotion: boolean;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    /** Tipografía de los textos flotantes (la de la marca activa). */
    private readonly font = 'Figtree, system-ui, sans-serif',
    /** Campo claro: sombra suave bajo los objetos para que se recorten del fondo. */
    private readonly lightField = false,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    this.ctx = ctx;
    this.reducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }

  /** Ajusta el canvas al tamaño CSS del contenedor y a la densidad de píxeles. */
  resize(width: number, height: number, devicePixelRatio: number) {
    // Tope de 2x: más resolución no se nota en un juego rápido y cuesta rendimiento.
    const dpr = Math.min(2, Math.max(1, devicePixelRatio || 1));
    if (width === this.width && height === this.height && dpr === this.dpr) return;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  /** Genera efectos para los eventos del motor. */
  handleEvent(e: GameEvent, label?: string) {
    if (e.type !== 'hit') return;
    const good = e.kind === 'kibble';
    const count = this.reducedMotion ? 4 : good ? 12 : 8;
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 220;
      const palette = good ? KIBBLE_COLORS : DISTRACTOR_COLORS;
      this.particles.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 60,
        life: 0,
        maxLife: 420 + Math.random() * 280,
        size: 3 + Math.random() * 5,
        color: palette[i % palette.length]!,
        shape: good && i % 4 === 0 ? 'star' : 'dot',
      });
    }
    const delta = e.delta > 0 ? `+${e.delta}` : e.delta < 0 ? `−${Math.abs(e.delta)}` : '';
    this.pushText(e.x, e.y - 10, delta, good ? '#FFE3A8' : '#FFB3B3', 34);
    if (label) this.pushText(e.x, e.y + 26, label, '#FFFFFF', 22);
  }

  private pushText(x: number, y: number, text: string, color: string, size: number) {
    if (!text) return;
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x, y, text, color, life: 0, maxLife: 900, size });
  }

  /** Avanza los efectos. Se llama solo mientras la partida corre. */
  updateEffects(dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    for (const p of this.particles) {
      p.life += dtMs;
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
    for (const t of this.texts) {
      t.life += dtMs;
      t.y -= 42 * dt;
    }
    this.texts = this.texts.filter((t) => t.life < t.maxLife);
  }

  clearEffects() {
    this.particles = [];
    this.texts = [];
  }

  draw(engine: GameEngine) {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const t = engine.gameTime;
    for (const o of engine.objects) {
      if (o.removed) continue;
      const R = engine.radiusPx(o);
      let scale = engine.scaleOf(o);
      let alpha = 1;
      if (o.hitAt !== null) {
        const k = Math.min(1, (t - o.hitAt) / HIT_ANIM_MS);
        scale = 1 + k * 0.45;
        alpha = 1 - k;
      }
      if (scale <= 0 || alpha <= 0) continue;
      const wobble = o.traj === 'pop' && o.hitAt === null ? Math.sin((t - o.bornAt) / 140) * 0.08 : 0;
      const img = this.sprites.get(o.variant, R, this.dpr);
      const size = img.width / this.dpr;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(o.x * this.width, o.y * this.height);
      ctx.rotate(o.rot + wobble);
      ctx.scale(scale, scale);
      if (this.lightField) {
        ctx.shadowColor = 'rgba(90, 20, 55, 0.35)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
      }
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    for (const p of this.particles) {
      const k = 1 - p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      if (p.shape === 'star') {
        drawStar(ctx, p.x, p.y, p.size * 1.6);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const tx of this.texts) {
      const k = tx.life / tx.maxLife;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.font = `900 ${tx.size}px ${this.font}`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(60, 0, 25, 0.75)';
      ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
  }

  dispose() {
    this.sprites.clear();
    this.clearEffects();
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : r * 0.4;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
