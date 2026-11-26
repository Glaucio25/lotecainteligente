// Associação Loteca ↔ partida da fonte esportiva.
// Regra: ambos os clubes precisam bater + mesma data (horário de Brasília) + resultado único.
const STOP = new Set(["CLUB", "CLUBE", "FC", "CF", "SC", "AC", "DE", "DA", "DO", "DOS", "DAS", "LA", "EL", "DEPORTIVO", "CD", "SAD", "ESPORTE", "FUTEBOL", "AFC", "THE", "CA", "EC", "SE", "FBPA", "CR"]);
const RESERVE = new Set(["II", "B", "U17", "U19", "U20", "U21", "U23", "W", "WOMEN", "FEMININO", "FEM", "SUB", "RESERVES"]);

export function tokens(name: string): string[] {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/).filter((t) => t && !STOP.has(t));
}

export function teamMatches(caixaName: string, sourceNames: string[]): boolean {
  const c = tokens(caixaName);
  if (!c.length) return false;
  return sourceNames.some((n) => {
    const s = tokens(n);
    if (s.some((t) => RESERVE.has(t))) return false;
    return c.every((t) => s.includes(t)) || (s.length > 0 && s.every((t) => c.includes(t)));
  });
}

/** Data (AAAA-MM-DD) no fuso de Brasília (UTC-3). */
export function brDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export interface Candidate { id: string; date: string; homeNames: string[]; awayNames: string[] }

export function findMatch(home: string, away: string, gameDate: string | null, cands: Candidate[]) {
  const hits = cands.filter((c) =>
    (!gameDate || brDate(c.date) === gameDate) && teamMatches(home, c.homeNames) && teamMatches(away, c.awayNames));
  if (hits.length === 1) return { status: "validado" as const, candidate: hits[0]! };
  if (hits.length > 1) return { status: "ambiguo" as const, candidate: null };
  return { status: "nao_encontrado" as const, candidate: null };
}
