# GranPlus · ¡Alimentá al campeón!

Minijuego promocional para activaciones de GranPlus en pet shops y veterinarias. Está pensado para tablets
operadas por promotoras y también funciona en celulares y computadoras.

**Flujo:** registro, elección de perro o gato, elección de raza, instrucciones, partida de 30 segundos,
resultado con medalla, pantalla de premio y reinicio para el siguiente participante.

> **Estado: demo funcional (MVP).** No tiene backend: los datos personales se validan, se usan durante la
> experiencia y se borran al terminar. La política de privacidad es **provisoria** (ver
> [docs/PRIVACIDAD_PENDIENTE.md](docs/PRIVACIDAD_PENDIENTE.md)).

## Requisitos

- Node.js 20 o superior (probado con Node 24.22 y npm 11.19).
- Para las pruebas E2E: el navegador de Playwright (`npx playwright install chromium`).

## Instalación y ejecución

```bash
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run build        # verificación de tipos + compilación en dist/
npm run preview      # sirve dist/ en http://localhost:4173 (incluye el Service Worker)
```

> El proyecto está dentro de una carpeta de OneDrive. Si la instalación o la compilación se vuelven lentas o
> aparecen archivos bloqueados, pausá la sincronización o mové el proyecto a una carpeta local (por ejemplo `C:\dev\`).

## Pruebas

```bash
npm test             # pruebas unitarias y de integración (Vitest)
npm run test:e2e     # pruebas de punta a punta (Playwright) en 4 tamaños de pantalla
npm run typecheck    # TypeScript en modo estricto
```

Las pruebas E2E compilan y levantan `vite preview` solas. Las capturas de cada pantalla quedan en
`test-results/capturas/<dispositivo>/`. El detalle de qué cubre cada prueba y qué no se pudo verificar está en
[docs/TECNICO.md](docs/TECNICO.md#pruebas).

## Publicación

`dist/` es un sitio estático: se puede publicar en cualquier hosting estático con **HTTPS**, que es obligatorio
para el Service Worker (en `localhost` funciona sin HTTPS). Si se publica en una subcarpeta, hay que ajustar
`base` en `vite.config.ts` y `start_url`/`scope` del manifiesto.

## Preparar una tablet para usar sin conexión

1. Con internet, abrí la URL de la app en Chrome (Android) o Safari (iPad).
2. Esperá a que cargue y **recargá la página una vez**. Así el Service Worker queda instalado y con todos
   los recursos guardados.
3. Opcional: "Agregar a la pantalla de inicio" para abrirla a pantalla completa.
4. Entrá al **modo promotora** y verificá que diga "Uso sin conexión: lista ✓".
5. Probá con el modo avión activado: tiene que funcionar el flujo completo.

Recomendaciones para tablets compartidas:

- Desactivar en el navegador el autocompletado de formularios: la app pide no autocompletar, pero algunos
  navegadores lo ignoran.
- Desactivar el bloqueo automático de pantalla o usar el modo kiosco o fijación de pantalla del sistema.

## Actualizar la app

Cuando se publica una versión nueva y la tablet tiene conexión, la app la descarga en segundo plano, pero
**no la aplica sola** para no interrumpir una partida. En el modo promotora aparece el botón
"Instalar versión nueva y recargar". Si todavía no se detectó, se puede usar "Buscar actualización".
Mientras haya una versión nueva pendiente, en la pantalla inicial se ve un punto discreto junto al número de versión.

## Modo promotora

No hay ningún botón visible para entrar. Hay dos formas:

- **Tablet:** en la pantalla de registro, mantener presionado el logo GranPlus **3 segundos**. Después, dentro
  de los 6 segundos siguientes, tocar **3 veces la esquina inferior derecha**.
- **Computadora:** `Ctrl + Shift + P` en la pantalla de registro.

Desde el panel se puede:

- jugar en **modo demo**, que recorre todo el flujo sin formulario y no cuenta en las métricas;
- **reiniciar** la experiencia;
- configurar los **umbrales y mensajes de las medallas** y los **textos de la pantalla de premio**;
- activar o desactivar el **sonido** y las **métricas anónimas**;
- ajustar el tiempo de **inactividad** antes de volver al inicio;
- ver el estado de la conexión y del modo sin conexión, y aplicar actualizaciones.

> Este acceso solo evita aperturas accidentales. **No es un mecanismo de seguridad**: no protege datos ni
> configuraciones frente a alguien que conozca el gesto.

## Configuración del juego

Todos los valores de juego están centralizados en [src/config/game.config.ts](src/config/game.config.ts):

- duración y cuenta regresiva;
- puntos por croqueta (+10) y por distractor (−5), con mínimo 0;
- fases de dificultad;
- tamaños táctiles mínimos;
- tiempo máximo de pausa.

Las razas y el aspecto de los personajes están en [src/config/breeds.ts](src/config/breeds.ts).

## Estructura

```
src/
  app/            flujo (máquina de estados), App y hooks (inactividad, acceso de promotora)
  config/         configuración del juego y razas
  characters/     personajes ilustrados originales (SVG)
  game/           motor (sin React), dibujo de objetos, renderizado en Canvas
  features/       pantallas: registro, mascota, instrucciones, partida, resultado, premio, promotora
  participant/    tipos de datos del participante y punto de integración para un backend futuro
  settings/       configuración de la promotora y métricas anónimas (localStorage, sin datos personales)
  pwa/            Service Worker y actualización
  audio/          efectos de sonido sintetizados (sin archivos)
  ui/             componentes comunes
e2e/              pruebas Playwright
docs/             guía visual, documentación técnica y pendientes de privacidad
```

## Documentación

- [docs/GUIA_VISUAL.md](docs/GUIA_VISUAL.md): identidad de GranPlus observada, recursos y pendientes con marca.
- [docs/TECNICO.md](docs/TECNICO.md): arquitectura, políticas de pausa y rotación, datos, modo sin conexión, pruebas y limitaciones.
- [docs/PRIVACIDAD_PENDIENTE.md](docs/PRIVACIDAD_PENDIENTE.md): lo que hay que definir antes de producción.
