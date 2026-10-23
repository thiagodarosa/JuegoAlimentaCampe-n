import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegistrationScreen } from './RegistrationScreen';

function setup() {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<RegistrationScreen onSubmit={onSubmit} />);
  const name = screen.getByLabelText('Nombre completo');
  const phone = screen.getByLabelText('Celular');
  const email = screen.getByLabelText('Correo electrónico');
  const privacy = screen.getByRole('checkbox', { name: /acepto la política de privacidad/i });
  const promos = screen.getByRole('checkbox', { name: /novedades y promociones/i });
  const submit = screen.getByRole('button', { name: 'Continuar' });
  return { onSubmit, user, name, phone, email, privacy, promos, submit };
}

describe('formulario de registro', () => {
  it('muestra el título y el acceso a la política de privacidad', () => {
    setup();
    expect(screen.getByRole('heading', { name: '¡Alimentá al campeón!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leer la política de privacidad' })).toBeInTheDocument();
  });

  it('no deja avanzar con campos vacíos y muestra cada error junto a su campo', async () => {
    const { user, submit, onSubmit, name, phone, email, privacy } = setup();
    await user.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(name).toHaveAccessibleDescription('Ingresá tu nombre completo.');
    expect(phone).toHaveAccessibleDescription('Ingresá tu celular.');
    expect(email).toHaveAccessibleDescription('Ingresá tu correo electrónico.');
    expect(privacy).toHaveAccessibleDescription('Para participar tenés que aceptar la política de privacidad.');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveFocus();
  });

  it('valida al salir del campo', async () => {
    const { user, phone, email } = setup();
    await user.type(phone, '099 12');
    await user.click(email);
    expect(phone).toHaveAccessibleDescription(/Revisá el número/);
  });

  it('el consentimiento promocional es opcional y empieza desmarcado', () => {
    const { promos, privacy } = setup();
    expect(promos).not.toBeChecked();
    expect(privacy).not.toBeChecked();
  });

  it('exige aceptar la política de privacidad', async () => {
    const { user, name, phone, email, submit, onSubmit } = setup();
    await user.type(name, 'Ana Pereira');
    await user.type(phone, '099 123 456');
    await user.type(email, 'ana@correo.com');
    await user.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos con el consentimiento registrado y el teléfono intacto', async () => {
    const { user, name, phone, email, privacy, submit, onSubmit } = setup();
    await user.type(name, '  Ana   Pereira ');
    await user.type(phone, '+598 (99) 123-456');
    await user.type(email, 'ana@correo.com');
    await user.click(privacy);
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const participant = onSubmit.mock.calls[0]![0];
    expect(participant).toMatchObject({
      fullName: 'Ana Pereira',
      phone: '+598 (99) 123-456',
      email: 'ana@correo.com',
      consent: { privacyAccepted: true, promotionsOptIn: false },
    });
    expect(new Date(participant.consent.acceptedAt).toString()).not.toBe('Invalid Date');
    expect(participant.consent.privacyPolicyVersion).toBeTruthy();
  });

  it('registra el consentimiento promocional por separado', async () => {
    const { user, name, phone, email, privacy, promos, submit, onSubmit } = setup();
    await user.type(name, 'Ana Pereira');
    await user.type(phone, '099123456');
    await user.type(email, 'ana@correo.com');
    await user.click(privacy);
    await user.click(promos);
    await user.click(submit);
    expect(onSubmit.mock.calls[0]![0].consent.promotionsOptIn).toBe(true);
  });

  it('desactiva el autocompletado para no mostrar datos de otros participantes', () => {
    const { name, phone, email } = setup();
    for (const input of [name, phone, email]) expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('abre la política de privacidad provisoria', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Leer la política de privacidad' }));
    expect(screen.getByRole('dialog', { name: 'Política de privacidad' })).toHaveTextContent(/PENDIENTE DE APROBACIÓN/);
  });
});
