// Modelo estatístico de regras fixas (não é aprendizado de máquina):
// médias ponderadas por recência + força ofensiva/defensiva + Poisson.
export const MODEL_VERSION = "poisson-ponderado-v1";

export type Outcome = "1" | "X" | "2";
export interface MatchRec {
  date: string;
  isHome: boolean;
  gf: number;
  ga: number;
  oppId: string;
}

export interface TeamForm {
  games: number;
  w5: number; d5: number; l5: number;
  w10: number; d10: number; l10: number;
  gfAvg: number; gaAvg: number;
  homeGames: number; homeGf: number; homeGa: number; homePts: number;
  awayGames: number; awayGf: number; awayGa: number; awayPts: number;
  wGf: number; wGa: number; // ponderados por recência
  wHomeGf: number | null; wHomeGa: number | null;
  wAwayGf: number | null; wAwayGa: number | null;
  formPts5: number; // pontos nos últimos 5 (0-15)
}

const DECAY = 0.85;

function wavg(values: number[]): number | null {
  if (!values.length) return null;
  let s = 0, w = 0;
  values.forEach((v, i) => { const k = DECAY ** i; s += v * k; w += k; });
  return s / w;
}

/** recs ordenados do mais recente para o mais antigo */
export function teamForm(recsAll: MatchRec[]): TeamForm {
  const recs = recsAll.slice(0, 10);
  const res = (r: MatchRec) => (r.gf > r.ga ? "W" : r.gf === r.ga ? "D" : "L");
  const count = (arr: MatchRec[], t: string) => arr.filter((r) => res(r) === t).length;
  const l5 = recs.slice(0, 5);
  const home = recs.filter((r) => r.isHome);
  const away = recs.filter((r) => !r.isHome);
  const pts = (arr: MatchRec[]) => arr.reduce((s, r) => s + (res(r) === "W" ? 3 : res(r) === "D" ? 1 : 0), 0);
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  return {
    games: recs.length,
    w5: count(l5, "W"), d5: count(l5, "D"), l5: count(l5, "L"),
    w10: count(recs, "W"), d10: count(recs, "D"), l10: count(recs, "L"),
    gfAvg: avg(recs.map((r) => r.gf)), gaAvg: avg(recs.map((r) => r.ga)),
    homeGames: home.length, homeGf: avg(home.map((r) => r.gf)), homeGa: avg(home.map((r) => r.ga)), homePts: pts(home),
    awayGames: away.length, awayGf: avg(away.map((r) => r.gf)), awayGa: avg(away.map((r) => r.ga)), awayPts: pts(away),
    wGf: wavg(recs.map((r) => r.gf)) ?? 0, wGa: wavg(recs.map((r) => r.ga)) ?? 0,
    wHomeGf: home.length >= 2 ? wavg(home.map((r) => r.gf)) : null,
    wHomeGa: home.length >= 2 ? wavg(home.map((r) => r.ga)) : null,
    wAwayGf: away.length >= 2 ? wavg(away.map((r) => r.gf)) : null,
    wAwayGa: away.length >= 2 ? wavg(away.map((r) => r.ga)) : null,
    formPts5: pts(l5),
  };
}

function poissonPmf(k: number, l: number) {
  let f = 1; for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * l ** k) / f;
}

export function outcomeProbs(lh: number, la: number) {
  let p1 = 0, px = 0, p2 = 0;
  for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
    const p = poissonPmf(i, lh) * poissonPmf(j, la);
    if (i > j) p1 += p; else if (i === j) px += p; else p2 += p;
  }
  const t = p1 + px + p2;
  return { p1: p1 / t, px: px / t, p2: p2 / t };
}

/** Arredonda para inteiros somando exatamente 100 (maiores restos). */
export function toPercent(p: [number, number, number]): [number, number, number] {
  const raw = p.map((x) => x * 100);
  const fl = raw.map(Math.floor);
  let rest = 100 - fl.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (rest <= 0) break; fl[i]! += 1; rest--; }
  return fl as [number, number, number];
}

export function principalPick(p1: number, px: number, p2: number): string {
  const arr: [Outcome, number][] = [["1", p1], ["X", px], ["2", p2]];
  const s = [...arr].sort((a, b) => b[1] - a[1]);
  const [a, b, c] = s as [[Outcome, number], [Outcome, number], [Outcome, number]];
  if (a[1] >= 50) return a[0];
  if (a[1] - c[1] < 10) return "1X2";
  return ["1", "X", "2"].filter((o) => o === a[0] || o === b[0]).join("");
}

export function confidenceLevel(top: number, complete: boolean, minGames: number): "baixo" | "médio" | "alto" {
  let lvl = top >= 55 ? 2 : top >= 42 ? 1 : 0;
  if (!complete) lvl -= 1;
  if (minGames < 5) lvl = 0;
  return (["baixo", "médio", "alto"] as const)[Math.max(0, lvl)]!;
}

export interface PredictionInput {
  homeName: string; awayName: string;
  home: MatchRec[]; away: MatchRec[];
  h2h: { homeGoals: number; awayGoals: number; date: string }[]; // da perspectiva do mandante atual
  homeRank?: number | null; awayRank?: number | null;
}

export interface PredictionOutput {
  p1: number; px: number; p2: number;
  lambdaHome: number; lambdaAway: number;
  pick: string; topPick: Outcome;
  confidence: "baixo" | "médio" | "alto";
  complete: boolean;
  missing: string[];
  explanation: string;
  factors: Record<string, unknown>;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const f1 = (n: number) => n.toFixed(1).replace(".", ",");

export function predict(inp: PredictionInput): PredictionOutput | null {
  if (inp.home.length < 3 || inp.away.length < 3) return null;
  const H = teamForm(inp.home), A = teamForm(inp.away);
  const missing: string[] = [];
  if (H.games < 10 || A.games < 10) missing.push("menos de 10 jogos recentes disponíveis");
  if (!inp.h2h.length) missing.push("sem confrontos diretos recentes na fonte");
  if (inp.homeRank == null || inp.awayRank == null) missing.push("classificação indisponível para este campeonato");
  missing.push("desfalques e suspensões não verificados (sem fonte gratuita confiável)");

  const all = [...inp.home.slice(0, 10), ...inp.away.slice(0, 10)];
  const leagueAvg = clamp(all.reduce((s, r) => s + r.gf + r.ga, 0) / (2 * all.length), 0.8, 2.0);
  const blend = (specific: number | null, overall: number) => (specific == null ? overall : 0.6 * specific + 0.4 * overall);
  const attH = blend(H.wHomeGf, H.wGf) / leagueAvg;
  const defH = blend(H.wHomeGa, H.wGa) / leagueAvg;
  const attA = blend(A.wAwayGf, A.wGf) / leagueAvg;
  const defA = blend(A.wAwayGa, A.wGa) / leagueAvg;
  // encolhe para a média (amostras pequenas)
  const shrink = (x: number) => 0.75 * x + 0.25;
  let lh = leagueAvg * shrink(attH) * shrink(defA) * 1.08;
  let la = leagueAvg * shrink(attA) * shrink(defH) * 0.94;
  // momento (pontos nos últimos 5) – ajuste leve
  const mom = (H.formPts5 - A.formPts5) / 15; // -1..1
  lh *= 1 + 0.08 * mom; la *= 1 - 0.08 * mom;
  // H2H – ajuste leve se houver
  if (inp.h2h.length >= 2) {
    const d = inp.h2h.reduce((s, g) => s + (g.homeGoals - g.awayGoals), 0) / inp.h2h.length;
    lh *= 1 + clamp(d, -1, 1) * 0.05; la *= 1 - clamp(d, -1, 1) * 0.05;
  }
  lh = clamp(lh, 0.2, 4); la = clamp(la, 0.2, 4);
  const pr = outcomeProbs(lh, la);
  const [p1, px, p2] = toPercent([pr.p1, pr.px, pr.p2]);
  const top = Math.max(p1, px, p2);
  const topPick: Outcome = top === p1 ? "1" : top === px ? "X" : "2";
  const complete = H.games >= 10 && A.games >= 10 && inp.h2h.length > 0 && inp.homeRank != null && inp.awayRank != null;
  const confidence = confidenceLevel(top, complete, Math.min(H.games, A.games));

  const favHome = H.homeGames ? `aproveitamento de ${Math.round((H.homePts / (H.homeGames * 3)) * 100)}% como mandante` : `média de ${f1(H.gfAvg)} gols marcados`;
  const favAway = A.awayGames ? `aproveitamento de ${Math.round((A.awayPts / (A.awayGames * 3)) * 100)}% como visitante` : `média de ${f1(A.gfAvg)} gols marcados`;
  const homeFactor = H.formPts5 >= A.formPts5 ? `melhor momento (${H.w5}V ${H.d5}E ${H.l5}D nos últimos 5)` : favHome;
  const awayFactor = A.formPts5 > H.formPts5 ? `melhor momento (${A.w5}V ${A.d5}E ${A.l5}D nos últimos 5)` : favAway;

  const lead = topPick === "1" ? `${inp.homeName} aparece como favorito` : topPick === "2" ? `${inp.awayName} aparece como favorito mesmo fora de casa` : "O empate é o resultado mais provável";
  const parts = [
    `${lead} (${top}%).`,
    `O modelo estima ${f1(lh)} gols para o mandante e ${f1(la)} para o visitante.`,
    `${inp.homeName}: ${H.w10}V ${H.d10}E ${H.l10}D nos últimos ${H.games}, ${f1(H.gfAvg)} gols marcados e ${f1(H.gaAvg)} sofridos por jogo.`,
    `${inp.awayName}: ${A.w10}V ${A.d10}E ${A.l10}D nos últimos ${A.games}, ${f1(A.gfAvg)} marcados e ${f1(A.gaAvg)} sofridos.`,
  ];
  if (inp.h2h.length) parts.push(`Confrontos diretos encontrados: ${inp.h2h.length}.`);
  if (px >= 30) parts.push(`Chance relevante de empate (${px}%).`);
  if (!complete) parts.push("Análise incompleta: confiança reduzida.");

  return {
    p1, px, p2, lambdaHome: lh, lambdaAway: la,
    pick: principalPick(p1, px, p2), topPick, confidence, complete, missing,
    explanation: parts.join(" "),
    factors: {
      home: H, away: A, h2h: inp.h2h, homeRank: inp.homeRank ?? null, awayRank: inp.awayRank ?? null,
      homeFactor, awayFactor, drawChance: px, missing, leagueAvg,
    },
  };
}

// ---------------- Volante ----------------
export const PRICE_PER_COMBINATION = 2; // R$ (tabela Caixa)
export const MIN_BET = 4; // R$ – aposta mínima com 1 duplo
export const MAX_DOUBLES = 9;
export const MAX_TRIPLES = 6;
export const MAX_COMBINATIONS = 729;

export function ticketCost(doubles: number, triples: number) {
  const combinations = 2 ** doubles * 3 ** triples;
  return { combinations, cost: Math.max(MIN_BET, combinations * PRICE_PER_COMBINATION) };
}

export function validateTicket(doubles: number, triples: number): string | null {
  if (doubles < 0 || triples < 0) return "Valores inválidos.";
  if (doubles + triples > 14) return "No máximo 14 jogos.";
  if (triples > MAX_TRIPLES) return `A Caixa permite no máximo ${MAX_TRIPLES} triplos.`;
  if (doubles > MAX_DOUBLES) return `A Caixa permite no máximo ${MAX_DOUBLES} duplos.`;
  if (ticketCost(doubles, triples).combinations > MAX_COMBINATIONS) return "Combinação acima do limite aceito pela Caixa.";
  return null;
}

export type Strategy = "conservadora" | "equilibrada" | "arriscada";
export interface GameProbs { seq: number; p1: number; px: number; p2: number }
export interface TicketPick { seq: number; outcomes: Outcome[]; coverage: number; reason: string }

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; };
}

export function generateTicket(games: GameProbs[], strategy: Strategy, doubles: number, triples: number, seed = 1) {
  const r = rng(seed);
  const entries = games.map((g) => {
    const arr: [Outcome, number][] = [["1", g.p1], ["X", g.px], ["2", g.p2]];
    const sorted = [...arr].sort((a, b) => b[1] - a[1]);
    const unc = 100 - sorted[0]![1];
    return { g, sorted, unc };
  });
  // jogos mais incertos recebem triplos, depois duplos (com leve variação por seed)
  const byUnc = [...entries].sort((a, b) => b.unc + r() * 4 - (a.unc + r() * 4));
  const tripleSet = new Set(byUnc.slice(0, triples).map((e) => e.g.seq));
  const doubleSet = new Set(byUnc.slice(triples, triples + doubles).map((e) => e.g.seq));
  let risky = strategy === "arriscada" ? 3 : 0;

  const picks: TicketPick[] = entries.map(({ g, sorted }) => {
    const [a, b, c] = sorted as [[Outcome, number], [Outcome, number], [Outcome, number]];
    let outs: Outcome[]; let reason: string;
    if (tripleSet.has(g.seq)) { outs = ["1", "X", "2"]; reason = "Triplo: jogo de maior incerteza"; }
    else if (doubleSet.has(g.seq)) {
      if (strategy === "arriscada" && c[1] >= 25 && r() < 0.5) { outs = [a[0], c[0]]; reason = `Duplo com zebra (${c[1]}%)`; }
      else { outs = [a[0], b[0]]; reason = "Duplo nos dois resultados mais prováveis"; }
    } else if (strategy === "conservadora") {
      outs = [a[1] - b[1] <= 2 && r() < 0.5 ? b[0] : a[0]]; reason = "Resultado de maior probabilidade";
    } else if (strategy === "equilibrada") {
      const w = sorted.map(([, p]) => p ** 3); const t = w.reduce((x, y) => x + y, 0);
      let x = r() * t; let k = 0; while (k < 2 && x > w[k]!) { x -= w[k]!; k++; }
      outs = [sorted[k]![0]]; reason = k === 0 ? "Favorito estatístico" : `Alternativa com ${sorted[k]![1]}%`;
    } else {
      if (risky > 0 && b[1] >= 28 && r() < 0.6) { outs = [b[0]]; risky--; reason = `Surpresa com ${b[1]}% de chance`; }
      else { outs = [a[0]]; reason = "Favorito estatístico"; }
    }
    const pm: Record<Outcome, number> = { "1": g.p1, X: g.px, "2": g.p2 };
    outs.sort((x, y) => "1X2".indexOf(x) - "1X2".indexOf(y));
    return { seq: g.seq, outcomes: outs, coverage: outs.reduce((s, o) => s + pm[o], 0), reason };
  });
  const p14 = picks.reduce((s, p) => s * (p.coverage / 100), 1);
  const expectedHits = picks.reduce((s, p) => s + p.coverage / 100, 0);
  return { picks, p14, expectedHits, ...ticketCost(doubles, triples) };
}

export function resultFromScore(h: number, a: number): Outcome {
  return h > a ? "1" : h === a ? "X" : "2";
}
