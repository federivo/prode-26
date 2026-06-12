import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { requireSession } from "@/lib/session";
import { copy } from "@/lib/copy";
import { formatKickoff } from "@/lib/utils";
import { AdminMatchPicker } from "@/components/admin-match-picker";
import {
  AdminPredictionsForm,
  type AdminUserRow,
} from "@/components/admin-predictions-form";
import type { Match } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function matchLabel(m: Match): string {
  const flag = m.status === "FINISHED" ? "✓ " : m.status === "IN_PLAY" ? "● " : "";
  const score =
    m.home_score !== null ? ` (${m.home_score}-${m.away_score})` : "";
  return `${flag}${m.home_team ?? "?"} vs ${m.away_team ?? "?"}${score} · ${formatKickoff(m.kickoff)}`;
}

export default async function AdminPredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const session = await requireSession();
  if (!session.profile?.is_app_admin) redirect("/groups");

  const { match: selectedId } = await searchParams;

  // Service-role: el admin ve y edita todo, sin las restricciones de RLS.
  const service = createServiceClient();

  const { data: matches } = await service
    .from("matches")
    .select("*")
    .order("kickoff", { ascending: false });

  const options = (matches ?? []).map((m) => ({
    id: m.id,
    label: matchLabel(m),
  }));

  // Por defecto, el partido terminado más reciente (lo más probable a migrar).
  const defaultMatch =
    (matches ?? []).find((m) => m.status === "FINISHED") ?? matches?.[0];
  const matchId = selectedId ?? defaultMatch?.id ?? null;
  const match = (matches ?? []).find((m) => m.id === matchId) ?? null;

  // Todos los jugadores (con nombre cargado).
  const { data: profiles } = await service
    .from("profiles")
    .select("id, display_name, avatar_url")
    .order("display_name");
  const players = (profiles ?? []).filter((p) => p.display_name);

  let rows: AdminUserRow[] = [];
  const finished = !!match && match.status === "FINISHED" && match.home_score !== null;
  if (match) {
    const { data: preds } = await service
      .from("predictions")
      .select("user_id, home_score, away_score, points_awarded")
      .eq("match_id", match.id);
    const byUser = new Map(
      (preds ?? []).map((p) => [p.user_id, p]),
    );
    rows = players.map((p) => {
      const pr = byUser.get(p.id);
      return {
        id: p.id,
        name: p.display_name,
        avatarUrl: p.avatar_url,
        home: pr ? String(pr.home_score) : "",
        away: pr ? String(pr.away_score) : "",
        points: pr?.points_awarded ?? null,
      };
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
          {copy.admin.title}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {copy.admin.editPredictions}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {copy.admin.editPredictionsDesc}
        </p>
      </div>

      <AdminMatchPicker options={options} selected={matchId} />

      {match && (
        <div className="rounded-xl border border-border bg-surface p-3 text-sm">
          <span className="font-medium">
            {match.home_team} vs {match.away_team}
          </span>
          <span className="ml-2 text-muted">
            {finished
              ? `${copy.admin.resultLabel}: ${match.home_score}-${match.away_score}`
              : copy.admin.notFinishedYet}
          </span>
        </div>
      )}

      {match && rows.length > 0 ? (
        <AdminPredictionsForm
          key={match.id}
          matchId={match.id}
          finished={finished}
          users={rows}
        />
      ) : (
        <p className="text-sm text-muted">{copy.admin.pickMatch}</p>
      )}
    </div>
  );
}
