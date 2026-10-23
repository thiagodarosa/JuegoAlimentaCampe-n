/**
 * Datos del participante. En esta versión viven solo en memoria (estado de
 * React) durante una experiencia y se descartan al finalizar, cancelar o
 * reiniciar. No se escriben en localStorage, sessionStorage, URL ni logs.
 */

export interface ConsentRecord {
  /** Aceptación explícita de la política de privacidad (obligatoria). */
  privacyAccepted: true;
  privacyPolicyVersion: string;
  /** Consentimiento opcional para comunicaciones promocionales. */
  promotionsOptIn: boolean;
  /** Fecha y hora ISO de la aceptación. */
  acceptedAt: string;
}

export interface Participant {
  fullName: string;
  /** Teléfono tal como lo escribió la persona (sin quitar espacios ni prefijos). */
  phone: string;
  email: string;
  consent: ConsentRecord;
}

/**
 * Punto de integración para un backend seguro futuro.
 *
 * El MVP no envía ni guarda participaciones: `sessionOnlyRepository` no hace
 * nada y existe para que el resto de la app ya llame a un único lugar cuando
 * se agregue el almacenamiento real.
 */
export interface ParticipationRecord {
  participant: Participant;
  breedId: string;
  score: number;
  medal: string;
  playedAt: string;
}

export interface ParticipantRepository {
  readonly persistent: boolean;
  save(record: ParticipationRecord): Promise<void>;
}

export const sessionOnlyRepository: ParticipantRepository = {
  persistent: false,
  async save() {
    // Intencionalmente vacío: sin backend no se conserva ninguna participación.
  },
};
