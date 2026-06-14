import Link from "next/link";
import { ChevronDown, Crosshair } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { syncIfStale } from "@/lib/football-data";
import { copy } from "@/lib/copy";
import { dayKey, formatDayHeading, todayDayKey } from "@/lib/utils";
import { MatchCard } from "@/components/match-card";
import type { Match, Prediction } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface DayGroup {
  day: string;
  label: string;
  matches: Match[];
}

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
  const groups: DayGroup[] = [];
  for (const m of matches ?? []) {
    const key = dayKey(m.kickoff);
    let group = groups.at(-1);
    if (!group || group.day !== key) {
      group = { day: key, label: formatDayHeading(m.kickoff), matches: [] };
      groups.push(group);
    }
    group.matches.push(m);
  }

  // Hoy + futuro se muestran; los días anteriores van a "Partidos jugados".
  const today = todayDayKey();
  const currentGroups = groups.filter((g) => g.day >= today);
  const pastGroups = groups.filter((g) => g.day < today).reverse(); // más reciente primero
  const pastCount = pastGroups.reduce((n, g) => n + g.matches.length, 0);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gilded text-xs font-semibold uppercase tracking-[0.18em]">
            Mundial 2026
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {copy.matches.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{copy.matches.subtitle}</p>
        </div>
        <Link
          href="/matches/focus"
          className="bg-gilded sheen inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold tracking-tight text-primary-fg shadow-[var(--shadow-gold)] active:translate-y-px"
        >
          <Crosshair className="h-3.5 w-3.5" strokeWidth={2.25} />
          {copy.focus.enter}
        </Link>
      </header>

      {(matches ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {copy.matches.empty}
        </p>
      ) : (
        <>
          {currentGroups.length > 0 ? (
            currentGroups.map((group) => (
              <DaySection key={group.day} group={group} predByMatch={predByMatch} />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              {copy.matches.noUpcoming}
            </p>
          )}

          {pastGroups.length > 0 && (
            <details className="group flex flex-col gap-3" open={currentGroups.length === 0}>
              <summary className="gilded-edge flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] transition-colors hover:bg-surface-2/60">
                <span>{copy.matches.playedTitle(pastCount)}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 flex flex-col gap-7">
                {pastGroups.map((group) => (
                  <DaySection key={group.day} group={group} predByMatch={predByMatch} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function DaySection({
  group,
  predByMatch,
}: {
  group: DayGroup;
  predByMatch: Map<string, Prediction>;
}) {
  return (
    <section className="flex flex-col gap-3">
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
  );
}
