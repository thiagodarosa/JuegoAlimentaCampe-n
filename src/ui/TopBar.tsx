import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { SoundToggle } from './SoundToggle';
import styles from './TopBar.module.css';

interface TopBarProps {
  onBack?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

/** Barra superior común: volver, sonido, logotipo y cancelar. */
export function TopBar({ onBack, onCancel, children }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.side}>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            <span aria-hidden="true">←</span> <span className={styles.backLabel}>Volver</span>
          </button>
        )}
        <SoundToggle />
      </div>
      <Logo className={styles.logo} />
      <div className={`${styles.side} ${styles.end}`}>
        {children}
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </header>
  );
}
