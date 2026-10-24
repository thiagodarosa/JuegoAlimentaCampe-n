import { useBrand } from '../../brand/BrandContext';
import { PRIVACY_POLICY_VERSION } from '../../config/game.config';
import { Modal } from '../../ui/Modal';
import styles from './PrivacyPolicy.module.css';

/**
 * Política de privacidad PROVISORIA. No fue revisada por un asesor jurídico.
 * El responsable del tratamiento debe reemplazar este texto antes de publicar
 * la aplicación (ver docs/PRIVACIDAD_PENDIENTE.md).
 */
export function PrivacyPolicy({ onClose }: { onClose: () => void }) {
  const brand = useBrand();
  return (
    <Modal
      title="Política de privacidad"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Entendido
        </button>
      }
    >
      <div className={styles.content}>
      <p className={styles.pending} role="note">
        <strong>TEXTO PROVISORIO · PENDIENTE DE APROBACIÓN.</strong> Este contenido no fue revisado por un asesor
        jurídico ni aprobado por el responsable del tratamiento. Versión: {PRIVACY_POLICY_VERSION}.
      </p>

      <h3>¿Quién es responsable de tus datos?</h3>
      <p className={styles.placeholder}>[Completar: razón social, RUT, domicilio y contacto del responsable del tratamiento.]</p>

      <h3>¿Qué datos pedimos?</h3>
      <p>Nombre completo, celular y correo electrónico.</p>

      <h3>¿Para qué los usamos?</h3>
      <p>
        Para gestionar tu participación en el juego “¡Alimentá al campeón!” durante esta activación. Si marcás la
        casilla opcional, también para enviarte comunicaciones promocionales de {brand.name}.
      </p>

      <h3>¿Dónde se guardan?</h3>
      <p>
        En esta versión de demostración tus datos <strong>no se envían a ningún servidor ni se guardan</strong> en el
        dispositivo: se mantienen en memoria mientras jugás y se borran al terminar, cancelar o reiniciar.
      </p>
      <p className={styles.placeholder}>
        [Completar antes de producción: lugar de almacenamiento, plazo de conservación, encargados del tratamiento y
        eventuales transferencias.]
      </p>

      <h3>Tus derechos</h3>
      <p className={styles.placeholder}>
        [Completar: cómo ejercer los derechos de acceso, rectificación, actualización, inclusión y supresión, y el canal
        de contacto para hacerlo.]
      </p>
      </div>
    </Modal>
  );
}
