# Modo Focus — diseño

Fecha: 2026-06-12

## Qué es

Un modo alternativo para cargar pronósticos: en vez de la planilla completa con
todos los partidos, se muestra **un partido a la vez**. El resultado se elige
con **un toque** (chips del 0 al 10 para cada equipo) y se navega con botones
**Anterior / Siguiente**.

## Decisiones

### Dónde vive: ruta propia `/matches/focus`

Se consideraron tres enfoques:

1. **Toggle client-side en `/matches`** — obligaría a convertir toda la lista
   (MatchCard y compañía) en client components y a hidratar todo aunque el
   usuario nunca entre al modo Focus.
2. **Overlay/modal sobre la lista** — más trabajo de UI, la lista queda montada
   de fondo sin necesidad, y no se puede linkear directo al modo.
3. **Ruta propia `/matches/focus`** ✅ — separación server/client limpia (la
   página server trae los datos, un client component maneja la interacción),
   URL compartible, y el diff sobre `/matches` es mínimo (un link en el header).

### Qué partidos entran

Solo los **editables** — misma regla que `MatchCard`:
`(status === "SCHEDULED" && kickoff > ahora) || predictions_open`,
ordenados por kickoff. Los partidos cerrados/jugados no aportan nada en un
flujo de carga rápida. Si no hay ninguno editable, se muestra un estado vacío
con link de vuelta a la lista.

Arranca en el **primer partido sin pronóstico** (si todos tienen, en el
primero), para que "entrar y seguir cargando" sea natural.

### Selección con un toque + autosave

- Por equipo: grilla de chips **0–10** (6 columnas → filas de 6 y 5), targets
  grandes para mobile.
- Al tener ambos puntajes elegidos se **guarda solo** (reusa el server action
  `savePrediction` existente, construyendo el FormData a mano dentro de un
  transition). Estado visible: "Guardando… / Guardado ✓ / error".
- No hay botón Guardar: un toque por equipo y listo, como pide el feature.
- Si un pronóstico previo tiene más de 10 goles (posible desde la lista), se
  muestra el valor pero ningún chip queda resaltado; al tocar un chip se
  pisa normal.

### Navegación

Botones Anterior (deshabilitado en el primero) y Siguiente, contador
"Partido X de N" y barra de progreso fina. Siguiente en el último partido
lleva a una pantalla final con link de vuelta a la lista.

## Componentes

| Pieza | Archivo | Rol |
|---|---|---|
| Página server | `src/app/(app)/matches/focus/page.tsx` | Trae matches + predictions (igual que `/matches`), filtra editables, pasa datos planos |
| Client component | `src/components/focus-mode.tsx` | Índice actual, selecciones, autosave, navegación |
| Link de entrada | `src/app/(app)/matches/page.tsx` | Botón "Modo Focus" en el header |
| Textos | `src/lib/copy.ts` | Strings nuevos en `copy.focus` (rioplatense) |

## Manejo de errores

- `savePrediction` ya valida con zod y la RLS rechaza si el partido empezó:
  el client muestra el `error` del action state y no marca el partido como
  guardado.
- Sin partidos editables → estado vacío amistoso.

## Verificación

`npm run lint`, `npm run test` y `npm run build` (no hay tests de UI; el
build de Next valida tipos y rutas).
