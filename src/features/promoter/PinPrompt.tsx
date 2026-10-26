import { useId, useState, type FormEvent } from 'react';
import { Modal } from '../../ui/Modal';
import { checkPin, PROMOTER_PIN } from './pin';
import styles from './PinPrompt.module.css';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

/** Pide el PIN numérico antes de abrir el panel de promotora. */
export function PinPrompt({ onSuccess, onCancel }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = checkPin(pin);
    if (result.ok) {
      onSuccess();
      return;
    }
    setPin('');
    if (result.locked) {
      setError(`Demasiados intentos. Esperá ${Math.ceil(result.retryInMs / 1000)} segundos y volvé a probar.`);
    } else {
      setError(`PIN incorrecto. Te quedan ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'intento' : 'intentos'}.`);
    }
  };

  return (
    <Modal
      title="Acceso de promotora"
      onClose={onCancel}
      closeLabel="Cancelar acceso"
      footer={
        <>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" form={`${id}-form`} className={styles.enter} disabled={pin.length === 0}>
            Entrar
          </button>
        </>
      }
    >
      <form id={`${id}-form`} className={styles.form} onSubmit={submit} autoComplete="off">
        <label htmlFor={`${id}-pin`} className={styles.label}>
          Ingresá el PIN
        </label>
        <input
          id={`${id}-pin`}
          className={styles.input}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PROMOTER_PIN.length}
          autoComplete="off"
          autoFocus
          value={pin}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            // Solo números.
            setPin(e.target.value.replace(/\D/g, ''));
            setError(null);
          }}
        />
        {error && (
          <p id={`${id}-error`} className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
