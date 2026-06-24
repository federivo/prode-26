import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { Last5Cell } from "@/lib/ranking";

/**
 * Franja "Últimos 5": tira segmentada con los puntos de los 5 partidos más
 * recientes, en orden cronológico. Todos los chips comparten alto, ancho mínimo
 * y forma; el único que brilla es el del acierto exacto (relleno dorado). Los
 * en vivo van en rojo con un punto que late; "—" si el jugador no pronosticó.
 */
export function Last5Strip({ cells }: { cells: Last5Cell[] }) {
  if (cells.length === 0) return null;
  return (
    <div className="mt-2.5 flex items-center gap-2.5 border-t border-border/60 pt-2.5">
      <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {copy.ranking.last5Short}
      </span>
      <div className="flex items-center gap-1">
        {cells.map((cell) => (
          <Pill key={cell.matchId} cell={cell} />
        ))}
      </div>
    </div>
  );
}

function pillTitle(c: Last5Cell): string {
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

// Mismo alto/forma para todos los chips: la consistencia es lo que ordena la tira.
const CHIP =
  "field-num inline-flex h-[1.7rem] min-w-[2.05rem] items-center justify-center gap-0.5 rounded-lg px-1.5 text-[0.72rem] font-bold leading-none";

function Pill({ cell }: { cell: Last5Cell }) {
  const title = pillTitle(cell);

  if (!cell.predicted) {
    return (
      <span
        title={title}
        aria-label={title}
        className={cn(CHIP, "border border-dashed border-border/70 text-muted/55")}
      >
        —
      </span>
    );
  }

  const pts = cell.points ?? 0;
  const exact = pts >= 10;
  const positive = pts > 0;
  const label = positive ? `+${pts}` : "0";

  return (
    <span
      title={title}
      aria-label={title}
      className={cn(
        CHIP,
        cell.live
          ? "border border-danger/50 bg-danger/10 text-danger"
          : exact
            ? "bg-gilded text-primary-fg"
            : positive
              ? "bg-primary-soft/70 text-fg ring-1 ring-primary/25"
              : "bg-surface-2 text-muted/80 ring-1 ring-border",
      )}
    >
      {cell.live ? (
        <span className="dot-live h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
      ) : (
        exact && <Star className="h-2.5 w-2.5 shrink-0 fill-current" />
      )}
      {label}
    </span>
  );
}
