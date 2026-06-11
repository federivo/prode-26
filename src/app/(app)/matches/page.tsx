import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { syncIfStale } from "@/lib/football-data";
import { copy } from "@/lib/copy";
import { dayKey, formatDayHeading } from "@/lib/utils";
import { MatchCard } from "@/components/match-card";
import type { Match, Prediction } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const session = await requireSession();

  // Revalidación perezosa: trae resultados nuevos si pasaron +15 min.
  await syncIfStale();

  const supabase = await createClient();
  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff", { ascending: true }),
    supabase
      .from("predictions")
      .select("*")
      .eq("user_id", session.userId),
  ]);

  const predByMatch = new Map<string, Prediction>(
    (predictions ?? []).map((p) => [p.match_id, p]),
  );

  // Agrupar por día (horario de Argentina).
  const groups: { day: string; label: string; matches: Match[] }[] = [];
  for (const m of matches ?? []) {
    const key = dayKey(m.kickoff);
    let group = groups.at(-1);
    if (!group || group.day !== key) {
      group = { day: key, label: formatDayHeading(m.kickoff), matches: [] };
      groups.push(group);
    }
    group.matches.push(m);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.matches.title}</h1>
        <p className="mt-1 text-sm text-muted">{copy.matches.subtitle}</p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          {copy.matches.empty}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.day} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted">{group.label}</h2>
            <div className="flex flex-col gap-2">
              {group.matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  prediction={predByMatch.get(m.id) ?? null}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
