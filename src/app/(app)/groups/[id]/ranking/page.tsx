import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { syncIfStale } from "@/lib/football-data";
import { copy } from "@/lib/copy";
import { RankingTable, type RankingRow } from "@/components/ranking-table";

export const dynamic = "force-dynamic";

interface PredRow {
  user_id: string;
  home_score: number;
  away_score: number;
  points_awarded: number | null;
  matches: {
    home_score: number | null;
    away_score: number | null;
    status: string;
  } | null;
}

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

  // Pronósticos de los miembros junto al resultado del partido (para puntos y exactos).
  const { data: preds } = await supabase
    .from("predictions")
    .select("user_id, home_score, away_score, points_awarded, matches(home_score, away_score, status)")
    .in("user_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

  const agg = new Map<string, { points: number; exact: number }>();
  for (const id of memberIds) agg.set(id, { points: 0, exact: 0 });

  for (const p of (preds ?? []) as unknown as PredRow[]) {
    const a = agg.get(p.user_id);
    if (!a) continue;
    a.points += p.points_awarded ?? 0;
    const m = p.matches;
    if (
      m &&
      m.status === "FINISHED" &&
      m.home_score === p.home_score &&
      m.away_score === p.away_score
    ) {
      a.exact += 1;
    }
  }

  const rows: RankingRow[] = memberIds
    .map((uid) => ({
      userId: uid,
      name: profileById.get(uid)?.name ?? "Jugador",
      avatarUrl: profileById.get(uid)?.avatarUrl ?? null,
      points: agg.get(uid)?.points ?? 0,
      exact: agg.get(uid)?.exact ?? 0,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.exact - a.exact ||
        a.name.localeCompare(b.name, "es"),
    );

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
        <h1 className="text-2xl font-bold tracking-tight">{league.name}</h1>
        <p className="mt-1 text-sm text-muted">{copy.ranking.subtitle}</p>
      </div>

      <RankingTable rows={rows} currentUserId={session.userId} groupId={id} />
    </div>
  );
}
