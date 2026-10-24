import { useMemo, type CSSProperties } from 'react';
import { useBrand } from '../brand/BrandContext';
import styles from './Confetti.module.css';

/** Celebración liviana con CSS (sin librerías). */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const colors = useBrand().confetti;
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.8,
        size: 8 + Math.random() * 8,
        color: colors[i % colors.length],
        round: i % 3 === 0,
        drift: (Math.random() - 0.5) * 160,
      })),
    [pieces, colors],
  );

  return (
    <div className={styles.confetti} aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              background: p.color,
              borderRadius: p.round ? '50%' : 2,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
