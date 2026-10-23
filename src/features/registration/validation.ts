/**
 * Validación del formulario de registro. Son funciones puras: la interfaz
 * las usa al salir de cada campo y, siempre, al enviar el formulario.
 * Los valores nunca se modifican: el teléfono se guarda tal como se escribió.
 */

export interface RegistrationValues {
  fullName: string;
  phone: string;
  email: string;
  privacyAccepted: boolean;
  promotionsOptIn: boolean;
}

export type RegistrationField = 'fullName' | 'phone' | 'email' | 'privacyAccepted';
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

// Letras (incluye tildes y ñ), apóstrofos, guiones y puntos entre palabras.
const NAME_WORD = /^[\p{L}][\p{L}'’.\-]*$/u;

export function validateFullName(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'Ingresá tu nombre completo.';
  if (v.length > 80) return 'El nombre es demasiado largo.';
  const words = v.split(/\s+/);
  if (!words.every((w) => NAME_WORD.test(w))) return 'Usá solo letras en el nombre.';
  const realWords = words.filter((w) => w.replace(/[^\p{L}]/gu, '').length >= 2);
  if (realWords.length < 2) return 'Ingresá nombre y apellido.';
  return undefined;
}

/** Quita separadores habituales solo para validar (el valor guardado no cambia). */
export function phoneDigits(value: string) {
  return value.replace(/[\s\-().]/g, '');
}

const UY_MOBILE_LOCAL = /^09[1-9]\d{6}$/; // 09X XXX XXX
const UY_MOBILE_NO_ZERO = /^9[1-9]\d{6}$/; // 9X XXX XXX
const UY_MOBILE_INTL = /^(?:\+|00)5989[1-9]\d{6}$/; // +598 9X XXX XXX
const OTHER_INTL = /^(?:\+|00)[1-9]\d{7,14}$/;

export function validatePhone(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'Ingresá tu celular.';
  if (!/^\+?[\d\s\-().]+$/.test(v)) return 'El celular solo puede tener números, espacios, guiones y el prefijo +.';
  const d = phoneDigits(v);
  if (UY_MOBILE_LOCAL.test(d) || UY_MOBILE_NO_ZERO.test(d) || UY_MOBILE_INTL.test(d)) return undefined;
  if (/^(?:\+|00)598/.test(d)) return 'Revisá el número: un celular uruguayo es +598 9X XXX XXX.';
  if (OTHER_INTL.test(d)) return undefined;
  return 'Revisá el número. Ejemplo: 099 123 456 o +598 99 123 456.';
}

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function validateEmail(value: string): string | undefined {
  const v = value.trim();
  if (!v) return 'Ingresá tu correo electrónico.';
  if (v.length > 254 || !EMAIL.test(v) || v.includes('..')) return 'Revisá el correo. Ejemplo: nombre@correo.com';
  return undefined;
}

export function validateRegistration(values: RegistrationValues): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const name = validateFullName(values.fullName);
  const phone = validatePhone(values.phone);
  const email = validateEmail(values.email);
  if (name) errors.fullName = name;
  if (phone) errors.phone = phone;
  if (email) errors.email = email;
  if (!values.privacyAccepted) errors.privacyAccepted = 'Para participar tenés que aceptar la política de privacidad.';
  return errors;
}

export function validateField(field: RegistrationField, values: RegistrationValues): string | undefined {
  return validateRegistration(values)[field];
}
