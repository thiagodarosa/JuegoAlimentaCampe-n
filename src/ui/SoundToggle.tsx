import { useSettings } from '../settings/SettingsContext';
import styles from './SoundToggle.module.css';

/**
 * Botón para activar o silenciar los efectos de sonido. Es la misma opción
 * "Sonido" del panel de promotora: se guarda en el dispositivo y se respeta
 * en todas las pantallas.
 */
export function SoundToggle({ placement = 'inline' }: { placement?: 'inline' | 'top' | 'bottom' }) {
  const { settings, update } = useSettings();
  const on = settings.sound;
  return (
    <button
      type="button"
      className={[styles.toggle, placement === 'top' ? styles.cornerTop : placement === 'bottom' ? styles.cornerBottom : '']
        .filter(Boolean)
        .join(' ')}
      aria-pressed={on}
      aria-label={on ? 'Silenciar sonidos' : 'Activar sonidos'}
      title={on ? 'Silenciar sonidos' : 'Activar sonidos'}
      data-testid="sound-toggle"
      onClick={() => update({ ...settings, sound: !on })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {on ? (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
