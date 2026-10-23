import { findBreed, SPECIES_COVER, type Species } from '../../config/breeds';
import { Character } from '../../characters/Character';
import { TopBar } from '../../ui/TopBar';
import screen from '../../ui/Screen.module.css';
import styles from './PetSelect.module.css';

interface Props {
  firstName: string | null;
  selected: Species | null;
  onChoose: (species: Species) => void;
  onCancel: () => void;
}

const OPTIONS: { species: Species; label: string }[] = [
  { species: 'perro', label: 'Mi campeón es un perro' },
  { species: 'gato', label: 'Mi campeón es un gato' },
];

export function SpeciesScreen({ firstName, selected, onChoose, onCancel }: Props) {
  return (
    <main className={`${screen.screen} bg-brand bg-pattern`}>
      <TopBar onCancel={onCancel} />
      <h1 className={screen.heading}>{firstName ? `¡Hola, ${firstName}!` : '¡Hola!'}</h1>
      <p className={screen.sub}>¿Quién es tu campeón?</p>

      <div className={styles.speciesGrid}>
        {OPTIONS.map(({ species, label }) => (
          <button
            key={species}
            type="button"
            className={[styles.speciesCard, selected === species ? styles.selected : ''].join(' ')}
            onClick={() => onChoose(species)}
            data-species={species}
          >
            <Character look={findBreed(SPECIES_COVER[species])!.look} expression="happy" className={styles.speciesArt} />
            <span className={styles.speciesLabel}>{label}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
