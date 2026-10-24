# Guía visual — Biofresh · "¡Alimentá al campeón!"

> Documento de trabajo. Resume lo observado en el sitio oficial (biofreshpet.com.br/es, revisado el 23/10/2026)
> y en los materiales entregados por el cliente. **No es un manual de marca oficial**: los colores se tomaron del
> sitio y de los envases, y deben validarse con el responsable de marca antes de producción.

## 1. Recursos

| Recurso | Origen | Uso |
|---|---|---|
| Logotipo "BIOFRESH · SUPER PREMIUM NATURAL" (PNG transparente, negro) | Entregado por el cliente | Se usa **sin alterar**, sobre fondos claros |
| Envase perro adulto, porte mediano (WebP transparente) | Entregado por el cliente | Pantalla de premio |
| Envase gatos adultos (PNG transparente) | Entregado por el cliente | Pantalla de premio |
| Fotos del sitio (mascotas, ingredientes, banners) | Sitio oficial | **No se usan**: no hay autorización explícita |

La pantalla de premio muestra los dos envases (perro y gato) con la misma presentación que GranPlus. Adelante va
el de la especie elegida.

## 2. Identidad observada

- **Estilo:** blanco, minimalista y "natural". Fotos luminosas, mucho espacio vacío y fondos pastel por sección:
  rosa en el inicio, menta en Perros y celeste en Gatos.
- **Tipografías del sitio:** *Nunito Sans* para el texto y *Playfair Display* (serif) para los titulares
  destacados. Las dos son libres (OFL) y en la app se cargan desde el propio proyecto (`@fontsource`).
- **Botones:** negros en forma de píldora con texto blanco ("Aceptar todo", "¿Por qué tu mascota merece Biofresh?").
- **Íconos:** de línea negra dentro de círculos.
- **Envases:** blancos o gris claro, con logotipo negro y una franja de color por línea: azul marino, verde,
  violeta, rojo y salmón.

## 3. Colores usados en la app (`:root[data-brand='biofresh']` en `src/styles/global.css`)

| Uso | Valor | Referencia |
|---|---|---|
| Texto y botones | `#0B0F0E` | Negro del sitio |
| Fondo | Blanco → `#F6F6F6` con manchas pastel | Secciones del sitio |
| Rosa | `#F9A8D4` / `#FAE7ED` | Botón y fondo de la portada |
| Menta | `#CFF3E9` | Fondo de la sección Perros |
| Celeste | `#90DFFF` | Fondo de la sección Gatos |
| Campo de juego | `#FAE7ED` → `#F6C9DC` | Rosa pastel del sitio |
| Bandana de los personajes | `#2B4C6F` | Franja azul marino de los envases |

Sobre el campo rosa claro, las croquetas y los distractores llevan una sombra suave para mantener el contraste.

## 4. Pendientes con marca

1. Validar la paleta y el uso de Playfair Display en titulares.
2. Confirmar si los envases de la pantalla de premio son los adecuados para la activación.
3. Ícono y nombre propios para instalar la app (hoy el manifiesto de la PWA es de GranPlus).
