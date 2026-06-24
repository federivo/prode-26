# Spec — "Últimos 5" con puntaje en vivo en la tabla de posiciones

**Fecha:** 2026-06-24
**Branch:** `ranking-ultimos-5`

## Qué

En la tabla de un grupo, mostrar para cada jugador los puntos que sumó en los
**últimos 5 partidos** que ya empezaron, **incluyendo los que se están jugando
ahora** (puede haber más de uno en vivo a la vez). Los puntos en vivo son
provisorios y se calculan al vuelo con el marcador actual.

## Decisiones de producto (acordadas)

1. **Standings en vivo.** El total de cada jugador = puntos guardados de
   partidos `FINISHED` + puntos provisorios de **todos** los partidos `IN_PLAY`
   que pronosticó. El orden de la tabla usa ese total y se reordena en vivo.
2. **Ventana = 5 más recientes ya empezados.** Los 5 partidos `IN_PLAY` o
   `FINISHED` más recientes por `kickoff`. Los en vivo entran solos porque son
   los más nuevos. La franja muestra a lo sumo 5; el total sí cuenta todos los
   en vivo aunque queden fuera de la franja.
3. **Lista plana.** Se reemplaza el podio por una única lista rankeada 1..N;
   cada fila muestra el total y, debajo, la franja "Últimos 5".

## Cómo se calcula

Sin cambios de esquema ni escrituras nuevas. `predictions.points_awarded` sigue
siendo nulo mientras el partido está en vivo; los puntos provisorios se computan
en el server con la función pura existente `scorePrediction(pred, { homeScore,
awayScore, winner: null, stage })` — para partidos en vivo `winner` es nulo y el
resultado se deriva del marcador. Al terminar el partido, el `points_awarded`
guardado toma el lugar del provisorio sin saltos.

### Nuevo helper puro `src/lib/ranking.ts`

`buildRanking(members, predictions, recentMatches) → RankingRow[]`. Sin imports
de server-only ni de Supabase, así se testea con Vitest (node). Por jugador:

- `points`: suma de `points_awarded` (partidos `FINISHED`, con *fallback* a
  `scorePrediction` si todavía no se calculó) **+** provisorios de partidos
  `IN_PLAY` con marcador.
- `exact`: solo partidos `FINISHED` con marcador exacto (no cuenta lo en vivo,
  para que el desempate no titile).
- `livePoints`: subtotal provisorio (para el cartelito "+N en vivo").
- `last5`: una celda por cada uno de los `recentMatches` (mismo orden para todos
  los jugadores), con `points` (nulo si no pronosticó), `live`, marcador real y
  pronóstico — para el `title`/tooltip de cada pill.

Orden: `points` desc, `exact` desc, `name.localeCompare(es)`.

## UI

### `src/app/(app)/groups/[id]/ranking/page.tsx`
- `syncIfStale()` (best-effort, ya está) refresca el marcador en vivo en prod.
- Query nueva: 5 partidos recientes (`status in (IN_PLAY, FINISHED)`,
  `home_score not null`, `order kickoff desc limit 5`), invertidos a orden
  cronológico (en vivo a la derecha).
- Query de pronósticos enriquecida: agrega `match_id` y `matches(id, home_score,
  away_score, status, winner, stage)`.
- Llama a `buildRanking(...)` y pasa las filas a `RankingTable`.

### `src/components/ranking-table.tsx` (rework a lista plana)
- Una lista `stagger` de filas 1..N (se retira el podio en esta página).
- Top 3 conservan el aire de podio con anillo `ring-gold/silver/bronze`; el #1
  además con número y total en `text-gilded`. Se conserva el resaltado `(vos)`.
- Cartelito `• +N en vivo` (color `danger` + `dot-live`) cuando el jugador tiene
  puntos provisorios, para explicar por qué se mueve el orden.
- `<AutoRefresh seconds={45} />` (componente existente) cuando hay algo en vivo.

### `src/components/last5-strip.tsx` (nuevo, presentacional)
- Etiqueta corta "Últ. 5" + fila de pills (una por partido reciente).
- Pills reutilizan el sistema de 3 niveles: exacto (10) → `bg-gilded` + estrella;
  parcial (1–9) → `bg-primary-soft/70 ring-primary/30`; cero → `bg-surface-2`.
- **En vivo** pisa el color del nivel con el tratamiento live de la app
  (`border-danger/45 bg-danger/10` + `dot-live`), señal de "provisorio".
- **No pronosticó** → pill "—" tenue (mantiene 5 columnas alineadas).
- Cada pill lleva `title` (ej. `ARG 2-1 MÉX · vos 2-0 · +7 · en vivo`).

### `src/lib/copy.ts`
Strings nuevas en `copy.ranking`: `last5Short` ("Últ. 5"), `liveNote(n)`,
`yourShort`, `liveShort`, `noPredictionShort`; `subtitle` pasa a mencionar "en
vivo".

## Casos borde

- 0 partidos empezados → sin franja, tabla como hoy (estado vacío si nadie sumó).
- < 5 empezados → se muestran los que haya.
- > 5 en vivo simultáneos → la franja igual corta en 5 (los más nuevos); el total
  cuenta todos los en vivo.
- VAR / gol anulado → el pill provisorio se recalcula en el próximo refresh.

## Riesgos / trade-offs aceptados

- El orden salta durante los partidos (propio de "standings en vivo"); se rotula
  "en vivo" para fijar expectativas.
- Localmente, sin `SUPABASE_SERVICE_ROLE_KEY` el marcador en vivo no avanza; se
  puede simular un partido `IN_PLAY` por MCP para verificar.

## Fuera de alcance (YAGNI)

Sin columnas/triggers nuevos, sin guardar puntos en vivo, sin encabezado de
columnas por partido (alcanza el tooltip), sin tocar la página de detalle de
jugador. La cuenta de "Exactos" sigue siendo solo de partidos terminados.

## Verificación

- `npm test` (unit del helper `ranking.ts`: total con/ sin en vivo, ventana,
  desempate, fallback de `points_awarded`, alineación de celdas).
- `npm run lint` y `npm run build`.
- Verificación manual con un partido `IN_PLAY` simulado por MCP.
