import type { Breed } from '../../config/breeds';
import { GAME_CONFIG } from '../../config/game.config';
import { Character } from '../../characters/Character';
import { DISTRACTOR_NAMES, DISTRACTORS, KIBBLES } from '../../game/items';
import { ItemIcon } from '../../ui/ItemIcon';
import { TopBar } from '../../ui/TopBar';
import screen from '../../ui/Screen.module.css';
import styles from './InstructionsScreen.module.css';

interface Props {
  breed: Breed;
  onPlay: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function InstructionsScreen({ breed, onPlay, onBack, onCancel }: Props) {
  const seconds = Math.round(GAME_CONFIG.durationMs / 1000);
  const { kibble, distractor } = GAME_CONFIG.points;

  return (
    <main className={`${screen.screen} bg-brand bg-pattern`}>
      <TopBar onBack={onBack} onCancel={onCancel} />

      <div className={styles.layout}>
        <Character look={breed.look} expression="happy" className={styles.character} label={`Tu campeón: ${breed.name}`} />

        <div className={styles.copy}>
          <h1 className={`${screen.heading} ${styles.heading}`}>¡Tu campeón te necesita!</h1>
          <p className={styles.text}>
            Tenés {seconds} segundos para juntar croquetas y conseguir la mayor puntuación posible. ¡Pero cuidado con los
            distractores!
          </p>

          <div className={styles.legend}>
            <section className={`${styles.group} ${styles.good}`} aria-label="Elementos que suman puntos">
              <h2 className={styles.groupTitle}>
                Tocá las croquetas <span className={styles.badge}>+{kibble}</span>
              </h2>
              <div className={styles.items}>
                {KIBBLES[breed.species].map((v) => (
                  <ItemIcon key={v} variant={v} size={58} label="Croqueta" />
                ))}
              </div>
            </section>

            <section className={`${styles.group} ${styles.bad}`} aria-label="Elementos que restan puntos">
              <h2 className={styles.groupTitle}>
                Evitá los distractores <span className={`${styles.badge} ${styles.badgeBad}`}>−{Math.abs(distractor)}</span>
              </h2>
              <div className={styles.items}>
                {DISTRACTORS[breed.species].map((v) => (
                  <ItemIcon key={v} variant={v} size={52} label={DISTRACTOR_NAMES[v]} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className={screen.actions}>
        <button type="button" className="btn btn-primary" onClick={onPlay}>
          ¡A jugar!
        </button>
      </div>
    </main>
  );
}
