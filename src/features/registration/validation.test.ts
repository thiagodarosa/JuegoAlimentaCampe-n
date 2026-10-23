import { describe, expect, it } from 'vitest';
import { validateEmail, validateFullName, validatePhone, validateRegistration } from './validation';

describe('nombre completo', () => {
  it.each(['Ana Pereira', 'José María Fernández', "María O'Neill", 'Juan Pérez-Silva', '  Lucía   Núñez  '])('acepta "%s"', (v) => {
    expect(validateFullName(v)).toBeUndefined();
  });

  it.each([
    ['', 'Ingresá tu nombre completo.'],
    ['   ', 'Ingresá tu nombre completo.'],
    ['Ana', 'Ingresá nombre y apellido.'],
    ['A B', 'Ingresá nombre y apellido.'],
    ['Ana P3reira', 'Usá solo letras en el nombre.'],
    ['Ana @Pereira', 'Usá solo letras en el nombre.'],
  ])('rechaza "%s"', (v, msg) => {
    expect(validateFullName(v)).toBe(msg);
  });

  it('rechaza nombres demasiado largos', () => {
    expect(validateFullName(`Ana ${'a'.repeat(90)}`)).toBeDefined();
  });
});

describe('celular', () => {
  it.each([
    '099123456',
    '099 123 456',
    '099-123-456',
    '(099) 123 456',
    '98 123 456',
    '+598 99 123 456',
    '+59899123456',
    '00598 91 234 567',
    '+54 9 11 2345 6789', // Argentina
    '+55 11 91234 5678', // Brasil
  ])('acepta "%s"', (v) => {
    expect(validatePhone(v)).toBeUndefined();
  });

  it.each(['', '099 12', '2900 1234', '090123456', '+598 2 900 1234', '099 123 45a', 'cel 099123456', '+1 23'])(
    'rechaza "%s"',
    (v) => {
      expect(validatePhone(v)).toBeDefined();
    },
  );

  it('el mensaje de campo vacío es claro', () => {
    expect(validatePhone('')).toBe('Ingresá tu celular.');
  });
});

describe('correo electrónico', () => {
  it.each(['ana@correo.com', 'ana.pereira+promo@empresa.com.uy', 'a_b@sub.dominio.org'])('acepta "%s"', (v) => {
    expect(validateEmail(v)).toBeUndefined();
  });

  it.each(['', 'ana', 'ana@', 'ana@correo', 'ana@correo.c', 'ana pereira@correo.com', 'ana@@correo.com', 'ana..p@correo.com', 'ana@correo..com'])(
    'rechaza "%s"',
    (v) => {
      expect(validateEmail(v)).toBeDefined();
    },
  );
});

describe('formulario completo', () => {
  const valid = {
    fullName: 'Ana Pereira',
    phone: '099 123 456',
    email: 'ana@correo.com',
    privacyAccepted: true,
    promotionsOptIn: false,
  };

  it('sin errores cuando todo es válido', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it('todos los campos obligatorios vacíos generan error', () => {
    const errors = validateRegistration({ fullName: '', phone: '', email: '', privacyAccepted: false, promotionsOptIn: false });
    expect(Object.keys(errors).sort()).toEqual(['email', 'fullName', 'phone', 'privacyAccepted']);
  });

  it('la política de privacidad es obligatoria', () => {
    expect(validateRegistration({ ...valid, privacyAccepted: false }).privacyAccepted).toBeDefined();
  });

  it('las promociones son opcionales', () => {
    expect(validateRegistration({ ...valid, promotionsOptIn: false })).toEqual({});
    expect(validateRegistration({ ...valid, promotionsOptIn: true })).toEqual({});
  });
});
