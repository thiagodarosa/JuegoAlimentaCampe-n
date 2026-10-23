import { useEffect, useState } from 'react';
import type { GameResult } from '../../app/flow';
import type { Breed } from '../../config/breeds';
import { Character } from '../../characters/Character';
import { useSettings } from '../../settings/SettingsContext';
import { Confetti } from '../../ui/Confetti';
import { Logo } from '../../ui/Logo';
import { Medal } from '../../ui/Medal';
import screen from '../../ui/Screen.module.css';
import styles from './ResultScreen.module.css';

interface Props {
  breed: Breed;
  result: GameResult;
  firstName: string | null;
  onContinue: () => void;
}

/** Cuenta ascendente del puntaje final. */
function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function ResultScreen({ breed, result, firstName, onContinue }: Props) {
  const { settings } = useSettings();
  const shown = useCountUp(result.score);
  const message = settings.medals.messages[result.medal];

  return (
    <main className={`${screen.screen} bg-brand`} data-testid="result-screen">
      <Confetti />
      <Logo className={styles.logo} />

      <div className={styles.layout}>
        <Character look={breed.look} expression="celebrate" className={styles.character} label={`Tu campeón: ${breed.name}`} />

        <div className={styles.center}>
          <h1 className={`${screen.heading} ${styles.message}`}>{message}</h1>
          {firstName && <p className={styles.name}>¡Bien jugado, {firstName}!</p>}
          <div className={styles.scoreBox}>
            <span className={styles.scoreLabel}>Puntaje final</span>
            <span className={styles.score} data-testid="final-score" aria-label={`${result.score} puntos`}>
              {shown}
            </span>
          </div>
          <p className={styles.stats}>
            {result.kibbles} {result.kibbles === 1 ? 'croqueta' : 'croquetas'} para {breed.shortName}
          </p>
        </div>

        <Medal tier={result.medal} className={styles.medal} />
      </div>

      <div className={screen.actions}>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Ver mi premio
        </button>
      </div>
    </main>
  );
}
