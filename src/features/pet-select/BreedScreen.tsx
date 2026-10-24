import { useState } from 'react';
import { playVoice } from '../../audio/sfx';
import { breedsFor, findBreed, type Species } from '../../config/breeds';
import { Character } from '../../characters/Character';
import { TopBar } from '../../ui/TopBar';
import screen from '../../ui/Screen.module.css';
import styles from './PetSelect.module.css';

interface Props {
  species: Species;
  initialBreedId: string | null;
  onConfirm: (breedId: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

export function BreedScreen({ species, initialBreedId, onConfirm, onBack, onCancel }: Props) {
  const breeds = breedsFor(species);
  const [selectedId, setSelectedId] = useState<string | null>(
    breeds.some((b) => b.id === initialBreedId) ? initialBreedId : null,
  );
  const selected = findBreed(selectedId);

  return (
    <main className={`${screen.screen} bg-brand bg-pattern`}>
      <TopBar onBack={onBack} onCancel={onCancel} />
      <h1 className={screen.heading}>Elegí a tu campeón</h1>

      <div className={styles.breedGrid} role="radiogroup" aria-label={species === 'perro' ? 'Razas de perro' : 'Razas de gato'}>
        {breeds.map((b) => {
          const isSelected = b.id === selectedId;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-breed={b.id}
              className={[styles.breedCard, isSelected ? styles.selected : ''].join(' ')}
              onClick={() => {
                // Suena solo al elegir una raza distinta (no al volver a tocar la misma).
                if (b.id !== selectedId) playVoice(species === 'perro' ? 'bark' : 'meow');
                setSelectedId(b.id);
              }}
            >
              <Character look={b.look} expression={isSelected ? 'happy' : 'neutral'} className={styles.breedArt} />
              <span className={styles.breedName}>{b.name}</span>
              {isSelected && (
                <span className={styles.check} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={screen.actions}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected}
          onClick={() => selected && onConfirm(selected.id)}
        >
          {selected ? `¡Vamos, ${selected.shortName}!` : 'Elegí una raza'}
        </button>
      </div>
    </main>
  );
}
