import { describe, expect, it } from "vitest";
import { generateTicket, predict, principalPick, ticketCost, toPercent, validateTicket, type MatchRec } from "./model";
import { findMatch, teamMatches } from "./match";

const recs = (gf: number, ga: number, n = 10): MatchRec[] =>
  Array.from({ length: n }, (_, i) => ({ date: `2026-01-${10 + i}`, isHome: i % 2 === 0, gf, ga, oppId: String(i) }));

describe("preço do volante (tabela Caixa)", () => {
  it("aposta mínima com 1 duplo custa R$ 4", () => expect(ticketCost(1, 0).cost).toBe(4));
  it("2 duplos custam R$ 8", () => expect(ticketCost(2, 0).cost).toBe(8));
  it("1 triplo custa R$ 6", () => expect(ticketCost(0, 1).cost).toBe(6));
  it("2 duplos + 2 triplos = 36 combinações, R$ 72", () => expect(ticketCost(2, 2)).toEqual({ combinations: 36, cost: 72 }));
  it("bloqueia mais de 9 duplos", () => expect(validateTicket(10, 0)).not.toBeNull());
});

describe("probabilidades", () => {
  it("somam exatamente 100", () => {
    const p = predict({ homeName: "A", awayName: "B", home: recs(2, 1), away: recs(1, 1), h2h: [] });
    expect(p!.p1 + p!.px + p!.p2).toBe(100);
    expect(toPercent([1 / 3, 1 / 3, 1 / 3]).reduce((a, b) => a + b)).toBe(100);
  });
  it("time mais forte em casa é favorito", () => {
    const p = predict({ homeName: "A", awayName: "B", home: recs(3, 0), away: recs(0, 2), h2h: [] })!;
    expect(p.topPick).toBe("1");
  });
  it("sem dados suficientes não gera prognóstico", () =>
    expect(predict({ homeName: "A", awayName: "B", home: recs(1, 1, 2), away: recs(1, 1), h2h: [] })).toBeNull());
  it("análise sem confronto direto fica incompleta", () =>
    expect(predict({ homeName: "A", awayName: "B", home: recs(2, 1), away: recs(1, 1), h2h: [] })!.complete).toBe(false));
  it("palpite principal: seco ≥50%, duplo, triplo quando equilibrado", () => {
    expect(principalPick(55, 25, 20)).toBe("1");
    expect(principalPick(38, 30, 32)).toBe("1X2");
    expect(principalPick(45, 33, 22)).toBe("1X");
  });
});

describe("gerador", () => {
  const games = Array.from({ length: 14 }, (_, i) => ({ seq: i + 1, p1: 40 + i, px: 30, p2: 30 - i }));
  it("respeita quantidade de duplos e triplos", () => {
    const t = generateTicket(games, "equilibrada", 3, 2, 7);
    expect(t.picks.filter((p) => p.outcomes.length === 2)).toHaveLength(3);
    expect(t.picks.filter((p) => p.outcomes.length === 3)).toHaveLength(2);
    expect(t.combinations).toBe(72);
  });
});

describe("associação de jogos", () => {
  it("não confunde Manchester City com United", () => expect(teamMatches("MANCHESTER CITY", ["Manchester United"])).toBe(false));
  it("rejeita time reserva", () => expect(teamMatches("REAL SOCIEDAD", ["Real Sociedad II"])).toBe(false));
  it("exige os dois clubes e a mesma data", () => {
    const c = [{ id: "1", date: "2026-11-29T00:00Z", homeNames: ["Botafogo"], awayNames: ["Bahia"] }];
    expect(findMatch("BOTAFOGO", "BAHIA", "2026-11-28", c).status).toBe("validado");
    expect(findMatch("BOTAFOGO", "BAHIA", "2026-11-29", c).status).toBe("nao_encontrado");
    expect(findMatch("BOTAFOGO", "VASCO", "2026-11-28", c).status).toBe("nao_encontrado");
  });
});
