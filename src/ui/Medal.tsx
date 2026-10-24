import { useBrand } from '../brand/BrandContext';
import type { MedalTier } from '../config/game.config';
import styles from './Medal.module.css';

const COLORS: Record<MedalTier, { light: string; base: string; dark: string; label: string }> = {
  oro: { light: '#FFF1B8', base: '#F3C879', dark: '#B8862E', label: 'Medalla de oro' },
  plata: { light: '#FFFFFF', base: '#D4D9E2', dark: '#8C95A6', label: 'Medalla de plata' },
  bronce: { light: '#FFD7B0', base: '#D68B4E', dark: '#8E5328', label: 'Medalla de bronce' },
};

export function Medal({ tier, className }: { tier: MedalTier; className?: string }) {
  const c = COLORS[tier];
  const [ribbonLight, ribbonDark, ribbonStripe] = useBrand().medalRibbon;
  const id = `medal-${tier}`;
  return (
    <figure className={[styles.medal, className].filter(Boolean).join(' ')} data-medal={tier}>
      <svg viewBox="0 0 160 200" role="img" aria-label={c.label}>
        <defs>
          <radialGradient id={id} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={c.light} />
            <stop offset="55%" stopColor={c.base} />
            <stop offset="100%" stopColor={c.dark} />
          </radialGradient>
        </defs>
        {/* Cinta */}
        <path d="M44 0 H74 L92 70 L66 78 Z" fill={ribbonLight} />
        <path d="M116 0 H86 L68 70 L94 78 Z" fill={ribbonDark} />
        <path d="M58 0 H66 L82 66 L76 68 Z" fill={ribbonStripe} opacity="0.8" />
        {/* Medalla */}
        <circle cx="80" cy="128" r="62" fill={c.dark} />
        <circle cx="80" cy="124" r="60" fill={`url(#${id})`} />
        <circle cx="80" cy="124" r="45" fill="none" stroke={c.dark} strokeWidth="3" strokeDasharray="4 6" opacity="0.6" />
        {/* Huella */}
        <g fill={c.dark} opacity="0.85">
          <ellipse cx="80" cy="134" rx="17" ry="14" />
          <ellipse cx="60" cy="112" rx="7.5" ry="9.5" />
          <ellipse cx="74" cy="102" rx="7.5" ry="10" />
          <ellipse cx="88" cy="102" rx="7.5" ry="10" />
          <ellipse cx="101" cy="112" rx="7.5" ry="9.5" />
        </g>
        <ellipse cx="58" cy="96" rx="16" ry="8" fill="#fff" opacity="0.35" transform="rotate(-35 58 96)" />
      </svg>
      <figcaption className={styles.caption}>{c.label}</figcaption>
    </figure>
  );
}
