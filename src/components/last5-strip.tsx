import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { Last5Cell } from "@/lib/ranking";

/**
 * Franja "Últimos 5": una grilla de bloques idénticos (uno por partido, en orden
 * cronológico). Cada bloque muestra los puntos centrados; el color codifica la
 * categoría y el número el valor exacto. El acierto exacto va en dorado. El
 * partido en juego se distingue porque el bloque está inclinado y enmarcado en
 * rojo (un bloque "torcido" salta entre los demás, que están derechos); un
 * bloque vacío punteado si el jugador no pronosticó.
 */
export function Last5Strip({ cells }: { cells: Last5Cell[] }) {
  if (cells.length === 0) return null;
  return (
    <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
      <span className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted/80">
        {copy.ranking.last5Short}
      </span>
      <div className="flex items-center gap-2">
        {cells.map((cell) => (
          <Block key={cell.matchId} cell={cell} />
        ))}
      </div>
    </div>
  );
}

function blockTitle(c: Last5Cell): string {
  const home = c.homeTeam ?? "?";
  const away = c.awayTeam ?? "?";
  const score = `${c.actualHome ?? "-"}-${c.actualAway ?? "-"}`;
  const game = `${home} ${score} ${away}`;
  if (!c.predicted) return `${game} · ${copy.ranking.noPredictionShort}`;
  const mine = `${copy.ranking.yourShort} ${c.predHome}-${c.predAway}`;
  const pts = c.points && c.points > 0 ? `+${c.points}` : "0";
  const liveTag = c.live ? ` · ${copy.ranking.liveShort}` : "";
  return `${game} · ${mine} · ${pts}${liveTag}`;
}

// Bloque idéntico para todos los partidos: la grilla pareja es lo que ordena la tira.
const BLOCK =
  "relative inline-flex h-8 w-8 items-center justify-center rounded-lg field-num font-display text-sm font-semibold leading-none";

function Block({ cell }: { cell: Last5Cell }) {
  const title = blockTitle(cell);

  if (!cell.predicted) {
    return (
      <span
        title={title}
        aria-label={title}
        className={cn(BLOCK, "border border-dashed border-border text-muted/40")}
      >
        –
      </span>
    );
  }

  const pts = cell.points ?? 0;
  const exact = pts >= 10;
  const positive = pts > 0;

  if (cell.live) {
    // "En vivo": el bloque se inclina y se enmarca en rojo. Un bloque torcido
    // entre los demás (derechos) es el diferenciador, sin íconos encima.
    return (
      <span
        title={title}
        aria-label={title}
        className={cn(
          BLOCK,
          "-rotate-6 border-2 border-danger bg-danger/12 text-fg ring-1 ring-danger/25",
        )}
      >
        {pts}
      </span>
    );
  }

  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        BLOCK,
        exact
          ? "bg-gilded text-primary-fg"
          : positive
            ? "bg-primary-soft text-fg ring-1 ring-primary/20"
            : "bg-surface-2 text-muted ring-1 ring-border/70",
      )}
    >
      {pts}
    </span>
  );
}
