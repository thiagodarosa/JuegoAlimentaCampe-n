import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { findBreed } from '../../config/breeds';
import { PRIVACY_POLICY_VERSION } from '../../config/game.config';
import { Character } from '../../characters/Character';
import type { Participant } from '../../participant/types';
import { Logo } from '../../ui/Logo';
import { PrivacyPolicy } from './PrivacyPolicy';
import {
  validateField,
  validateRegistration,
  type RegistrationErrors,
  type RegistrationField,
  type RegistrationValues,
} from './validation';
import styles from './RegistrationScreen.module.css';

interface Props {
  onSubmit: (participant: Participant) => void;
  /** Gestos del logo para el acceso oculto al modo promotora. */
  logoHandlers?: Pick<Parameters<typeof Logo>[0], 'onPointerDown' | 'onPointerUp' | 'onPointerLeave'>;
  footer?: ReactNode;
}

const EMPTY: RegistrationValues = {
  fullName: '',
  phone: '',
  email: '',
  privacyAccepted: false,
  promotionsOptIn: false,
};

const FIELD_ORDER: RegistrationField[] = ['fullName', 'phone', 'email', 'privacyAccepted'];

const heroDog = findBreed('golden')!.look;
const heroCat = findBreed('gato-mestizo')!.look;

export function RegistrationScreen({ onSubmit, logoHandlers, footer }: Props) {
  const [values, setValues] = useState<RegistrationValues>(EMPTY);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<RegistrationField, boolean>>>({});
  const [showPolicy, setShowPolicy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  const set = <K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    // Si el campo ya mostró un error, se revalida mientras se corrige.
    if (key !== 'promotionsOptIn' && (touched[key as RegistrationField] || errors[key as RegistrationField])) {
      setErrors((prev) => ({ ...prev, [key]: validateField(key as RegistrationField, next) }));
    }
  };

  const blur = (field: RegistrationField) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // La validación siempre se ejecuta al enviar, sin depender del navegador.
    const found = validateRegistration(values);
    setErrors(found);
    setTouched({ fullName: true, phone: true, email: true, privacyAccepted: true });
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    onSubmit({
      fullName: values.fullName.trim().replace(/\s+/g, ' '),
      phone: values.phone,
      email: values.email.trim(),
      consent: {
        privacyAccepted: true,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        promotionsOptIn: values.promotionsOptIn,
        acceptedAt: new Date().toISOString(),
      },
    });
  };

  const fieldProps = (field: Exclude<RegistrationField, 'privacyAccepted'>) => ({
    id: `${id}-${field}`,
    'data-field': field,
    value: values[field],
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(field, e.target.value),
    onBlur: () => blur(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${id}-${field}-error` : undefined,
    // Tablet compartida: no se guardan ni sugieren datos de participantes anteriores.
    autoComplete: 'off',
    autoCorrect: 'off',
    spellCheck: false,
    className: styles.input,
  });

  return (
    <main className={`${styles.screen} bg-brand bg-pattern`}>
      <section className={styles.hero}>
        <Logo className={styles.logo} {...logoHandlers} />
        <h1 className={styles.title}>¡Alimentá al campeón!</h1>
        <p className={styles.lead}>Sumá croquetas en 30 segundos y llevate un premio. ¿Te animás?</p>
        <div className={styles.pets} aria-hidden="true">
          <Character look={heroDog} expression="happy" className={styles.dog} />
          <Character look={heroCat} expression="neutral" className={styles.cat} />
        </div>
      </section>

      <form ref={formRef} className={styles.card} onSubmit={submit} noValidate autoComplete="off" aria-label="Registro">
        <h2 className={styles.cardTitle}>Contanos quién juega</h2>

        <Field label="Nombre completo" htmlFor={`${id}-fullName`} error={errors.fullName} errorId={`${id}-fullName-error`}>
          <input {...fieldProps('fullName')} type="text" name="gp-participante" placeholder="Ej.: Ana Pereira" maxLength={80} />
        </Field>

        <Field label="Celular" htmlFor={`${id}-phone`} error={errors.phone} errorId={`${id}-phone-error`}>
          <input {...fieldProps('phone')} type="tel" inputMode="tel" name="gp-cel" placeholder="Ej.: 099 123 456" maxLength={24} />
        </Field>

        <Field label="Correo electrónico" htmlFor={`${id}-email`} error={errors.email} errorId={`${id}-email-error`}>
          <input
            {...fieldProps('email')}
            type="email"
            inputMode="email"
            name="gp-mail"
            placeholder="Ej.: ana@correo.com"
            maxLength={254}
            autoCapitalize="none"
          />
        </Field>

        <p className={styles.dataNote}>
          Usamos tus datos solo para gestionar tu participación en esta activación. En esta versión no se envían ni se
          guardan: se borran al terminar.{' '}
          <button type="button" className={styles.link} onClick={() => setShowPolicy(true)}>
            Leer la política de privacidad
          </button>
        </p>

        <div className={styles.checks}>
          <label className={styles.check}>
            <input
              type="checkbox"
              data-field="privacyAccepted"
              checked={values.privacyAccepted}
              onChange={(e) => {
                set('privacyAccepted', e.target.checked);
                setTouched((t) => ({ ...t, privacyAccepted: true }));
                setErrors((prev) => ({ ...prev, privacyAccepted: e.target.checked ? undefined : prev.privacyAccepted }));
              }}
              aria-invalid={errors.privacyAccepted ? true : undefined}
              aria-describedby={errors.privacyAccepted ? `${id}-privacy-error` : undefined}
            />
            <span className={styles.box} aria-hidden="true" />
            <span>
              Leí y acepto la política de privacidad. <span className={styles.required}>(obligatorio)</span>
            </span>
          </label>
          {errors.privacyAccepted && (
            <p id={`${id}-privacy-error`} className={styles.error} role="alert">
              {errors.privacyAccepted}
            </p>
          )}

          <label className={styles.check}>
            <input
              type="checkbox"
              checked={values.promotionsOptIn}
              onChange={(e) => set('promotionsOptIn', e.target.checked)}
            />
            <span className={styles.box} aria-hidden="true" />
            <span>
              Quiero recibir novedades y promociones de GranPlus. <span className={styles.optional}>(opcional)</span>
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          Continuar
        </button>
      </form>

      {footer}
      {showPolicy && <PrivacyPolicy onClose={() => setShowPolicy(false)} />}
    </main>
  );
}

function Field({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className={[styles.field, error ? styles.hasError : ''].join(' ')}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
