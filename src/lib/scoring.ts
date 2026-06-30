import type { MatchStage, MatchWinner } from "@/lib/supabase/types";

/**
 * Sistema de puntos (plano, sin multiplicador por fase):
 *  - Resultado exacto.................................. 10
 *  - Acierta ganador/empate + goles de un equipo......  7
 *  - Acierta ganador/empate...........................  5
 *  - Solo acierta los goles de un equipo..............  2
 *  - No acierta nada / sin pronóstico.................  0
 */
export const POINTS = {
  EXACT: 10,
  OUTCOME_ONE_SIDE: 7,
  OUTCOME: 5,
  ONE_SIDE: 2,
  NONE: 0,
} as const;

/** Resultado (ganador/empate) a partir del marcador. */
export function outcomeFromScore(home: number, away: number): MatchWinner {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

export interface MatchResult {
  /** Ya no se usa para el puntaje; se mantiene por compatibilidad con los callers. */
  stage?: MatchStage;
  homeScore: number;
  awayScore: number;
  /**
   * Ganador oficial del cruce (en eliminatorias por penales, el que avanza).
   * NO se usa para el puntaje: el resultado se computa siempre a partir del
   * marcador. Un 1-1 definido por penales puntúa como empate. Se mantiene por
   * compatibilidad con los callers.
   */
  winner?: MatchWinner | null;
}

export interface PredictionInput {
  homeScore: number;
  awayScore: number;
}

/**
 * Calcula los puntos de un pronóstico contra el resultado final del partido.
 * Tanto el acierto exacto como el de resultado usan el marcador (a tiempo
 * completo o tiempo extra). Los penales NO cuentan: un 1-1 definido por penales
 * se evalúa como empate.
 */
export function scorePrediction(
  prediction: PredictionInput,
  match: MatchResult,
): number {
  const exactHome = prediction.homeScore === match.homeScore;
  const exactAway = prediction.awayScore === match.awayScore;

  // Resultado exacto (ambos goles).
  if (exactHome && exactAway) return POINTS.EXACT;

  const actualOutcome = outcomeFromScore(match.homeScore, match.awayScore);
  const predictedOutcome = outcomeFromScore(
    prediction.homeScore,
    prediction.awayScore,
  );
  const outcomeMatch = predictedOutcome === actualOutcome;

  // Acá, como mucho, uno de los dos lados coincide (ambos sería exacto).
  const oneSide = exactHome || exactAway;

  if (outcomeMatch) return oneSide ? POINTS.OUTCOME_ONE_SIDE : POINTS.OUTCOME;
  return oneSide ? POINTS.ONE_SIDE : POINTS.NONE;
}
