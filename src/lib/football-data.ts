import "server-only";
import { createServiceClient, isServiceConfigured } from "@/lib/supabase/service";
import { scorePrediction } from "@/lib/scoring";
import type {
  Match,
  MatchStage,
  MatchStatus,
  MatchWinner,
} from "@/lib/supabase/types";

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC"; // FIFA World Cup

// ── Mapeos desde el formato de football-data.org ──────────────────────────────
const STAGE_MAP: Record<string, MatchStage> = {
  GROUP_STAGE: "GROUP",
  GROUP: "GROUP",
  LAST_32: "LAST_32",
  ROUND_OF_32: "LAST_32",
  LAST_16: "LAST_16",
  ROUND_OF_16: "LAST_16",
  QUARTER_FINALS: "QUARTER_FINAL",
  QUARTER_FINAL: "QUARTER_FINAL",
  SEMI_FINALS: "SEMI_FINAL",
  SEMI_FINAL: "SEMI_FINAL",
  THIRD_PLACE: "THIRD_PLACE",
  FINAL: "FINAL",
};

function mapStatus(s: string): MatchStatus {
  switch (s) {
    case "IN_PLAY":
    case "PAUSED":
    case "SUSPENDED":
      return "IN_PLAY";
    case "FINISHED":
    case "AWARDED":
      return "FINISHED";
    default:
      return "SCHEDULED"; // SCHEDULED, TIMED, POSTPONED, CANCELLED…
  }
}

function mapWinner(w: string | null | undefined): MatchWinner | null {
  if (w === "HOME_TEAM") return "HOME";
  if (w === "AWAY_TEAM") return "AWAY";
  if (w === "DRAW") return "DRAW";
  return null;
}

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  homeTeam: { name: string | null } | null;
  awayTeam: { name: string | null } | null;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
}

// Omitimos predictions_open y manual_result: los maneja el admin, la sync no
// debe pisarlos directamente desde toRow.
type MatchRow = Omit<Match, "id" | "predictions_open" | "manual_result">;

function toRow(m: FDMatch): MatchRow {
  const status = mapStatus(m.status);
  const finished = status === "FINISHED";
  // Guardamos el marcador también en vivo (con la demora del free tier) para
  // mostrarlo. El ganador y los puntos solo cuando el partido termina.
  const hasScore = finished || status === "IN_PLAY";
  return {
    external_id: m.id,
    stage: STAGE_MAP[m.stage] ?? "GROUP",
    home_team: m.homeTeam?.name ?? null,
    away_team: m.awayTeam?.name ?? null,
    kickoff: m.utcDate,
    status,
    home_score: hasScore ? m.score.fullTime.home : null,
    away_score: hasScore ? m.score.fullTime.away : null,
    winner: finished ? mapWinner(m.score.winner) : null,
    updated_at: new Date().toISOString(),
  };
}

export interface SyncResult {
  total: number;
  finished: number;
  scored: number;
}

/**
 * Trae los partidos del Mundial desde football-data.org, los upsertea, y
 * recalcula los puntos de los pronósticos de los partidos terminados.
 * SOLO server-only: usa la service-role key (saltea RLS).
 */
export async function syncMatches(): Promise<SyncResult> {
  if (!isServiceConfigured()) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY (revisá tu .env.local).",
    );
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("Falta FOOTBALL_DATA_API_KEY");

  const res = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches`, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `football-data.org respondió ${res.status}: ${await res.text()}`,
    );
  }

  const data = (await res.json()) as { matches: FDMatch[] };
  const rows = (data.matches ?? []).map(toRow);

  const supabase = createServiceClient();

  // Resultados cargados a mano: no los pisamos hasta que la API tenga el suyo.
  const { data: existing } = await supabase
    .from("matches")
    .select("external_id, manual_result")
    .in(
      "external_id",
      rows.map((r) => r.external_id),
    );
  const manualPending = new Set(
    (existing ?? []).filter((e) => e.manual_result).map((e) => e.external_id),
  );

  // Si la API ya lo dio por FINISHED, su resultado manda (y limpia el flag).
  // Si todavía no terminó y hay un resultado manual, lo salteamos.
  const toUpsert = rows
    .filter((r) => !(r.status !== "FINISHED" && manualPending.has(r.external_id)))
    .map((r) => ({ ...r, manual_result: false }));

  const { error: upsertErr } = await supabase
    .from("matches")
    .upsert(toUpsert, { onConflict: "external_id" });
  if (upsertErr) throw new Error(`Error al guardar partidos: ${upsertErr.message}`);

  // Marca de tiempo de sincronización.
  await supabase
    .from("sync_state")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", true);

  // Recalcular puntos de los partidos terminados.
  const finishedExternalIds = rows
    .filter((r) => r.status === "FINISHED" && r.home_score !== null)
    .map((r) => r.external_id);

  const scored = await rescoreFinishedMatches(finishedExternalIds);

  return {
    total: rows.length,
    finished: finishedExternalIds.length,
    scored,
  };
}

const STALE_MS = 15 * 60 * 1000; // 15 minutos
const LIVE_STALE_MS = 90 * 1000; // 90 s mientras hay un partido en vivo

/**
 * Sincroniza si pasó la ventana de frescura desde la última vez. Pensado para
 * llamarse al renderizar /partidos, la tabla, grupos y la home. Si hay un
 * partido en vivo, sincroniza más seguido (cada ~90 s) para seguir el resultado.
 * No lanza: si falla, la página igual se muestra con lo que haya en la DB.
 */
export async function syncIfStale(): Promise<void> {
  // Sin service-role key (p. ej. dev local recién clonado) no hay sync posible:
  // mostramos lo que haya en la DB sin ensuciar la consola con errores.
  if (!isServiceConfigured()) return;

  try {
    const supabase = createServiceClient();
    const [{ data: sync }, { data: live }] = await Promise.all([
      supabase.from("sync_state").select("last_synced_at").eq("id", true).maybeSingle(),
      supabase.from("matches").select("id").eq("status", "IN_PLAY").limit(1),
    ]);

    const last = sync?.last_synced_at ? new Date(sync.last_synced_at).getTime() : 0;
    const window = live && live.length > 0 ? LIVE_STALE_MS : STALE_MS;
    if (Date.now() - last < window) return;

    await syncMatches();
  } catch (err) {
    console.error("syncIfStale falló:", err);
  }
}

/** Recalcula points_awarded para los pronósticos de los partidos dados. */
async function rescoreFinishedMatches(externalIds: number[]): Promise<number> {
  if (externalIds.length === 0) return 0;
  const supabase = createServiceClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("external_id", externalIds)
    .eq("status", "FINISHED");
  if (!matches || matches.length === 0) return 0;

  const matchIds = matches.map((m) => m.id);
  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .in("match_id", matchIds);
  if (!predictions || predictions.length === 0) return 0;

  const byId = new Map(matches.map((m) => [m.id, m]));
  let updated = 0;

  for (const p of predictions) {
    const m = byId.get(p.match_id);
    if (!m || m.home_score === null || m.away_score === null) continue;

    const points = scorePrediction(
      { homeScore: p.home_score, awayScore: p.away_score },
      {
        stage: m.stage,
        homeScore: m.home_score,
        awayScore: m.away_score,
        winner: m.winner,
      },
    );

    if (points !== p.points_awarded) {
      await supabase
        .from("predictions")
        .update({ points_awarded: points })
        .eq("id", p.id);
      updated++;
    }
  }

  return updated;
}
