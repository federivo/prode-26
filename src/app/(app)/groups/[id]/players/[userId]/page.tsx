import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { copy } from "@/lib/copy";
import { formatKickoff } from "@/lib/utils";
import { flagEmoji } from "@/lib/flags";
import { Avatar } from "@/components/avatar";
import type { MatchStage, MatchStatus, MatchWinner } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface PredWithMatch {
  home_score: number;
  away_score: number;
  points_awarded: number | null;
  matches: {
    id: string;
    stage: MatchStage;
    home_team: string | null;
    away_team: string | null;
    kickoff: string;
    status: MatchStatus;
    home_score: number | null;
    away_score: number | null;
    winner: MatchWinner | null;
  } | null;
}

/** ¿El partido ya empezó? (sus pronósticos ya están "materializados"). */
function hasStarted(status: MatchStatus, kickoff: string): boolean {
  return status !== "SCHEDULED" || new Date(kickoff).getTime() <= Date.now();
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  await requireSession();
  const supabase = await createClient();

  // RLS: el grupo solo es visible si sos miembro.
  const { data: league } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!league) notFound();

  // Perfil del jugador (RLS: visible si comparten grupo).
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) notFound();

  // Pronósticos del jugador. RLS solo devuelve los de partidos ya empezados.
  const { data: preds } = await supabase
    .from("predictions")
    .select(
      "home_score, away_score, points_awarded, matches(id, stage, home_team, away_team, kickoff, status, home_score, away_score, winner)",
    )
    .eq("user_id", userId);

  const items = ((preds ?? []) as unknown as PredWithMatch[])
    .filter((p) => p.matches && hasStarted(p.matches.status, p.matches.kickoff))
    .sort(
      (a, b) =>
        new Date(b.matches!.kickoff).getTime() -
        new Date(a.matches!.kickoff).getTime(),
    );

  const total = items.reduce((s, p) => s + (p.points_awarded ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href={`/groups/${id}/ranking`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
          {copy.player.backToRanking}
        </Link>

        <div className="flex items-center gap-3">
          <Avatar url={profile.avatar_url} name={profile.display_name} size={52} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="text-sm text-muted">
              {copy.player.totalPoints(total)} · {copy.player.subtitle}
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          {copy.player.empty}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((p) => (
            <PlayerPredictionRow key={p.matches!.id} pred={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerPredictionRow({ pred }: { pred: PredWithMatch }) {
  const m = pred.matches!;
  const finished = m.status === "FINISHED" && m.home_score !== null;
  const points = pred.points_awarded ?? 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{copy.stages[m.stage] ?? m.stage}</span>
        <span>{formatKickoff(m.kickoff)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="flex min-w-0 items-center justify-end gap-1.5 text-right font-medium">
          {flagEmoji(m.home_team) && (
            <span className="shrink-0">{flagEmoji(m.home_team)}</span>
          )}
          <span className="truncate">{m.home_team ?? "?"}</span>
        </span>

        <span className="field-num shrink-0 rounded-lg bg-fg px-2.5 py-0.5 text-sm font-bold text-bg">
          {finished ? `${m.home_score} - ${m.away_score}` : "vs"}
        </span>

        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <span className="truncate">{m.away_team ?? "?"}</span>
          {flagEmoji(m.away_team) && (
            <span className="shrink-0">{flagEmoji(m.away_team)}</span>
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 border-t border-border pt-2 text-sm">
        <span className="text-muted">
          {copy.player.prediction}: {pred.home_score}-{pred.away_score}
        </span>
        {finished && (
          <span
            className={
              points > 0
                ? "rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg"
                : "rounded-full bg-border px-2 py-0.5 text-xs font-semibold text-muted"
            }
          >
            {points > 0 ? "+" : ""}
            {copy.matches.points(points)}
          </span>
        )}
      </div>
    </div>
  );
}
