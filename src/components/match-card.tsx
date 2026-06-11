import { Lock } from "lucide-react";
import type { Match, Prediction } from "@/lib/supabase/types";
import { copy } from "@/lib/copy";
import { formatTime } from "@/lib/utils";
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

  const home = match.home_team ?? "A definir";
  const away = match.away_team ?? "A definir";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{copy.stages[match.stage] ?? match.stage}</span>
        <span className="flex items-center gap-1">
          {match.status === "IN_PLAY" && (
            <span className="font-medium text-danger">● EN VIVO</span>
          )}
          {match.status !== "IN_PLAY" && formatTime(match.kickoff)}
          {locked && match.status === "SCHEDULED" && <Lock className="h-3 w-3" />}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="truncate text-right font-medium">{home}</span>

        <div className="flex justify-center">
          {finished ? (
            <ScoreChip home={match.home_score!} away={match.away_score!} />
          ) : locked ? (
            <LockedPrediction prediction={prediction} />
          ) : (
            <PredictionInput
              matchId={match.id}
              initialHome={prediction?.home_score ?? null}
              initialAway={prediction?.away_score ?? null}
            />
          )}
        </div>

        <span className="truncate font-medium">{away}</span>
      </div>

      {/* Pie: tu pronóstico y puntos cuando el partido terminó */}
      {finished && (
        <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-2 text-sm">
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
      )}
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
        ? `${prediction.home_score} - ${prediction.away_score}`
        : copy.matches.noPrediction}
    </span>
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
