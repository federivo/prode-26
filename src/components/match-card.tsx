import { Lock } from "lucide-react";
import type { Match, Prediction } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";
import { cn, formatTime } from "@/lib/utils";
import { flagEmoji } from "@/lib/flags";
import { PredictionInput } from "@/components/prediction-input";

export function MatchCard({
  match,
  prediction,
}: {
  match: Match;
  prediction: Prediction | null;
}) {
  const locked =
    match.status !== "SCHEDULED" || new Date(match.kickoff) <= new Date();
  const finished = match.status === "FINISHED" && match.home_score !== null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Encabezado: fase + horario/estado */}
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>{copy.stages[match.stage] ?? match.stage}</span>
        <span className="flex items-center gap-1">
          {match.status === "IN_PLAY" ? (
            <span className="font-medium text-danger">● EN VIVO</span>
          ) : (
            formatTime(match.kickoff)
          )}
          {locked && match.status === "SCHEDULED" && <Lock className="h-3 w-3" />}
        </span>
      </div>

      {/* Equipos: cada nombre con su bandera, a lo ancho de la tarjeta */}
      <div className="flex items-center gap-2">
        <Team name={match.home_team} side="home" />
        <div className="shrink-0 px-1">
          {finished ? (
            <ScoreChip home={match.home_score!} away={match.away_score!} />
          ) : (
            <span className="text-xs font-medium text-muted">{copy.common.vs}</span>
          )}
        </div>
        <Team name={match.away_team} side="away" />
      </div>

      {/* Control: input editable, pronóstico cerrado, o resultado final */}
      {finished ? (
        <FinishedFooter prediction={prediction} />
      ) : locked ? (
        <div className="mt-3 flex justify-center">
          <LockedPrediction prediction={prediction} />
        </div>
      ) : (
        <div className="mt-3 flex justify-center">
          <PredictionInput
            matchId={match.id}
            initialHome={prediction?.home_score ?? null}
            initialAway={prediction?.away_score ?? null}
          />
        </div>
      )}
    </div>
  );
}

function Team({ name, side }: { name: string | null; side: "home" | "away" }) {
  const label = name ?? "A definir";
  const flag = flagEmoji(name);
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        side === "home" ? "justify-end text-right" : "justify-start text-left",
      )}
    >
      {flag && <span className="shrink-0 text-lg leading-none">{flag}</span>}
      <span className="truncate font-semibold">{label}</span>
    </div>
  );
}

function ScoreChip({ home, away }: { home: number; away: number }) {
  return (
    <span className="field-num rounded-lg bg-fg px-3 py-1 text-base font-bold text-bg">
      {home} - {away}
    </span>
  );
}

function LockedPrediction({ prediction }: { prediction: Prediction | null }) {
  return (
    <span className="field-num rounded-lg border border-border px-3 py-1 text-sm text-muted">
      {prediction
        ? `${copy.matches.yourPrediction}: ${prediction.home_score} - ${prediction.away_score}`
        : copy.matches.noPrediction}
    </span>
  );
}

function FinishedFooter({ prediction }: { prediction: Prediction | null }) {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-2.5 text-sm">
      {prediction ? (
        <>
          <span className="text-muted">
            {copy.matches.yourPrediction}: {prediction.home_score}-
            {prediction.away_score}
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
  const positive = points > 0;
  return (
    <span
      className={
        positive
          ? "rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg"
          : "rounded-full bg-border px-2 py-0.5 text-xs font-semibold text-muted"
      }
    >
      {positive ? "+" : ""}
      {copy.matches.points(points)}
    </span>
  );
}
