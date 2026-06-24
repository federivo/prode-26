# Ayuda de puntaje en el header (flyout) — diseño

Fecha: 2026-06-24

## Qué es

La explicación de **cómo se puntúa** (la tarjeta "Cómo se puntúa" con los
cuatro niveles de puntos) hoy vive solo en `/groups`. Se vuelve accesible
**desde el header, en cualquier página logueada y siempre**, mediante un botón
de ayuda que abre un flyout con esa misma tarjeta.

## Decisiones

### Alcance: solo el header logueado

El header (`Nav`) se renderiza vía el layout `(app)`, así que aparece en todas
las páginas logueadas. Sumar el flyout ahí lo hace visible "en todos lados,
siempre" sin tocar nada más. Las páginas deslogueadas (login) no tienen header
y ya muestran su propio resumen de puntaje, así que quedan intactas.

### Reuso del contenido, no refactor

Se consideraron tres enfoques:

1. **Componente `ScoringHelp` autocontenido que reusa `<ScoringInfo />` como
   cuerpo del panel** ✅ — una sola fuente de verdad para los niveles de puntaje,
   código nuevo mínimo, sin dependencias nuevas, y la tarjeta inline de
   `/groups` queda igual.
2. **Extraer una lista compartida `ScoringTiers`** — separar `ScoringInfo` en
   contenido + contenedor. Más prolijo en teoría, pero es refactor por una
   ganancia marginal (YAGNI): reusar la tarjeta entera ya funciona como panel
   flotante.
3. **HTML Popover API nativa (`popover` + anchor positioning)** — menos JS, pero
   el soporte de anchor positioning es desparejo y da menos control de layout.
   Riesgo sin beneficio real acá.

Se elige el enfoque 1.

### Interacción y accesibilidad

- **Tap/click para abrir y cerrar** (app mobile-first, sin hover).
- Cierra al: volver a tocar el botón, tocar/clickear afuera (`pointerdown` en
  `document`), `Escape`, y **al cambiar de ruta** (`usePathname`) para que no
  quede abierto al navegar.
- Botón: `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`.
- Panel: `role="dialog"` + `aria-label` ("Cómo se puntúa").
- Ícono `HelpCircle` (lucide), con el mismo estilo que los otros botones-ícono
  del header (`h-9 w-9 rounded-full text-muted hover:bg-primary-soft/60`).
- Aparición con un fade/scale corto vía transición de Tailwind.

### Posición

Contenedor `relative` alrededor del botón; el panel es
`absolute right-0 top-full mt-2 z-50 w-[min(20rem,90vw)]` para que caiga debajo
del botón y no desborde en mobile. Sombra un poco más marcada que la tarjeta
inline para leerse como elemento flotante.

### Ubicación en el header

En el grupo de utilidades de la derecha, **antes de `ThemeToggle`**. Orden
final: perfil · ayuda · tema · salir.

## Componentes

| Pieza | Archivo | Rol |
|---|---|---|
| Flyout (nuevo) | `src/components/scoring-help.tsx` | `"use client"`; botón de ayuda + panel con `<ScoringInfo />`; maneja abrir/cerrar, click-outside, Escape, cierre por ruta |
| Header | `src/components/nav.tsx` | Un import + `<ScoringHelp />` en el cluster derecho |
| Contenido reusado | `src/components/scoring-info.tsx` | Sin cambios; se renderiza como cuerpo del panel |

**Sin cambios:** `/groups` mantiene su tarjeta `ScoringInfo` inline (decisión
del usuario). Páginas deslogueadas, intactas.

## Manejo de errores

No hay flujo de datos ni red: es UI pura. El único estado es abierto/cerrado.
Los listeners de `document` (pointerdown/keydown) se agregan solo cuando está
abierto y se limpian en el cleanup del efecto.

## Verificación

`npm run lint` y `npm run build` (el build de Next valida tipos y que la ruta
`(app)` que renderiza `Nav` compile). No hay harness de tests de componentes
(no está Testing Library) y sumarlo queda fuera de alcance.

**Nota:** el header solo se renderiza logueado, y el login está caído porque el
proyecto Supabase de dev fue borrado. La verificación de interacción en vivo
(abrir/cerrar, mobile, light/dark) queda pendiente hasta restaurar la DB de dev.
