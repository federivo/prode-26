import { describe, expect, it } from "vitest";
import { POINTS, outcomeFromScore, scorePrediction } from "./scoring";

const GROUP = "GROUP" as const;

describe("outcomeFromScore", () => {
  it("identifica local, visitante y empate", () => {
    expect(outcomeFromScore(2, 1)).toBe("HOME");
    expect(outcomeFromScore(0, 3)).toBe("AWAY");
    expect(outcomeFromScore(1, 1)).toBe("DRAW");
  });
});

describe("scorePrediction — sistema nuevo", () => {
  it("resultado exacto → 10", () => {
    expect(
      scorePrediction({ homeScore: 2, awayScore: 1 }, { stage: GROUP, homeScore: 2, awayScore: 1 }),
    ).toBe(POINTS.EXACT);
  });

  it("empate exacto → 10", () => {
    expect(
      scorePrediction({ homeScore: 1, awayScore: 1 }, { stage: GROUP, homeScore: 1, awayScore: 1 }),
    ).toBe(POINTS.EXACT);
  });

  it("acierta ganador + goles de un equipo (visitante) → 7", () => {
    // actual 2-1 (local); predijo 3-1 (local, away 1==1)
    expect(
      scorePrediction({ homeScore: 3, awayScore: 1 }, { stage: GROUP, homeScore: 2, awayScore: 1 }),
    ).toBe(POINTS.OUTCOME_ONE_SIDE);
  });

  it("acierta ganador + goles de un equipo (local) → 7", () => {
    // actual 2-1; predijo 2-0 (local, home 2==2)
    expect(
      scorePrediction({ homeScore: 2, awayScore: 0 }, { stage: GROUP, homeScore: 2, awayScore: 1 }),
    ).toBe(POINTS.OUTCOME_ONE_SIDE);
  });

  it("acierta solo el ganador → 5", () => {
    // actual 2-1; predijo 3-0 (local, ningún lado coincide)
    expect(
      scorePrediction({ homeScore: 3, awayScore: 0 }, { stage: GROUP, homeScore: 2, awayScore: 1 }),
    ).toBe(POINTS.OUTCOME);
  });

  it("acierta solo el empate → 5", () => {
    // actual 2-2; predijo 1-1
    expect(
      scorePrediction({ homeScore: 1, awayScore: 1 }, { stage: GROUP, homeScore: 2, awayScore: 2 }),
    ).toBe(POINTS.OUTCOME);
  });

  it("erra el ganador pero acierta los goles de un lado → 2", () => {
    // actual 2-1 (local); predijo 2-3 (visitante, home 2==2)
    expect(
      scorePrediction({ homeScore: 2, awayScore: 3 }, { stage: GROUP, homeScore: 2, awayScore: 1 }),
    ).toBe(POINTS.ONE_SIDE);
  });

  it("no acierta nada → 0", () => {
    // actual 2-1; predijo 0-3
    expect(
      scorePrediction({ homeScore: 0, awayScore: 3 }, { stage: GROUP, homeScore: 2, awayScore: 1 }),
    ).toBe(POINTS.NONE);
  });
});

describe("scorePrediction — eliminatorias con penales (no cuentan)", () => {
  it("marcador exacto 1-1 aunque haya penales → 10", () => {
    expect(
      scorePrediction(
        { homeScore: 1, awayScore: 1 },
        { stage: "SEMI_FINAL", homeScore: 1, awayScore: 1, winner: "HOME" },
      ),
    ).toBe(POINTS.EXACT);
  });

  it("un 1-1 definido por penales puntúa como empate, no como triunfo del que avanza", () => {
    // 90'/ET 1-1, avanza local por penales; predijo otro empate (2-2) → acierta el resultado (empate)
    expect(
      scorePrediction(
        { homeScore: 2, awayScore: 2 },
        { stage: "SEMI_FINAL", homeScore: 1, awayScore: 1, winner: "HOME" },
      ),
    ).toBe(POINTS.OUTCOME);
  });

  it("predecir al que avanza por penales NO acierta el resultado (es empate)", () => {
    // 90'/ET 1-1, avanza local por penales; predijo 2-1 (local) → erró el empate, pero away 1==1 → 2
    expect(
      scorePrediction(
        { homeScore: 2, awayScore: 1 },
        { stage: "SEMI_FINAL", homeScore: 1, awayScore: 1, winner: "HOME" },
      ),
    ).toBe(POINTS.ONE_SIDE);
  });

  it("predijo triunfo del que avanza sin coincidir goles → 0", () => {
    // 90'/ET 1-1, avanza local por penales; predijo 2-0 → erró el empate y ningún lado coincide
    expect(
      scorePrediction(
        { homeScore: 2, awayScore: 0 },
        { stage: "SEMI_FINAL", homeScore: 1, awayScore: 1, winner: "HOME" },
      ),
    ).toBe(POINTS.NONE);
  });
});
