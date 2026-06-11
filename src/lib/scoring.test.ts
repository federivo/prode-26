import { describe, expect, it } from "vitest";
import {
  EXACT_POINTS,
  OUTCOME_POINTS,
  STAGE_MULTIPLIER,
  outcomeFromScore,
  scorePrediction,
} from "./scoring";

describe("outcomeFromScore", () => {
  it("identifica local, visitante y empate", () => {
    expect(outcomeFromScore(2, 1)).toBe("HOME");
    expect(outcomeFromScore(0, 3)).toBe("AWAY");
    expect(outcomeFromScore(1, 1)).toBe("DRAW");
  });
});

describe("scorePrediction — fase de grupos (×1)", () => {
  const stage = "GROUP" as const;

  it("resultado exacto → 3 puntos", () => {
    expect(
      scorePrediction({ homeScore: 2, awayScore: 1 }, { stage, homeScore: 2, awayScore: 1 }),
    ).toBe(EXACT_POINTS);
  });

  it("empate exacto → 3 puntos", () => {
    expect(
      scorePrediction({ homeScore: 1, awayScore: 1 }, { stage, homeScore: 1, awayScore: 1 }),
    ).toBe(EXACT_POINTS);
  });

  it("acierta el ganador pero no el marcador → 1 punto", () => {
    expect(
      scorePrediction({ homeScore: 3, awayScore: 0 }, { stage, homeScore: 2, awayScore: 1 }),
    ).toBe(OUTCOME_POINTS);
  });

  it("acierta el empate pero no el marcador → 1 punto", () => {
    expect(
      scorePrediction({ homeScore: 0, awayScore: 0 }, { stage, homeScore: 2, awayScore: 2 }),
    ).toBe(OUTCOME_POINTS);
  });

  it("no acierta nada → 0 puntos", () => {
    expect(
      scorePrediction({ homeScore: 0, awayScore: 2 }, { stage, homeScore: 2, awayScore: 1 }),
    ).toBe(0);
  });
});

describe("scorePrediction — multiplicadores de fase", () => {
  it("exacto en la final vale 3 × 4 = 12", () => {
    expect(
      scorePrediction({ homeScore: 1, awayScore: 0 }, { stage: "FINAL", homeScore: 1, awayScore: 0 }),
    ).toBe(EXACT_POINTS * STAGE_MULTIPLIER.FINAL);
  });

  it("acierto de resultado en cuartos vale 1 × 3 = 3", () => {
    expect(
      scorePrediction({ homeScore: 4, awayScore: 1 }, { stage: "QUARTER_FINAL", homeScore: 2, awayScore: 0 }),
    ).toBe(OUTCOME_POINTS * STAGE_MULTIPLIER.QUARTER_FINAL);
  });

  it("exacto en octavos vale 3 × 2 = 6", () => {
    expect(
      scorePrediction({ homeScore: 0, awayScore: 0 }, { stage: "LAST_16", homeScore: 0, awayScore: 0 }),
    ).toBe(EXACT_POINTS * STAGE_MULTIPLIER.LAST_16);
  });
});

describe("scorePrediction — eliminatorias con penales", () => {
  it("empate en los 90' pero el ganador oficial (penales) define el resultado", () => {
    // Pronosticó que ganaba el local; el partido terminó 1-1 y el local pasó por penales.
    const score = scorePrediction(
      { homeScore: 2, awayScore: 0 },
      { stage: "SEMI_FINAL", homeScore: 1, awayScore: 1, winner: "HOME" },
    );
    // No es exacto, pero acertó al que avanza → 1 × 3.
    expect(score).toBe(OUTCOME_POINTS * STAGE_MULTIPLIER.SEMI_FINAL);
  });

  it("marcador exacto 1-1 aunque se haya definido por penales → 3 × multiplicador", () => {
    const score = scorePrediction(
      { homeScore: 1, awayScore: 1 },
      { stage: "SEMI_FINAL", homeScore: 1, awayScore: 1, winner: "HOME" },
    );
    expect(score).toBe(EXACT_POINTS * STAGE_MULTIPLIER.SEMI_FINAL);
  });
});
