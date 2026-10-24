import type { CSSProperties } from 'react';
import { useBrand } from '../../brand/BrandContext';
import { BRANDS, type BrandId } from '../../config/brands';
import type { Species } from '../../config/breeds';
import { useSettings } from '../../settings/SettingsContext';
import { Logo } from '../../ui/Logo';
import screen from '../../ui/Screen.module.css';
import styles from './PrizeScreen.module.css';

/** Decodifica los envases con anticipación para que la pantalla de premio aparezca completa. */
export function preloadPrizeImages(brand: BrandId, species: Species) {
  for (const p of BRANDS[brand].packs[species]) {
    const img = new Image();
    img.src = p.src;
    void img.decode?.().catch(() => {});
  }
}

interface Props {
  species: Species;
  onFinish: () => void;
}

export function PrizeScreen({ species, onFinish }: Props) {
  const { settings } = useSettings();
  const brand = useBrand();
  const prize = settings.prizes[brand.id];
  return (
    <main className={`${screen.screen} bg-brand bg-pattern`} data-testid="prize-screen">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <Logo className={styles.logo} />
          <h1 className={styles.title}>{prize.title}</h1>
          <p className={styles.text}>{prize.text}</p>
          <button type="button" className="btn btn-primary" onClick={onFinish}>
            Finalizar
          </button>
        </div>
        <div className={styles.packs}>
          {brand.packs[species].map((p, i) => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              className={`${styles.pack} ${i === 1 ? styles.back : ''}`}
              style={{ aspectRatio: brand.packAspect, '--pack-k': brand.packAspect / 0.52 } as CSSProperties}
              draggable={false}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
