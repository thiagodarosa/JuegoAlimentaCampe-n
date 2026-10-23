# Documentación técnica

## Arquitectura

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Flujo | `src/app/flow.ts` | Máquina de estados pura: pantallas, validaciones de paso y reinicio con borrado de datos |
| Motor | `src/game/engine.ts` | Tiempo, aparición de objetos, trayectorias, toques y puntaje. Sin React ni Canvas: se prueba aislado |
| Render | `src/game/renderer.ts`, `sprites.ts` | Dibujo en Canvas 2D con caché de sprites, partículas y textos flotantes |
| Pantallas | `src/features/*` | Componentes React de cada paso |
| Configuración | `src/config/*` | Puntos, tiempos, fases, razas y medallas por defecto |
| Participante | `src/participant/types.ts` | Tipos de datos y `ParticipantRepository`, el punto de integración con un backend futuro |
| Ajustes | `src/settings/*` | Configuración de la promotora y métricas anónimas (localStorage) |
| PWA | `vite.config.ts`, `src/pwa/*` | Service Worker (Workbox), precacheo y actualización con confirmación |

Dependencias de ejecución: `react`, `react-dom` y `@fontsource/figtree`. Todo lo demás es de desarrollo.

## Motor de juego

- **Tiempo:** se calcula con marcas temporales de `performance.now()`, no contando intervalos.
  - El tiempo jugado es `acumulado + (ahora − inicio del tramo actual)` y solo avanza en estado `running`.
  - La simulación avanza en pasos de 32 ms como máximo, así un cuadro trabado no hace saltar los objetos.
- **Inicio:** el cronómetro arranca recién cuando terminan la medición del área de juego (ResizeObserver) y
  la cuenta 3-2-1. Una carga lenta no descuenta tiempo.
- **Fases:** de 0 a 10 s, de 10 a 20 s y de 20 a 30 s. Cada fase cambia:
  - la frecuencia de aparición;
  - la cantidad máxima de objetos simultáneos (5, 7 y 9);
  - las trayectorias (aparición fija, cruce lateral, caída, zigzag y arco);
  - la velocidad.
- **Justicia:**
  - nunca hay más de 2 distractores seguidos;
  - si no hay ninguna croqueta en pantalla, la siguiente siempre es croqueta;
  - hay un tope absoluto de 12 objetos;
  - la dificultad es idéntica para perros y gatos: solo cambian los dibujos.
- **Toques:** se procesa `pointerdown`, que cubre dedo, mouse y lápiz.
  - El objeto se marca como tocado en el acto, así no se cuenta dos veces.
  - El área táctil es el radio del objeto más un 30 %, con un mínimo de 26 px de radio.
  - Los toques en pausa, antes de empezar o después del final se ignoran.
  - Si un toque llega con una marca posterior a los 30 s, termina la partida y no suma.
- **Puntaje:** croqueta +10 y distractor −5, con mínimo 0. Los valores están en `GAME_CONFIG`.
- **Coordenadas normalizadas:**
  - las posiciones se guardan como fracción del ancho y del alto;
  - los radios, como fracción del lado menor;
  - un cambio de tamaño u orientación solo reescala el Canvas: no reinicia ni duplica nada.
- **Densidad de píxeles:** el Canvas usa `devicePixelRatio` con tope 2x.

## Política de pausa

1. Si la app pierde visibilidad durante la cuenta regresiva o la partida, la partida se **pausa al instante**.
   Esto pasa con `visibilitychange` o `pagehide`: cambio de app, pantalla bloqueada u otra pestaña.
   - El cronómetro se congela.
   - Los objetos quedan quietos.
   - No se pueden sumar puntos.
2. Al volver se muestra "Partida en pausa · ¿Seguimos?". Con **Seguir jugando** hay una cuenta 3-2-1 y la
   partida continúa con el tiempo que quedaba.
3. Si la pausa dura más de **2 minutos** (`pauseTimeoutMs`), la experiencia se **cancela**: vuelve al registro
   y se borran los datos del participante. Se verifica también al volver, porque los temporizadores en
   segundo plano pueden demorarse.

## Inactividad y cancelación

- Fuera de la partida, si no hay interacción durante 90 s (configurable), la app vuelve al inicio y descarta
  todos los datos.
- En especie, raza e instrucciones hay un botón **Cancelar** con confirmación.
- Al reiniciar se desmonta todo el árbol de React (`key` por sesión), incluido el estado interno del formulario.

## Datos personales

- Nombre, celular y correo viven **solo en memoria**, en el estado de React, durante una experiencia.
- **No** se escriben en `localStorage` ni `sessionStorage`, URL ni consola. Hay pruebas automáticas que lo verifican.
- El consentimiento queda registrado en memoria (`ConsentRecord`) con:
  - la versión de la política;
  - la fecha y hora;
  - la aceptación de la privacidad, que es obligatoria;
  - la aceptación de promociones, que es opcional y empieza desmarcada.
- **Limitación:** sin backend, este registro se descarta al reiniciar. No queda evidencia conservada del consentimiento.
- `sessionOnlyRepository.save()` no hace nada a propósito. Un backend futuro tiene que implementar `ParticipantRepository`.
- El formulario usa `autocomplete="off"` para no sugerir datos de participantes anteriores. Algunos
  navegadores lo ignoran: hay que desactivar el autocompletado en las tablets.
- Sin geolocalización, analítica externa ni herramientas publicitarias.
- **Métricas anónimas:** son opcionales y están desactivadas por defecto.
  - Solo guardan totales del dispositivo: partidas, suma y mejor puntaje, y medallas y especies elegidas.
  - No guardan nada que identifique a una persona.
  - **No se centralizan entre tablets.**
- **Configuración de la promotora:** se guarda en `localStorage` porque no tiene datos personales y debe
  sobrevivir a un reinicio del dispositivo.

## Modo sin conexión

- Workbox (`vite-plugin-pwa`, `generateSW`) precachea:
  - HTML, JS y CSS;
  - las fuentes woff2;
  - el logo y los envases;
  - los íconos.

  En total son unos 1 MB y 22 recursos.
- Las fuentes están autoalojadas y los sonidos se sintetizan con Web Audio. No hay ningún recurso remoto.
- **Limitación:** la **primera** carga necesita conexión. Hasta que el Service Worker no está activo, la app no
  funciona sin internet. El panel de promotora indica si ya está lista.
- **Actualización:** con `registerType: 'prompt'`, la versión nueva se instala en espera y solo se activa cuando
  la promotora la confirma. Al recuperar la conexión se busca una versión nueva automáticamente.
- **Limitación:** cada tablet funciona aislada. **No hay forma de centralizar registros** entre dispositivos.
- **Safari (iPad):** puede borrar el almacenamiento de sitios que no se usan durante varias semanas. Conviene
  abrir la app con conexión antes de cada activación.

## Pruebas

### Unitarias e integración (Vitest + Testing Library): 108 pruebas

| Archivo | Cubre |
|---|---|
| `features/registration/validation.test.ts` | Campos obligatorios, nombre, celulares uruguayos e internacionales, correo |
| `features/registration/RegistrationScreen.test.tsx` | Errores junto a cada campo, foco en el primer error, consentimientos obligatorio y opcional, teléfono sin modificar, autocompletado desactivado, política provisoria |
| `game/engine.test.ts` | 30 s exactos, marcas temporales con cuadros irregulares, fin único, +10/−5, mínimo 0, sin doble conteo, nada después del final ni en pausa, límites de objetos, sin rachas de distractores, siempre hay croquetas, dificultad progresiva, igualdad perro/gato, cambio de tamaño |
| `app/flow.test.ts` | Orden del flujo, no saltear el registro, raza de la especie correcta, no repetir datos, reinicio y cancelación con borrado, modo demo |
| `app/App.test.tsx` | Flujo completo con reloj simulado, personaje en la partida, ningún dato personal en el almacenamiento, cancelar, inactividad, pausa por visibilidad y cancelación por pausa larga |
| `settings/settings.test.ts` | Umbrales de medallas, configuración dañada o inválida, métricas solo agregadas |

### De punta a punta (Playwright, contra la compilación de producción)

Se ejecutan en 4 proyectos: tablet horizontal 1024×768, tablet vertical 768×1024, celular 390×844 y escritorio
1440×900.

| Archivo | Cubre |
|---|---|
| `e2e/flow.spec.ts` | En los 4 tamaños: flujo completo con validación, sin desplazamiento horizontal, sin scroll durante la partida, reinicio limpio y nada personal en el almacenamiento. También: puntaje nunca negativo y toques ignorados después del final. Guarda capturas |
| `e2e/orientation.spec.ts` | Rotación en plena partida: no reinicia el cronómetro, no duplica el Canvas y lo ajusta a la densidad de píxeles |
| `e2e/offline.spec.ts` | Sin red después de la primera carga: logo, fuente, partida completa y envases en el premio |
| `e2e/promoter.spec.ts` | Sin botón visible, atajo de teclado, gesto táctil oculto, umbrales y textos configurables, modo demo |

Las pruebas E2E controlan el reloj (`page.clock`) para recorrer los 30 s sin esperar en tiempo real.

### Lo que no se pudo verificar en este entorno

- **Dispositivos físicos:** no se probó en un iPad ni en una tablet Android reales. Las pruebas usan Chromium con
  emulación de tamaño y de toque. Falta confirmar con el dedo la sensación táctil, el rendimiento en equipos
  de gama baja, el audio en Safari y la instalación en la pantalla de inicio.
- **Safari / WebKit:** no se ejecutaron pruebas automáticas en WebKit, solo en Chromium.
- **Autocompletado de cada navegador:** no se puede verificar que todos respeten `autocomplete="off"`.
- **Lectores de pantalla:** se usaron roles y etiquetas accesibles, pero no hubo prueba manual con TalkBack o VoiceOver.
- **Balance del juego:** los valores de dificultad y los umbrales de medallas (plata 150, oro 300) son iniciales.
  Hay que ajustarlos con jugadores reales en la primera prueba de campo.

## Limitaciones conocidas

- Sin backend: no se conservan participaciones ni evidencia de consentimiento, y no hay sincronización entre tablets.
- Política de privacidad provisoria, no aprobada.
- El logo blanco es un recoloreo del PNG oficial con filtro CSS. Hay que pedir a marca la versión oficial.
- La paleta se tomó del sitio web, no de un manual de marca.
- Los envases están en portugués (Brasil): son los provistos por el cliente.
- El acceso a la promotora no es seguro (es intencional y está documentado).
