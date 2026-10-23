import { useCallback, useEffect, useReducer, useState } from 'react';
import { findBreed } from '../config/breeds';
import { setSoundEnabled, unlockAudio } from '../audio/sfx';
import type { GameStats } from '../game/engine';
import { BreedScreen } from '../features/pet-select/BreedScreen';
import { InstructionsScreen } from '../features/instructions/InstructionsScreen';
import { PlayScreen } from '../features/play/PlayScreen';
import { PrizeScreen, preloadPrizeImages } from '../features/prize/PrizeScreen';
import { PromoterPanel } from '../features/promoter/PromoterPanel';
import { RegistrationScreen } from '../features/registration/RegistrationScreen';
import { ResultScreen } from '../features/result/ResultScreen';
import { SpeciesScreen } from '../features/pet-select/SpeciesScreen';
import { sessionOnlyRepository } from '../participant/types';
import { recordGame } from '../settings/metrics';
import { medalFor } from '../settings/settings';
import { useSettings } from '../settings/SettingsContext';
import { usePwa } from '../pwa/PwaContext';
import { Modal } from '../ui/Modal';
import { flowReducer, initialFlow } from './flow';
import { useIdleTimer, usePromoterGesture } from './hooks';
import styles from './App.module.css';

export function App() {
  const [flow, dispatch] = useReducer(flowReducer, undefined, () => initialFlow());
  const { settings } = useSettings();
  const pwa = usePwa();
  const [promoterOpen, setPromoterOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);

  const reset = useCallback(() => {
    setConfirmCancel(false);
    dispatch({ type: 'reset' });
  }, []);

  // Inactividad: se vuelve al inicio y se borran los datos (nunca durante la partida).
  useIdleTimer(settings.idleResetMs, flow.step !== 'juego' && !promoterOpen, reset);

  const gesture = usePromoterGesture(() => setPromoterOpen(true), flow.step === 'registro' && !promoterOpen);

  const breed = findBreed(flow.breedId);
  const firstName = flow.participant?.fullName.split(' ')[0] ?? null;
  const askCancel = () => setConfirmCancel(true);

  const finishGame = (stats: GameStats) => {
    if (!breed) return;
    const medal = medalFor(stats.score, settings.medals);
    dispatch({ type: 'finishGame', result: { ...stats, medal } });
    if (flow.demo) return;
    if (settings.anonymousMetrics) recordGame(stats.score, medal, breed.species);
    if (flow.participant) {
      // Sin backend: no se conserva nada (ver participant/types.ts).
      void sessionOnlyRepository.save({
        participant: flow.participant,
        breedId: breed.id,
        score: stats.score,
        medal,
        playedAt: new Date().toISOString(),
      });
    }
  };

  let content;
  switch (flow.step) {
    case 'registro':
      content = (
        <RegistrationScreen
          onSubmit={(participant) => {
            unlockAudio();
            dispatch({ type: 'register', participant });
          }}
          logoHandlers={gesture.logoHandlers}
          footer={
            <span className={styles.version} aria-hidden="true">
              v{__APP_VERSION__}
              {pwa.needRefresh ? ' •' : ''}
            </span>
          }
        />
      );
      break;
    case 'especie':
      content = (
        <SpeciesScreen
          firstName={firstName}
          selected={flow.species}
          onChoose={(species) => dispatch({ type: 'chooseSpecies', species })}
          onCancel={askCancel}
        />
      );
      break;
    case 'raza':
      content = flow.species && (
        <BreedScreen
          species={flow.species}
          initialBreedId={flow.breedId}
          onConfirm={(breedId) => dispatch({ type: 'chooseBreed', breedId })}
          onBack={() => dispatch({ type: 'back' })}
          onCancel={askCancel}
        />
      );
      break;
    case 'instrucciones':
      content = breed && (
        <InstructionsScreen
          breed={breed}
          onPlay={() => {
            unlockAudio();
            preloadPrizeImages(breed.species);
            dispatch({ type: 'startGame' });
          }}
          onBack={() => dispatch({ type: 'back' })}
          onCancel={askCancel}
        />
      );
      break;
    case 'juego':
      content = breed && <PlayScreen key={flow.runId} breed={breed} onFinish={finishGame} onAbandon={reset} />;
      break;
    case 'resultado':
      content = breed && flow.result && (
        <ResultScreen breed={breed} result={flow.result} firstName={firstName} onContinue={() => dispatch({ type: 'showPrize' })} />
      );
      break;
    case 'premio':
      content = breed && <PrizeScreen species={breed.species} onFinish={reset} />;
      break;
  }

  return (
    <div className="app" key={flow.sessionId} data-step={flow.step}>
      {content}

      {flow.demo && (
        <div className={styles.demoBadge} role="status">
          Modo demo · no se registra
        </div>
      )}

      {gesture.armed && (
        <button type="button" className={styles.corner} onClick={gesture.onCornerTap} aria-label="Acceso de promotora" />
      )}

      {confirmCancel && (
        <Modal
          title="¿Cancelar la participación?"
          onClose={() => setConfirmCancel(false)}
          footer={
            <>
              <button type="button" className={styles.keep} onClick={() => setConfirmCancel(false)}>
                Seguir participando
              </button>
              <button type="button" className={styles.cancel} onClick={reset}>
                Sí, cancelar
              </button>
            </>
          }
        >
          <p>Se borran los datos ingresados y la experiencia vuelve al inicio.</p>
        </Modal>
      )}

      {promoterOpen && (
        <PromoterPanel
          onClose={() => setPromoterOpen(false)}
          onStartDemo={() => {
            setPromoterOpen(false);
            unlockAudio();
            dispatch({ type: 'startDemo' });
          }}
          onResetExperience={() => {
            setPromoterOpen(false);
            reset();
          }}
        />
      )}
    </div>
  );
}
