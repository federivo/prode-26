import type { Match } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";
import { Flag } from "@/components/flag";
import { AutoRefresh } from "@/components/auto-refresh";

/** Banner de partidos en vivo. No renderiza nada si no hay ninguno. */
export function LiveMatchBanner({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-danger">
        <span className="dot-live h-1.5 w-1.5 rounded-full bg-danger" />
        En vivo
      </div>

      {matches.map((m) => (
        <LiveRow key={m.id} match={m} />
      ))}

      {/* Mientras haya algo en vivo, refresca el marcador solo. */}
      <AutoRefresh seconds={45} />
    </section>
  );
}

function LiveRow({ match }: { match: Match }) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  return (
    <div className="gilded-edge relative overflow-hidden rounded-2xl border border-danger/30 bg-surface p-3.5 shadow-[var(--shadow-soft)]">
      <div className="mb-2 flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.08em]">
        <span className="text-muted">{copy.stages[match.stage] ?? match.stage}</span>
        <span className="flex items-center gap-1.5 text-danger">
          <span className="dot-live h-1.5 w-1.5 rounded-full bg-danger" />
          En vivo
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <Team name={match.home_team} side="home" />
        <span className="field-num flex shrink-0 items-center gap-1.5 rounded-xl border border-danger/40 bg-danger/10 px-3 py-1 font-display text-xl font-semibold leading-none">
          <span>{hasScore ? match.home_score : "–"}</span>
          <span className="text-muted">-</span>
          <span>{hasScore ? match.away_score : "–"}</span>
        </span>
        <Team name={match.away_team} side="away" />
      </div>
    </div>
  );
}

function Team({ name, side }: { name: string | null; side: "home" | "away" }) {
  const label = name ?? "A definir";
  const flag = <Flag name={name} size={30} />;
  const text = (
    <span className="truncate text-sm font-semibold tracking-tight">{label}</span>
  );
  return (
    <div
      className={
        side === "home"
          ? "flex min-w-0 flex-1 items-center justify-end gap-2 text-right"
          : "flex min-w-0 flex-1 items-center justify-start gap-2 text-left"
      }
    >
      {side === "home" ? (
        <>
          {text}
          {flag}
        </>
      ) : (
        <>
          {flag}
          {text}
        </>
      )}
    </div>
  );
}
