import { describe, expect, it } from "vitest";
import {
  buildRanking,
  type RankingMatch,
  type RankingMember,
  type RankingPrediction,
} from "./ranking";

function match(over: Partial<RankingMatch> & { id: string }): RankingMatch {
  return {
    homeTeam: "Local",
    awayTeam: "Visita",
    status: "FINISHED",
    homeScore: 2,
    awayScore: 1,
    winner: null,
    stage: "GROUP",
    ...over,
  };
}

function pred(
  userId: string,
  m: RankingMatch,
  homeScore: number,
  awayScore: number,
  pointsAwarded: number | null,
): RankingPrediction {
  return { userId, matchId: m.id, homeScore, awayScore, pointsAwarded, match: m };
}

const ana: RankingMember = { userId: "ana", name: "Ana", avatarUrl: null };
const bruno: RankingMember = { userId: "bruno", name: "Bruno", avatarUrl: null };

describe("buildRanking — total", () => {
  it("suma points_awarded guardados de partidos terminados", () => {
    const m1 = match({ id: "m1" });
    const m2 = match({ id: "m2" });
    const rows = buildRanking(
      [ana],
      [pred("ana", m1, 2, 1, 10), pred("ana", m2, 1, 0, 5)],
      [],
    );
    expect(rows[0].points).toBe(15);
    expect(rows[0].livePoints).toBe(0);
  });

  it("calcula puntos provisorios para partidos en vivo y los suma al total", () => {
    // En vivo 2-1; Ana predijo 2-1 (exacto provisorio = 10).
    const live = match({ id: "live", status: "IN_PLAY", homeScore: 2, awayScore: 1, winner: null });
    const rows = buildRanking([ana], [pred("ana", live, 2, 1, null)], [live]);
    expect(rows[0].points).toBe(10);
    expect(rows[0].livePoints).toBe(10);
  });

  it("mezcla terminados (guardado) + en vivo (provisorio)", () => {
    const done = match({ id: "done", homeScore: 1, awayScore: 1 });
    const live = match({ id: "live", status: "IN_PLAY", homeScore: 0, awayScore: 2, winner: null });
    // done: guardado 5; live: predijo 0-2 (exacto provisorio = 10).
    const rows = buildRanking(
      [ana],
      [pred("ana", done, 1, 1, 5), pred("ana", live, 0, 2, null)],
      [live, done],
    );
    expect(rows[0].points).toBe(15);
    expect(rows[0].livePoints).toBe(10);
  });

  it("hace fallback al cálculo si un partido terminado no tiene points_awarded", () => {
    // Terminado 2-1; Ana predijo 2-1 → 10, aunque points_awarded sea null.
    const done = match({ id: "done", status: "FINISHED", homeScore: 2, awayScore: 1, winner: "HOME" });
    const rows = buildRanking([ana], [pred("ana", done, 2, 1, null)], []);
    expect(rows[0].points).toBe(10);
    expect(rows[0].livePoints).toBe(0);
  });

  it("ignora partidos SCHEDULED y pronósticos sin partido", () => {
    const sched = match({ id: "s", status: "SCHEDULED", homeScore: null, awayScore: null });
    const rows = buildRanking(
      [ana],
      [
        pred("ana", sched, 1, 0, null),
        { userId: "ana", matchId: "x", homeScore: 1, awayScore: 1, pointsAwarded: null, match: null },
      ],
      [],
    );
    expect(rows[0].points).toBe(0);
  });
});

describe("buildRanking — exactos", () => {
  it("cuenta exactos solo de partidos terminados, no de los en vivo", () => {
    const done = match({ id: "done", status: "FINISHED", homeScore: 2, awayScore: 1 });
    const live = match({ id: "live", status: "IN_PLAY", homeScore: 1, awayScore: 0, winner: null });
    // Acierta exacto el terminado y "exacto" el en vivo: solo cuenta el terminado.
    const rows = buildRanking(
      [ana],
      [pred("ana", done, 2, 1, 10), pred("ana", live, 1, 0, null)],
      [live, done],
    );
    expect(rows[0].exact).toBe(1);
  });
});

describe("buildRanking — franja últimos 5", () => {
  it("arma una celda por partido reciente, en el orden recibido", () => {
    const m1 = match({ id: "m1", homeTeam: "ARG", awayTeam: "MEX" });
    const m2 = match({ id: "m2", homeTeam: "BRA", awayTeam: "CRO" });
    const rows = buildRanking([ana], [pred("ana", m1, 2, 1, 10)], [m1, m2]);
    const cells = rows[0].last5;
    expect(cells.map((c) => c.matchId)).toEqual(["m1", "m2"]);
    expect(cells[0]).toMatchObject({ predicted: true, points: 10, predHome: 2, predAway: 1 });
    // m2 no lo pronosticó.
    expect(cells[1]).toMatchObject({ predicted: false, points: null });
    expect(cells[1].actualHome).toBe(2);
  });

  it("marca live=true y usa el marcador actual para los puntos provisorios", () => {
    const live = match({ id: "live", status: "IN_PLAY", homeScore: 3, awayScore: 0, winner: null });
    // Ana predijo 2-1: acierta ganador (HOME) sin coincidir ningún gol → 5.
    const rows = buildRanking([ana], [pred("ana", live, 2, 1, null)], [live]);
    const cell = rows[0].last5[0];
    expect(cell.live).toBe(true);
    expect(cell.predicted).toBe(true);
    expect(cell.points).toBe(5);
  });

  it("alinea las celdas: todos los jugadores comparten los mismos partidos", () => {
    const m1 = match({ id: "m1" });
    const m2 = match({ id: "m2" });
    const rows = buildRanking(
      [ana, bruno],
      [pred("ana", m1, 2, 1, 10)], // Bruno no pronosticó ninguno
      [m1, m2],
    );
    for (const r of rows) {
      expect(r.last5.map((c) => c.matchId)).toEqual(["m1", "m2"]);
    }
  });
});

describe("buildRanking — orden", () => {
  it("ordena por puntos, luego exactos, luego nombre (es)", () => {
    const m1 = match({ id: "m1", homeScore: 2, awayScore: 1 });
    const m2 = match({ id: "m2", homeScore: 0, awayScore: 0 });
    const carla: RankingMember = { userId: "carla", name: "Carla", avatarUrl: null };
    const rows = buildRanking(
      [bruno, ana, carla],
      [
        // Ana y Bruno empatan en 10 pts; Ana tiene 1 exacto, Bruno 0 → Ana primero.
        pred("ana", m1, 2, 1, 10), // exacto
        pred("bruno", m1, 3, 0, 5), // solo ganador
        pred("bruno", m2, 1, 0, 5), // solo ganador → Bruno total 10, 0 exactos
        // Carla 0 pts.
      ],
      [],
    );
    expect(rows.map((r) => r.userId)).toEqual(["ana", "bruno", "carla"]);
  });

  it("reordena cuando los puntos en vivo cambian el total", () => {
    const live = match({ id: "live", status: "IN_PLAY", homeScore: 1, awayScore: 0, winner: null });
    const done = match({ id: "done", status: "FINISHED", homeScore: 0, awayScore: 0 });
    // Bruno tiene 5 guardados; Ana 0 guardados pero +10 en vivo (1-0 exacto) → Ana arriba.
    const rows = buildRanking(
      [ana, bruno],
      [pred("ana", live, 1, 0, null), pred("bruno", done, 0, 0, 5)],
      [live, done],
    );
    expect(rows[0].userId).toBe("ana");
    expect(rows[0].points).toBe(10);
  });
});

describe("buildRanking — consistencia de datos", () => {
  it("usa recentMatches como fuente autoritativa del partido (no el join del pronóstico)", () => {
    // El join quedó viejo (en vivo 2-1) pero el partido ya terminó 3-1.
    const stale = match({ id: "m", status: "IN_PLAY", homeScore: 2, awayScore: 1, winner: null });
    const fresh = match({ id: "m", status: "FINISHED", homeScore: 3, awayScore: 1, winner: "HOME" });
    const p: RankingPrediction = {
      userId: "ana",
      matchId: "m",
      homeScore: 2,
      awayScore: 1,
      pointsAwarded: null,
      match: stale,
    };
    // Contra el estado fresco (3-1): acierta ganador + goles visita → 7. No "en vivo".
    const rows = buildRanking([ana], [p], [fresh]);
    expect(rows[0].points).toBe(7);
    expect(rows[0].livePoints).toBe(0);
    expect(rows[0].exact).toBe(0);
    expect(rows[0].last5[0].live).toBe(false);
    expect(rows[0].last5[0].points).toBe(7);
  });
});
