import { scorePrediction } from "@/lib/scoring";
import type { MatchStage, MatchStatus, MatchWinner } from "@/lib/supabase/types";

/**
 * Armado de la tabla de posiciones con puntaje en vivo y la franja "Últimos 5".
 *
 * Mantenido puro (sin Supabase ni server-only) para poder testearlo. Los puntos
 * en vivo son provisorios: se calculan al vuelo con el marcador actual usando
 * `scorePrediction`. Cuando el partido termina, el `points_awarded` guardado
 * toma el lugar del provisorio.
 */

const LIVE: MatchStatus = "IN_PLAY";
const FINISHED: MatchStatus = "FINISHED";

export interface RankingMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

/** Estado real de un partido (del resultado, no del pronóstico). */
export interface RankingMatch {
  id: string;
  homeTeam: string | null;
  awayTeam: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  winner: MatchWinner | null;
  stage: MatchStage;
}

/** Pronóstico de un miembro junto al estado del partido al que apunta. */
export interface RankingPrediction {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsAwarded: number | null;
  match: RankingMatch | null;
}

/** Una celda de la franja "Últimos 5" (un partido, para un jugador). */
export interface Last5Cell {
  matchId: string;
  homeTeam: string | null;
  awayTeam: string | null;
  live: boolean;
  predicted: boolean;
  predHome: number | null;
  predAway: number | null;
  actualHome: number | null;
  actualAway: number | null;
  /** Puntos del partido para este jugador; null si no pronosticó. */
  points: number | null;
}

export interface RankingRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  /** Total incluyendo puntos provisorios de partidos en vivo. */
  points: number;
  /** Solo partidos terminados (no cuenta lo en vivo). */
  exact: number;
  /** Subtotal provisorio de los partidos en vivo. */
  livePoints: number;
  /** Una celda por cada partido reciente, en el mismo orden para todos. */
  last5: Last5Cell[];
}

/** Puntos de un pronóstico contra el marcador de un partido (en vivo o final). */
function pointsFor(
  predHome: number,
  predAway: number,
  match: RankingMatch,
): number {
  if (match.homeScore === null || match.awayScore === null) return 0;
  return scorePrediction(
    { homeScore: predHome, awayScore: predAway },
    {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winner: match.winner,
      stage: match.stage,
    },
  );
}

export function buildRanking(
  members: RankingMember[],
  predictions: RankingPrediction[],
  recentMatches: RankingMatch[],
): RankingRow[] {
  const predsByUser = new Map<string, RankingPrediction[]>();
  for (const p of predictions) {
    const list = predsByUser.get(p.userId);
    if (list) list.push(p);
    else predsByUser.set(p.userId, [p]);
  }

  // Para los partidos visibles en la franja, el dato autoritativo es el de
  // `recentMatches`: lo usamos también para el total así el subtotal y los pills
  // no se contradicen si el estado del partido cambió entre las dos queries.
  const recentById = new Map(recentMatches.map((rm) => [rm.id, rm]));

  const rows: RankingRow[] = members.map((mem) => {
    const preds = predsByUser.get(mem.userId) ?? [];
    const predByMatch = new Map<string, RankingPrediction>();

    let points = 0;
    let exact = 0;
    let livePoints = 0;

    for (const p of preds) {
      predByMatch.set(p.matchId, p);
      const m = recentById.get(p.matchId) ?? p.match;
      if (!m) continue;

      if (m.status === FINISHED) {
        // Puntos oficiales; fallback al cálculo si todavía no se guardaron.
        const pts = p.pointsAwarded ?? pointsFor(p.homeScore, p.awayScore, m);
        points += pts;
        if (m.homeScore === p.homeScore && m.awayScore === p.awayScore) {
          exact += 1;
        }
      } else if (m.status === LIVE) {
        const pts = pointsFor(p.homeScore, p.awayScore, m);
        points += pts;
        livePoints += pts;
      }
    }

    const last5: Last5Cell[] = recentMatches.map((rm) => {
      const p = predByMatch.get(rm.id);
      const live = rm.status === LIVE;
      const base = {
        matchId: rm.id,
        homeTeam: rm.homeTeam,
        awayTeam: rm.awayTeam,
        live,
        actualHome: rm.homeScore,
        actualAway: rm.awayScore,
      };
      if (!p) {
        return {
          ...base,
          predicted: false,
          predHome: null,
          predAway: null,
          points: null,
        };
      }
      const pts =
        rm.status === FINISHED
          ? p.pointsAwarded ?? pointsFor(p.homeScore, p.awayScore, rm)
          : pointsFor(p.homeScore, p.awayScore, rm);
      return {
        ...base,
        predicted: true,
        predHome: p.homeScore,
        predAway: p.awayScore,
        points: pts,
      };
    });

    return {
      userId: mem.userId,
      name: mem.name,
      avatarUrl: mem.avatarUrl,
      points,
      exact,
      livePoints,
      last5,
    };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.exact - a.exact ||
      a.name.localeCompare(b.name, "es"),
  );

  return rows;
}
