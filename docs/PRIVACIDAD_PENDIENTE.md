# Privacidad: pendientes antes de producción

> Este documento **no es asesoramiento legal**. Enumera lo que el responsable del tratamiento de datos tiene que
> definir y que un asesor jurídico tiene que revisar antes de usar la aplicación con participantes reales.
> En Uruguay, la norma de referencia es la Ley N.º 18.331 de Protección de Datos Personales y su
> reglamentación. Su aplicación concreta la tiene que confirmar el asesor.

## Estado actual de la demo

- Se piden nombre completo, celular y correo, más dos consentimientos separados:
  - la política de privacidad, obligatoria;
  - las comunicaciones promocionales, opcionales y desmarcadas.
- Los datos se usan **solo en memoria** durante la experiencia y se borran al terminar, cancelar, quedar
  inactiva la app o reiniciar.
- **No se envían a ningún servidor ni se guardan** en el dispositivo.
- La política que se muestra en la app (`src/features/registration/PrivacyPolicy.tsx`) es **provisoria** y
  está marcada como "PENDIENTE DE APROBACIÓN".
- No se implementó el envío de campañas comerciales.

## Lo que tiene que completar el responsable

1. **Identidad del responsable:** razón social, RUT, domicilio y canal de contacto.
2. **Finalidad del tratamiento:** para qué se usa cada dato (participación, entrega del premio, comunicaciones
   promocionales) y la base de cada uso.
3. **Plazo de conservación** de las participaciones y de la evidencia de consentimiento.
4. **Lugar de almacenamiento y encargados:** dónde se guardan los datos, qué proveedores intervienen y si hay
   transferencias internacionales.
5. **Inscripción de la base de datos** ante el organismo de control, si corresponde.
6. **Procedimiento para los derechos** de acceso, rectificación, actualización, inclusión y supresión: canal,
   plazos y responsables.
7. **Controles de acceso:** quién puede ver los registros y cómo se autentica.
8. **Texto final de la política** y su versión: actualizar `PRIVACY_POLICY_VERSION` en
   `src/config/game.config.ts` cada vez que cambie.
9. **Premio:** el texto de la pantalla de premio no promete nada específico. Hay que confirmar qué se entrega y
   las condiciones de la promoción, si las hay.

## Lo que falta construir para producción

- **Backend seguro:**
  - API con HTTPS y autenticación de dispositivos o promotoras;
  - almacenamiento cifrado;
  - registros de auditoría sin datos personales en texto plano.
- **Implementación real de `ParticipantRepository`** (`src/participant/types.ts`):
  - la cola local debe estar cifrada y existir solo si hace falta operar sin conexión;
  - su uso tiene que estar documentado y justificado;
  - hoy la app no escribe datos personales en el dispositivo.
- **Conservación de la evidencia de consentimiento:** versión de la política, fecha y hora, y aceptaciones.
- **Autenticación real del modo promotora:** el gesto oculto actual no es un control de seguridad.
- **Política de borrado y procedimiento de respuesta** ante incidentes.
