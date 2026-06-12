import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/session";
import { syncIfStale } from "@/lib/football-data";
import { FocusMode } from "@/components/focus-mode";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
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

  // Solo partidos editables (misma regla que MatchCard): todavía no empezaron,
  // o el admin los "abrió" para cargar pronósticos.
  const now = new Date();
  const editable = (matches ?? []).filter(
    (m) =>
      (m.status === "SCHEDULED" && new Date(m.kickoff) > now) ||
      m.predictions_open,
  );

  const initialPredictions = Object.fromEntries(
    (predictions ?? []).map((p) => [
      p.match_id,
      { home: p.home_score, away: p.away_score },
    ]),
  );

  return (
    <FocusMode matches={editable} initialPredictions={initialPredictions} />
  );
}
