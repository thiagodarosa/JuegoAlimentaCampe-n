# Guía visual — GranPlus · "¡Alimentá al campeón!"

> Documento de trabajo. Resume lo observado en el sitio oficial (granplus.com.br/es, revisado el 22/10/2026)
> y en los recursos entregados por el cliente. **No es un manual de marca oficial**: los valores marcados como
> "observado" se tomaron del CSS del sitio y deben validarse con el responsable de marca antes de producción.

## 1. Recursos disponibles

| Recurso | Origen | Estado |
|---|---|---|
| Logotipo "GRAN PLUS" bordó, PNG transparente (900 px de ancho) | Entregado por el cliente | Autorizado para usar |
| Envase Menu · Gatito pollo y arroz (1500×1500, webp) | Entregado por el cliente | Autorizado para usar |
| Envase Gourmet · Gato adulto castrado salmón y pollo | Entregado por el cliente | Autorizado para usar |
| Envase Menu · Perro senior mediano y grande pollo y arroz | Entregado por el cliente | Autorizado para usar |
| Envase Gourmet · Perro adulto mediano y grande cordero y arroz | Entregado por el cliente | Autorizado para usar |
| Versión del logo en blanco | No entregada | **Provisoria**: se recolorea el PNG oficial con un filtro CSS. Pedir la versión oficial a marca |
| Fotografías del sitio (perro comiendo, croquetas, banners) | Sitio oficial | **No se usan**: sin autorización explícita |
| Tipografía Effra | Sitio oficial | **No se usa**: licencia comercial no provista |
| Personajes oficiales | No existen en el sitio | Se crean personajes originales |

Los envases están en portugués (Brasil). Sirven como imagen de producto, pero no se citan sus textos
(beneficios, claims) dentro de la app.

## 2. Color (observado en el sitio)

| Token | Valor | Uso en el sitio | Uso propuesto |
|---|---|---|---|
| `--gp-wine-900` | `#4D0225` | Inicio de degradado oscuro | Fondos profundos, sombras |
| `--gp-wine-800` | `#54032A` | Fondo de header y secciones | Fondo base de pantallas |
| `--gp-wine-700` | `#6A0032` | Color principal, fin de degradados | Botones, paneles |
| `--gp-gold` | `#F3C879` | Titulares ("Perros", "Gatos"), textos destacados | Títulos, botón primario, puntaje |
| `--gp-coral` | `#FF8B7B` | Inicio del degradado coral → vino | Degradado de fondo de hero |
| `--gp-rose` | `#CA6976` | Acentos | Estados secundarios |
| `--gp-cream` | (de envases Menu) | Etiquetas de sabor | Tarjetas, formulario |
| `--gp-white` | `#FFFFFF` | Texto sobre vino | Texto principal |

Degradados del sitio:
- Hero: `linear-gradient(#FF8B7B 0%, #6A0032 100%)` (coral arriba, vino abajo).
- Sección oscura: `linear-gradient(#4D0225 0%, #6A0032 100%)`.

Colores funcionales del juego (propios, no de marca): verde para el puntaje positivo y un rojo o coral suave para la penalización.
Siempre se acompañan de un ícono o texto, nunca se comunica solo con color.

## 3. Tipografía

- El sitio usa **Effra** (titulares en peso 900, mayúsculas o tipo título, con mucho tamaño).
- El logotipo es una serif propia: **se usa siempre como imagen**, nunca se recrea con texto.
- La línea Menu usa una serif itálica dorada para "Menu", y la línea Gourmet usa mayúsculas espaciadas.
- En la app se usa **Figtree** (licencia OFL, paquete `@fontsource/figtree`), autoalojada para funcionar sin conexión, con pesos
  400 a 900 y un carácter similar a Effra. Se reemplaza fácilmente si marca entrega Effra con licencia web (ver `src/main.tsx` y `--font` en `src/styles/global.css`).

## 4. Composición y fotografía

- Fondos vino o degradado coral → vino, con productos en el lado derecho y titular dorado a la izquierda.
- Fotografía cálida de mascotas reales interactuando con el producto y primeros planos de croquetas.
- Envases con brillo superior rosado (Menu) o ciruela profundo (Gourmet) y franja dorada.
- En la app: degradado vino con textura sutil de croquetas (ilustración propia), logo arriba a la izquierda o centrado,
  y personajes ilustrados en vez de fotos.

## 5. Tono de comunicación

- Valores declarados por la marca: **Gourmet, Confianza, Sofisticación**. Frases recurrentes: "paladares exigentes",
  "sabor irresistible", "Tu mascota pide GranPlus", "Más sabor, por favor".
- Para la app: tono cálido y juguetón, pero elegante. Voseo rioplatense ("Alimentá", "Tocá", "Acercate").
- **No** se incluyen afirmaciones nutricionales ni de salud dentro del juego.

## 6. Personajes (originales)

- Ilustración vectorial propia (SVG), estilo redondeado y amable, con contorno vino oscuro y paleta cálida.
- Una base común por especie: el cuerpo es el mismo y cambian las orejas, el hocico, el pelaje y el patrón.
  Así la estética queda consistente y los archivos son livianos.
- Rasgos reconocibles por raza, basados en los estándares de FCI (perros) y TICA/FIFe (gatos) solo como referencia
  descriptiva, sin copiar ilustraciones.
- Expresiones: neutro, feliz (al comer una croqueta), sorprendido (con un distractor) y celebración (en el resultado).

## 7. Pendientes con marca

1. Validar la paleta observada o entregar el manual de marca.
2. Logo en versión blanca o monocromática.
3. Licencia web de Effra (opcional).
4. Política de privacidad aprobada y datos del responsable del tratamiento.
5. Definición del premio físico y del texto final de la pantalla de premio.
