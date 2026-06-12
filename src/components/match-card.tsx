import { Lock, Star } from "lucide-react";
import type { Match, Prediction } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";
import { cn, formatTime } from "@/lib/utils";
import { Flag } from "@/components/flag";
import { Countdown } from "@/components/countdown";
import { PredictionInput } from "@/components/prediction-input";

export function MatchCard({
  match,
  prediction,
}: {
  match: Match;
  prediction: Prediction | null;
}) {
  const started =
    match.status !== "SCHEDULED" || new Date(match.kickoff) <= new Date();
  // El admin puede "abrir" un partido ya jugado para que cargues tu pronóstico.
  const editable = !started || match.predictions_open;
  const finished = match.status === "FINISHED" && match.home_score !== null;
  const live = match.status === "IN_PLAY" && match.home_score !== null;
  const isFinal = match.stage === "FINAL";
  const knockout = match.stage !== "GROUP";

  return (
    <article
      className={cn(
        "gilded-edge relative overflow-hidden rounded-2xl border bg-surface p-4 shadow-[var(--shadow-soft)] transition-colors",
        isFinal ? "border-primary/45" : "border-border",
      )}
    >
      {isFinal && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-20 h-32 bg-primary/10 blur-2xl"
        />
      )}

      {/* Encabezado: fase + horario/estado */}
      <div className="relative mb-4 flex items-start justify-between gap-2">
        <StageChip stage={match.stage} highlight={knockout} final={isFinal} />
        <StatusInfo
          match={match}
          locked={!editable && match.status === "SCHEDULED"}
        />
      </div>

      {/* Equipos con el marcador / vs al centro */}
      <div className="relative flex items-center gap-2.5">
        <Team name={match.home_team} side="home" />
        <div className="flex shrink-0 justify-center px-2">
          {finished || live ? (
            <ScoreChip
              home={match.home_score!}
              away={match.away_score!}
              live={live}
            />
          ) : (
            <span className="font-display text-sm font-medium italic text-muted">
              {copy.common.vs}
            </span>
          )}
        </div>
        <Team name={match.away_team} side="away" />
      </div>

      {/* Control: input editable, pronóstico cerrado, o resultado final */}
      {editable ? (
        <div className="relative mt-4 flex flex-col items-center gap-2">
          {match.predictions_open && started && (
            <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-xs font-medium text-accent">
              {copy.matches.openHint}
            </span>
          )}
          <PredictionInput
            matchId={match.id}
            initialHome={prediction?.home_score ?? null}
            initialAway={prediction?.away_score ?? null}
          />
        </div>
      ) : finished ? (
        <FinishedFooter prediction={prediction} />
      ) : (
        <div className="mt-3.5 flex justify-center">
          <LockedPrediction prediction={prediction} />
        </div>
      )}
    </article>
  );
}

function Team({ name, side }: { name: string | null; side: "home" | "away" }) {
  const label = name ?? "A definir";
  const flag = <Flag name={name} size={34} />;
  const text = (
    <span
      className={cn(
        "truncate text-[0.95rem] font-semibold tracking-tight",
        !name && "text-muted",
      )}
    >
      {label}
    </span>
  );
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5",
        side === "home" ? "justify-end text-right" : "justify-start text-left",
      )}
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

function ScoreChip({
  home,
  away,
  live = false,
}: {
  home: number;
  away: number;
  live?: boolean;
}) {
  return (
    <span
      className={cn(
        "field-num flex items-center gap-1.5 rounded-xl border px-3 py-1 font-display text-xl font-semibold leading-none",
        live
          ? "border-danger/45 bg-danger/10 text-fg"
          : "border-border bg-surface-2 text-fg",
      )}
    >
      <span>{home}</span>
      <span className="text-muted">-</span>
      <span>{away}</span>
    </span>
  );
}

function StageChip({
  stage,
  highlight,
  final,
}: {
  stage: string;
  highlight: boolean;
  final: boolean;
}) {
  const label = final ? "La Final" : (copy.stages[stage] ?? stage);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em]",
        highlight
          ? "bg-primary-soft/60 text-fg ring-1 ring-primary/35"
          : "bg-surface-2 text-muted",
      )}
    >
      {final && <Star className="h-3 w-3 fill-primary text-primary" />}
      {label}
    </span>
  );
}

function StatusInfo({ match, locked }: { match: Match; locked: boolean }) {
  if (match.status === "IN_PLAY") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
        <span className="dot-live h-1.5 w-1.5 rounded-full bg-danger" />
        En vivo
      </span>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="field-num flex items-center gap-1 text-xs font-medium text-muted">
        {formatTime(match.kickoff)}
        {locked && <Lock className="h-3 w-3" />}
      </span>
      {match.status === "SCHEDULED" && <Countdown kickoff={match.kickoff} />}
    </div>
  );
}

function LockedPrediction({ prediction }: { prediction: Prediction | null }) {
  return (
    <span className="field-num inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-sm text-muted">
      <Lock className="h-3 w-3" />
      {prediction
        ? `${copy.matches.yourPrediction}: ${prediction.home_score} - ${prediction.away_score}`
        : copy.matches.noPrediction}
    </span>
  );
}

function FinishedFooter({ prediction }: { prediction: Prediction | null }) {
  return (
    <div className="mt-3.5 flex items-center justify-center gap-2 border-t border-border pt-3 text-sm">
      {prediction ? (
        <>
          <span className="text-muted">
            {copy.matches.yourPrediction}:{" "}
            <span className="field-num font-semibold text-fg">
              {prediction.home_score}-{prediction.away_score}
            </span>
          </span>
          <PointsBadge points={prediction.points_awarded ?? 0} />
        </>
      ) : (
        <span className="text-muted">{copy.matches.noPrediction}</span>
      )}
    </div>
  );
}

function PointsBadge({ points }: { points: number }) {
  const exact = points >= 10;
  const positive = points > 0;
  return (
    <span
      className={cn(
        "field-num inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
        exact
          ? "bg-gilded text-primary-fg shadow-[var(--shadow-gold)]"
          : positive
            ? "bg-primary-soft/70 text-fg ring-1 ring-primary/30"
            : "bg-surface-2 text-muted",
      )}
    >
      {exact && <Star className="h-3 w-3 fill-current" />}
      {positive ? "+" : ""}
      {copy.matches.points(points)}
    </span>
  );
}
