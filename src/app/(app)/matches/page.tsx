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
    <div className="flex flex-col gap-7">
      <header>
        <p className="text-gilded text-xs font-semibold uppercase tracking-[0.18em]">
          Mundial 2026
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {copy.matches.title}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{copy.matches.subtitle}</p>
      </header>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {copy.matches.empty}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.day} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 px-0.5 text-sm font-semibold capitalize tracking-tight text-muted">
              <span className="bg-gilded h-1.5 w-1.5 rounded-full" />
              {group.label}
            </h2>
            <div className="stagger flex flex-col gap-3">
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
