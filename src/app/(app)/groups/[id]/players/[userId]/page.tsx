import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { copy } from "@/lib/copy";
import { cn, formatKickoff } from "@/lib/utils";
import { Flag } from "@/components/flag";
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
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/groups/${id}/ranking`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
          {copy.player.backToRanking}
        </Link>

        <div className="gilded-edge relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
          <Avatar
            url={profile.avatar_url}
            name={profile.display_name}
            size={60}
            className="ring-2 ring-primary/30 ring-offset-2 ring-offset-bg"
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
              {profile.display_name}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-sm text-muted">
              <span className="field-num text-gilded font-display text-lg font-semibold">
                {copy.player.totalPoints(total)}
              </span>
              <span>· {copy.player.subtitle}</span>
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {copy.player.empty}
        </p>
      ) : (
        <div className="stagger flex flex-col gap-2.5">
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
  const exact = points >= 10;

  return (
    <article className="gilded-edge relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-semibold uppercase tracking-[0.08em] text-muted">
          {copy.stages[m.stage] ?? m.stage}
        </span>
        <span className="field-num text-muted">{formatKickoff(m.kickoff)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
        <span className="flex min-w-0 items-center justify-end gap-2 text-right text-[0.95rem] font-semibold tracking-tight">
          <span className="truncate">{m.home_team ?? "?"}</span>
          <Flag name={m.home_team} size={28} />
        </span>

        <span className="field-num shrink-0 rounded-xl border border-border bg-surface-2 px-3 py-1 font-display text-lg font-semibold leading-none text-fg">
          {finished ? `${m.home_score} - ${m.away_score}` : copy.common.vs}
        </span>

        <span className="flex min-w-0 items-center gap-2 text-[0.95rem] font-semibold tracking-tight">
          <Flag name={m.away_team} size={28} />
          <span className="truncate">{m.away_team ?? "?"}</span>
        </span>
      </div>

      <div className="mt-3.5 flex items-center justify-center gap-2 border-t border-border pt-3 text-sm">
        <span className="text-muted">
          {copy.player.prediction}:{" "}
          <span className="field-num font-semibold text-fg">
            {pred.home_score}-{pred.away_score}
          </span>
        </span>
        {finished && (
          <span
            className={cn(
              "field-num inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
              exact
                ? "bg-gilded text-primary-fg shadow-[var(--shadow-gold)]"
                : points > 0
                  ? "bg-primary-soft/70 text-fg ring-1 ring-primary/30"
                  : "bg-surface-2 text-muted",
            )}
          >
            {exact && <Star className="h-3 w-3 fill-current" />}
            {points > 0 ? "+" : ""}
            {copy.matches.points(points)}
          </span>
        )}
      </div>
    </article>
  );
}
