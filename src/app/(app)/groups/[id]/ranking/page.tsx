import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { syncIfStale } from "@/lib/football-data";
import { copy } from "@/lib/copy";
import { RankingTable } from "@/components/ranking-table";
import {
  buildRanking,
  type RankingMatch,
  type RankingMember,
  type RankingPrediction,
} from "@/lib/ranking";
import type {
  MatchStage,
  MatchStatus,
  MatchWinner,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  await syncIfStale();

  const supabase = await createClient();

  // RLS: solo devuelve el grupo si sos miembro.
  const { data: league } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!league) notFound();

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, profiles(display_name, avatar_url)")
    .eq("league_id", id);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const profileById = new Map<
    string,
    { name: string; avatarUrl: string | null }
  >(
    (members ?? []).map((m) => {
      const p = m.profiles as unknown as {
        display_name: string;
        avatar_url: string | null;
      } | null;
      return [
        m.user_id,
        { name: p?.display_name || "Jugador", avatarUrl: p?.avatar_url ?? null },
      ];
    }),
  );

  // Los 5 partidos más recientes que ya empezaron (en vivo o terminados).
  const { data: recentRaw } = await supabase
    .from("matches")
    .select(
      "id, home_team, away_team, status, home_score, away_score, winner, stage, kickoff",
    )
    .in("status", ["IN_PLAY", "FINISHED"])
    .not("home_score", "is", null)
    .not("away_score", "is", null)
    .order("kickoff", { ascending: false })
    .limit(5);

  // Cronológico: el más viejo a la izquierda, los en vivo (más nuevos) a la derecha.
  const recentMatches: RankingMatch[] = (recentRaw ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      status: m.status as MatchStatus,
      homeScore: m.home_score,
      awayScore: m.away_score,
      winner: m.winner as MatchWinner | null,
      stage: m.stage as MatchStage,
    }));

  // Pronósticos de los miembros + estado real del partido (puntos y franja).
  const { data: preds } = await supabase
    .from("predictions")
    .select(
      "user_id, match_id, home_score, away_score, points_awarded, matches(id, home_score, away_score, status, winner, stage)",
    )
    .in(
      "user_id",
      memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"],
    );

  const predictions: RankingPrediction[] = (preds ?? []).map((p) => {
    const m = p.matches as unknown as {
      id: string;
      home_score: number | null;
      away_score: number | null;
      status: string;
      winner: string | null;
      stage: string;
    } | null;
    return {
      userId: p.user_id,
      matchId: p.match_id,
      homeScore: p.home_score,
      awayScore: p.away_score,
      pointsAwarded: p.points_awarded,
      match: m
        ? {
            id: m.id,
            homeTeam: null,
            awayTeam: null,
            status: m.status as MatchStatus,
            homeScore: m.home_score,
            awayScore: m.away_score,
            winner: m.winner as MatchWinner | null,
            stage: m.stage as MatchStage,
          }
        : null,
    };
  });

  const rankingMembers: RankingMember[] = memberIds.map((uid) => ({
    userId: uid,
    name: profileById.get(uid)?.name ?? "Jugador",
    avatarUrl: profileById.get(uid)?.avatarUrl ?? null,
  }));

  const rows = buildRanking(rankingMembers, predictions, recentMatches);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/groups"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
          {copy.nav.groups}
        </Link>
        <p className="text-gilded text-xs font-semibold uppercase tracking-[0.18em]">
          {copy.ranking.title}
        </p>
        <h1 className="mt-0.5 font-display text-3xl font-semibold tracking-tight">
          {league.name}
        </h1>
        <p className="mt-1 text-sm text-muted">{copy.ranking.subtitle}</p>
      </div>

      <RankingTable rows={rows} currentUserId={session.userId} groupId={id} />
    </div>
  );
}
