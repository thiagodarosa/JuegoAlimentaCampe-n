import type { Species } from '../../config/breeds';
import { useSettings } from '../../settings/SettingsContext';
import { Logo } from '../../ui/Logo';
import screen from '../../ui/Screen.module.css';
import catGourmet from '../../assets/brand/pack-gato-gourmet-castrado.webp';
import catMenu from '../../assets/brand/pack-gato-menu-gatito.webp';
import dogGourmet from '../../assets/brand/pack-perro-gourmet-adulto.webp';
import dogMenu from '../../assets/brand/pack-perro-menu-senior.webp';
import styles from './PrizeScreen.module.css';

const PACKS: Record<Species, { src: string; alt: string }[]> = {
  perro: [
    { src: dogMenu, alt: 'Envase GranPlus Menu para perros' },
    { src: dogGourmet, alt: 'Envase GranPlus Gourmet para perros' },
  ],
  gato: [
    { src: catMenu, alt: 'Envase GranPlus Menu para gatos' },
    { src: catGourmet, alt: 'Envase GranPlus Gourmet para gatos' },
  ],
};

/** Decodifica los envases con anticipación para que la pantalla de premio aparezca completa. */
export function preloadPrizeImages(species: Species) {
  for (const p of PACKS[species]) {
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
  return (
    <main className={`${screen.screen} bg-brand bg-pattern`} data-testid="prize-screen">
      <div className={styles.layout}>
        <div className={styles.copy}>
          <Logo className={styles.logo} />
          <h1 className={styles.title}>{settings.prize.title}</h1>
          <p className={styles.text}>{settings.prize.text}</p>
          <button type="button" className="btn btn-primary" onClick={onFinish}>
            Finalizar
          </button>
        </div>
        <div className={styles.packs}>
          {PACKS[species].map((p, i) => (
            <img key={p.src} src={p.src} alt={p.alt} className={`${styles.pack} ${i === 1 ? styles.back : ''}`} draggable={false} />
          ))}
        </div>
      </div>
    </main>
  );
}
