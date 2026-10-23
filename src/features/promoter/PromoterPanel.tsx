import { useState } from 'react';
import type { Settings } from '../../config/game.config';
import { clearMetrics, loadMetrics } from '../../settings/metrics';
import { useSettings } from '../../settings/SettingsContext';
import { usePwa } from '../../pwa/PwaContext';
import { Modal } from '../../ui/Modal';
import styles from './PromoterPanel.module.css';

interface Props {
  onClose: () => void;
  onStartDemo: () => void;
  onResetExperience: () => void;
}

export function PromoterPanel({ onClose, onStartDemo, onResetExperience }: Props) {
  const { settings, update, restoreDefaults } = useSettings();
  const pwa = usePwa();
  const [draft, setDraft] = useState<Settings>(() => structuredClone(settings));
  const [metrics, setMetrics] = useState(loadMetrics);
  const [saved, setSaved] = useState(false);

  const edit = (fn: (d: Settings) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setSaved(false);
  };

  const save = () => {
    update(draft);
    setSaved(true);
  };

  const average = metrics.games ? Math.round(metrics.totalScore / metrics.games) : 0;

  return (
    <Modal
      title="Modo promotora"
      onClose={onClose}
      wide
      closeLabel="Cerrar modo promotora"
      footer={
        <>
          {saved && <span className={styles.saved}>Cambios guardados ✓</span>}
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className={styles.primary} onClick={save}>
            Guardar cambios
          </button>
        </>
      }
    >
      <p className={styles.notice}>
        Este acceso oculto solo evita que un participante lo abra por accidente. <strong>No es un mecanismo de
        seguridad</strong> y no debe usarse para proteger datos personales reales.
      </p>

      <section className={styles.section}>
        <h3>Acciones rápidas</h3>
        <div className={styles.row}>
          <button type="button" className={styles.primary} onClick={onStartDemo}>
            Jugar en modo demo
          </button>
          <button type="button" className={styles.secondary} onClick={onResetExperience}>
            Reiniciar experiencia
          </button>
        </div>
        <p className={styles.help}>
          El modo demo recorre el flujo completo sin formulario y no cuenta en las métricas.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Medallas</h3>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Plata desde (puntos)</span>
            <input
              type="number"
              min={0}
              step={10}
              inputMode="numeric"
              value={draft.medals.silverFrom}
              onChange={(e) => edit((d) => (d.medals.silverFrom = Number(e.target.value)))}
            />
          </label>
          <label className={styles.field}>
            <span>Oro desde (puntos)</span>
            <input
              type="number"
              min={0}
              step={10}
              inputMode="numeric"
              value={draft.medals.goldFrom}
              onChange={(e) => edit((d) => (d.medals.goldFrom = Number(e.target.value)))}
            />
          </label>
        </div>
        <p className={styles.help}>Debajo del umbral de plata se entrega bronce. Todas las personas reciben medalla.</p>
        <div className={styles.grid}>
          {(['oro', 'plata', 'bronce'] as const).map((tier) => (
            <label key={tier} className={styles.field}>
              <span>Mensaje {tier}</span>
              <input
                type="text"
                maxLength={80}
                value={draft.medals.messages[tier]}
                onChange={(e) => edit((d) => (d.medals.messages[tier] = e.target.value))}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3>Pantalla de premio</h3>
        <label className={styles.field}>
          <span>Título</span>
          <input type="text" maxLength={80} value={draft.prize.title} onChange={(e) => edit((d) => (d.prize.title = e.target.value))} />
        </label>
        <label className={styles.field}>
          <span>Texto</span>
          <textarea rows={2} maxLength={300} value={draft.prize.text} onChange={(e) => edit((d) => (d.prize.text = e.target.value))} />
        </label>
        <p className={styles.help}>No prometas premios específicos que no estén confirmados por el responsable de la activación.</p>
      </section>

      <section className={styles.section}>
        <h3>Experiencia</h3>
        <label className={styles.toggle}>
          <input type="checkbox" checked={draft.sound} onChange={(e) => edit((d) => (d.sound = e.target.checked))} />
          <span>Sonido</span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={draft.anonymousMetrics}
            onChange={(e) => edit((d) => (d.anonymousMetrics = e.target.checked))}
          />
          <span>Guardar métricas anónimas en este dispositivo</span>
        </label>
        <label className={styles.field}>
          <span>Volver al inicio tras inactividad (segundos)</span>
          <input
            type="number"
            min={30}
            step={10}
            inputMode="numeric"
            value={Math.round(draft.idleResetMs / 1000)}
            onChange={(e) => edit((d) => (d.idleResetMs = Number(e.target.value) * 1000))}
          />
        </label>
      </section>

      <section className={styles.section}>
        <h3>Métricas anónimas</h3>
        <p className={styles.help}>
          Solo totales del dispositivo, sin nombres ni contactos. No se comparten entre tablets.
        </p>
        <dl className={styles.metrics}>
          <div>
            <dt>Partidas</dt>
            <dd>{metrics.games}</dd>
          </div>
          <div>
            <dt>Promedio</dt>
            <dd>{average}</dd>
          </div>
          <div>
            <dt>Mejor puntaje</dt>
            <dd>{metrics.bestScore}</dd>
          </div>
          <div>
            <dt>Oro / Plata / Bronce</dt>
            <dd>
              {metrics.medals.oro} / {metrics.medals.plata} / {metrics.medals.bronce}
            </dd>
          </div>
          <div>
            <dt>Perros / Gatos</dt>
            <dd>
              {metrics.species.perro} / {metrics.species.gato}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            clearMetrics();
            setMetrics(loadMetrics());
          }}
        >
          Borrar métricas
        </button>
      </section>

      <section className={styles.section}>
        <h3>Aplicación</h3>
        <ul className={styles.status}>
          <li>Versión: {__APP_VERSION__}</li>
          <li>Conexión: {pwa.online ? 'en línea' : 'sin conexión'}</li>
          <li>
            Uso sin conexión:{' '}
            {pwa.offlineReady ? 'lista ✓' : 'todavía no preparada (abrí la app una vez con internet y recargá)'}
          </li>
        </ul>
        <div className={styles.row}>
          {pwa.needRefresh ? (
            <button type="button" className={styles.primary} onClick={pwa.applyUpdate}>
              Instalar versión nueva y recargar
            </button>
          ) : (
            <button type="button" className={styles.secondary} onClick={() => void pwa.checkForUpdate()} disabled={!pwa.online}>
              Buscar actualización
            </button>
          )}
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              restoreDefaults();
              onClose();
            }}
          >
            Restaurar valores por defecto
          </button>
        </div>
      </section>
    </Modal>
  );
}
