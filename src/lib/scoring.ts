import type { MatchStage, MatchWinner } from "@/lib/supabase/types";

/**
 * Multiplicador de puntos por fase. En las fases finales los aciertos valen más.
 * Fácil de ajustar si querés cambiar el peso de cada ronda.
 */
export const STAGE_MULTIPLIER: Record<MatchStage, number> = {
  GROUP: 1,
  LAST_32: 2,
  LAST_16: 2,
  QUARTER_FINAL: 3,
  SEMI_FINAL: 3,
  THIRD_PLACE: 2,
  FINAL: 4,
};

/** Puntos base. */
export const EXACT_POINTS = 3;
export const OUTCOME_POINTS = 1;

/** Resultado (ganador/empate) a partir del marcador. */
export function outcomeFromScore(home: number, away: number): MatchWinner {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

export interface MatchResult {
  stage: MatchStage;
  homeScore: number;
  awayScore: number;
  /**
   * Ganador oficial. En partidos de eliminación definidos por penales, refleja
   * al que avanza. Si no se pasa, se deriva del marcador.
   */
  winner?: MatchWinner | null;
}

export interface PredictionInput {
  homeScore: number;
  awayScore: number;
}

/**
 * Calcula los puntos de un pronóstico contra el resultado final de un partido.
 *
 *  - Resultado exacto (mismo marcador)        → 3 × multiplicador de fase
 *  - Acierta el ganador/empate (no el exacto) → 1 × multiplicador de fase
 *  - No acierta                               → 0
 *
 * El acierto exacto compara el marcador a tiempo completo. El acierto de
 * resultado usa el ganador oficial (incluye penales en eliminatorias).
 */
export function scorePrediction(
  prediction: PredictionInput,
  match: MatchResult,
): number {
  const multiplier = STAGE_MULTIPLIER[match.stage] ?? 1;

  const isExact =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore;
  if (isExact) return EXACT_POINTS * multiplier;

  const actualOutcome =
    match.winner ?? outcomeFromScore(match.homeScore, match.awayScore);
  const predictedOutcome = outcomeFromScore(
    prediction.homeScore,
    prediction.awayScore,
  );

  if (predictedOutcome === actualOutcome) return OUTCOME_POINTS * multiplier;

  return 0;
}
