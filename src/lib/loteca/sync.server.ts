import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { brDate, findMatch, type Candidate } from "./match";
import { MODEL_VERSION, predict, resultFromScore, type MatchRec } from "./model";

type DB = SupabaseClient<Database>;
const CAIXA = "https://servicebus2.caixa.gov.br/portaldeloterias/api/loteca";
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const UA = { "User-Agent": "Mozilla/5.0 (LotecaInteligente)", Accept: "application/json" };
const LEAGUE_SLUG: Record<string, string> = {
  "630": "bra.1", "4007": "bra.2", "700": "eng.1", "740": "esp.1", "730": "ita.1", "720": "ger.1",
  "710": "fra.1", "715": "por.1", "725": "ned.1", "745": "arg.1", "3914": "eng.2",
};

async function getJson(url: string, timeoutMs = 12000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${new URL(url).host}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

const brToIso = (s?: string | null) => {
  if (!s) return null; const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

async function log(db: DB, source: string, ok: boolean, message: string) {
  await db.from("sync_log").insert({ source, ok, message: message.slice(0, 500) });
}

/** Intervalo adaptativo: 60s com jogo ao vivo/próximo, 5 min em dia de jogo, 30 min fora disso. */
export async function syncInterval(db: DB): Promise<number> {
  const now = Date.now();
  const { data } = await db.from("loteca_games").select("state,kickoff,game_date").order("contest", { ascending: false }).limit(28);
  const rows = data ?? [];
  if (rows.some((g) => g.state === "in")) return 60;
  if (rows.some((g) => g.kickoff && Math.abs(new Date(g.kickoff).getTime() - now) < 3 * 3600e3 && g.state !== "post")) return 60;
  const today = brDate(new Date().toISOString());
  if (rows.some((g) => g.game_date === today)) return 300;
  return 1800;
}

export async function maybeSync(db: DB, force = false) {
  const interval = force ? 30 : await syncInterval(db);
  const { data: claimed } = await db.rpc("try_claim_sync", { _key: "main", _min_seconds: interval });
  if (!claimed) return false;
  const errors: string[] = [];
  try { await syncCaixa(db); } catch (e) { errors.push(`Caixa: ${(e as Error).message}`); }
  try { await syncSports(db); } catch (e) { errors.push(`Placares: ${(e as Error).message}`); }
  try { await syncPredictions(db); } catch (e) { errors.push(`Prognósticos: ${(e as Error).message}`); }
  const today = new Date().toISOString().slice(0, 10);
  const { data: st } = await db.from("sync_state").select("requests_today,requests_day").eq("key", "main").single();
  const reqs = (st?.requests_day === today ? st.requests_today : 0) + 1;
  await db.from("sync_state").update({
    last_ok: errors.length ? undefined : new Date().toISOString(),
    last_error: errors.length ? errors.join(" | ") : null,
    requests_today: reqs, requests_day: today,
  }).eq("key", "main");
  await log(db, "sync", !errors.length, errors.join(" | ") || "ok");
  return true;
}

// ---------- Caixa (fonte oficial) ----------
async function saveResultContest(db: DB, r: any) {
  await db.from("contests").upsert({
    number: r.numero, draw_date: brToIso(r.dataApuracao), status: "apurado",
    official_published: true, results_official: true, updated_at: new Date().toISOString(),
  });
  const games = (r.listaResultadoEquipeEsportiva ?? []).map((g: any) => ({
    contest: r.numero, seq: g.nuSequencial, home_name: g.nomeEquipeUm, away_name: g.nomeEquipeDois,
    game_date: brToIso(g.dtJogo), official_home_goals: g.nuGolEquipeUm, official_away_goals: g.nuGolEquipeDois,
    official_result: resultFromScore(g.nuGolEquipeUm, g.nuGolEquipeDois), league_name: g.nomeCampeonato || null,
  }));
  for (const g of games) {
    const { data: ex } = await db.from("loteca_games").select("seq").eq("contest", g.contest).eq("seq", g.seq).maybeSingle();
    if (ex) {
      await db.from("loteca_games").update({
        official_home_goals: g.official_home_goals, official_away_goals: g.official_away_goals, official_result: g.official_result,
      }).eq("contest", g.contest).eq("seq", g.seq);
    } else await db.from("loteca_games").insert(g);
  }
}

async function syncCaixa(db: DB) {
  const last = await getJson(CAIXA);
  await saveResultContest(db, last);

  // Histórico: completa até 8 concursos anteriores (1 por sincronização)
  const { data: hist } = await db.from("contests").select("number").eq("results_official", true).order("number");
  const have = new Set((hist ?? []).map((h) => h.number));
  for (let n = last.numero - 1; n > last.numero - 9; n--) {
    if (!have.has(n)) { try { await saveResultContest(db, await getJson(`${CAIXA}/${n}`)); } catch { /* tenta depois */ } break; }
  }

  const prog = await getJson(`${CAIXA}/programacao`);
  const p = Array.isArray(prog) ? prog[0] : prog;
  const nextNum: number = last.numeroConcursoProximo;
  const progNum: number | undefined = p?.nuConcurso ?? p?.listaJogos?.[0]?.nuConcurso;
  const published = !!(progNum && progNum === nextNum && p.listaJogos?.length);
  await db.from("contests").upsert({
    number: nextNum,
    draw_date: brToIso(p?.dataProximoConcurso) ?? brToIso(last.dataProximoConcurso),
    bet_start: published ? brToIso(p.dataInicioApostas) : null,
    bet_end: published ? brToIso(p.dataFimApostas) : null,
    games_start: published ? brToIso(p.dataInicioRealizacaoJogos) : null,
    games_end: published ? brToIso(p.dataFimRealizacaoJogos) : null,
    estimated_prize: last.valorEstimadoProximoConcurso ?? null,
    status: "proximo", official_published: published, updated_at: new Date().toISOString(),
  });
  if (!published) return;
  for (const g of p.listaJogos) {
    const row = { contest: nextNum, seq: g.nuSequencial, home_name: g.nomeEquipeUm, away_name: g.nomeEquipeDois, game_date: brToIso(g.dtJogo) };
    const { data: ex } = await db.from("loteca_games").select("home_name,away_name,game_date").eq("contest", nextNum).eq("seq", g.nuSequencial).maybeSingle();
    if (!ex) await db.from("loteca_games").insert(row);
    else if (ex.home_name !== row.home_name || ex.away_name !== row.away_name || ex.game_date !== row.game_date) {
      // confronto alterado pela Caixa: refaz associação
      await db.from("loteca_games").update({ ...row, match_status: "pendente", source_event_id: null }).eq("contest", nextNum).eq("seq", g.nuSequencial);
    }
  }
}

// ---------- Placares (ESPN, endpoint público gratuito) ----------
function parseEvent(e: any) {
  const c = e.competitions?.[0] ?? {};
  const comp = (side: string) => c.competitors?.find((x: any) => x.homeAway === side) ?? {};
  const h = comp("home"), a = comp("away");
  const names = (t: any) => [t?.displayName, t?.shortDisplayName, t?.name, t?.location].filter(Boolean);
  const leagueId = String(e.uid ?? "").match(/l:(\d+)/)?.[1] ?? null;
  const st = e.status ?? c.status ?? {};
  return {
    id: String(e.id), date: e.date as string, leagueId,
    homeNames: names(h.team), awayNames: names(a.team),
    home: h, away: a, venue: c.venue?.fullName ? [c.venue.fullName, c.venue.address?.city].filter(Boolean).join(" – ") : null,
    state: st.type?.state ?? null, statusName: st.type?.name ?? null, clock: st.displayClock ?? null, period: st.period ?? null,
    leagueName: e.season?.slug ?? null,
    details: (c.details ?? []).map((d: any) => ({
      type: d.scoringPlay ? "gol" : d.redCard ? "vermelho" : d.yellowCard ? "amarelo" : "outro",
      minute: d.clock?.displayValue ?? "", side: d.team?.id === h.team?.id ? "home" : "away",
      player: d.athletesInvolved?.[0]?.displayName ?? null, penalty: !!d.penaltyKick, ownGoal: !!d.ownGoal,
    })).filter((d: any) => d.type !== "outro"),
  };
}

async function syncSports(db: DB) {
  const { data: next } = await db.from("contests").select("number").eq("status", "proximo").order("number", { ascending: false }).limit(1).maybeSingle();
  if (!next) return;
  const { data: games } = await db.from("loteca_games").select("*").eq("contest", next.number);
  if (!games?.length) return;
  // Uma requisição por data (cobre todos os campeonatos) – não por jogo nem por visitante
  const dates = new Set<string>();
  for (const g of games) {
    if (g.state === "post" && g.match_status === "validado") continue;
    if (!g.game_date) continue;
    const d = new Date(g.game_date + "T12:00:00Z");
    dates.add(g.game_date.replaceAll("-", ""));
    d.setUTCDate(d.getUTCDate() + 1); dates.add(d.toISOString().slice(0, 10).replaceAll("-", ""));
  }
  const events: ReturnType<typeof parseEvent>[] = [];
  for (const d of dates) {
    const j = await getJson(`${ESPN}/all/scoreboard?dates=${d}&limit=1000`);
    for (const e of j.events ?? []) events.push(parseEvent(e));
  }
  const byId = new Map(events.map((e) => [e.id, e]));
  const cands: Candidate[] = events.map((e) => ({ id: e.id, date: e.date, homeNames: e.homeNames, awayNames: e.awayNames }));
  const now = new Date().toISOString();
  for (const g of games) {
    let ev = g.source_event_id ? byId.get(g.source_event_id) : undefined;
    const upd: Database["public"]["Tables"]["loteca_games"]["Update"] = {};
    if (g.match_status !== "validado") {
      const m = findMatch(g.home_name, g.away_name, g.game_date, cands);
      upd.match_status = m.status;
      upd.match_note = m.status === "ambiguo" ? "Mais de uma partida compatível – aguardando validação manual"
        : m.status === "nao_encontrado" ? "Partida não encontrada na fonte gratuita (campeonato pode não ser coberto)" : null;
      if (m.candidate) { ev = byId.get(m.candidate.id); upd.source = "espn"; upd.source_event_id = m.candidate.id; }
    }
    if (ev) {
      Object.assign(upd, {
        source_league: ev.leagueId, league_name: ev.leagueName,
        home_team_id: ev.home.team?.id ?? null, away_team_id: ev.away.team?.id ?? null,
        home_full: ev.home.team?.displayName ?? null, away_full: ev.away.team?.displayName ?? null,
        home_logo: ev.home.team?.logo ?? null, away_logo: ev.away.team?.logo ?? null,
        venue: ev.venue, kickoff: ev.date, state: ev.state, status_detail: ev.statusName, clock: ev.clock, period: ev.period,
        home_score: ev.state === "pre" ? null : Number(ev.home.score ?? 0),
        away_score: ev.state === "pre" ? null : Number(ev.away.score ?? 0),
        events: ev.details, live_updated_at: now,
      });
    }
    if (Object.keys(upd).length) await db.from("loteca_games").update(upd).eq("contest", g.contest).eq("seq", g.seq);
  }
}

// ---------- Prognósticos ----------
async function teamHistory(teamId: string): Promise<MatchRec[]> {
  const j = await getJson(`${ESPN}/all/teams/${teamId}/schedule`);
  const recs: MatchRec[] = [];
  for (const e of j.events ?? []) {
    const c = e.competitions?.[0]; if (!c?.status?.type?.completed) continue;
    const me = c.competitors?.find((x: any) => x.team?.id === teamId);
    const op = c.competitors?.find((x: any) => x.team?.id !== teamId);
    if (!me || !op) continue;
    const gf = Number(me.score?.value ?? me.score), ga = Number(op.score?.value ?? op.score);
    if (Number.isNaN(gf) || Number.isNaN(ga)) continue;
    recs.push({ date: e.date, isHome: me.homeAway === "home", gf, ga, oppId: String(op.team.id) });
  }
  return recs.sort((a, b) => b.date.localeCompare(a.date));
}

const standingsCache = new Map<string, Map<string, number>>();
async function rankOf(leagueId: string | null, teamId: string): Promise<number | null> {
  const slug = leagueId ? LEAGUE_SLUG[leagueId] : undefined;
  if (!slug) return null;
  if (!standingsCache.has(slug)) {
    const m = new Map<string, number>();
    try {
      const j = await getJson(`https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`);
      const entries = j.children?.[0]?.standings?.entries ?? [];
      for (const en of entries) {
        const r = en.stats?.find((s: any) => s.name === "rank")?.value;
        if (en.team?.id && r) m.set(String(en.team.id), Number(r));
      }
    } catch { /* sem classificação */ }
    standingsCache.set(slug, m);
  }
  return standingsCache.get(slug)!.get(teamId) ?? null;
}

async function syncPredictions(db: DB) {
  const { data: next } = await db.from("contests").select("number").eq("status", "proximo").order("number", { ascending: false }).limit(1).maybeSingle();
  if (!next) return;
  const [{ data: games }, { data: preds }] = await Promise.all([
    db.from("loteca_games").select("*").eq("contest", next.number).eq("match_status", "validado"),
    db.from("predictions").select("seq,generated_at").eq("contest", next.number),
  ]);
  const predAt = new Map((preds ?? []).map((p) => [p.seq, new Date(p.generated_at).getTime()]));
  const now = Date.now();
  const todo = (games ?? []).filter((g) => g.kickoff && new Date(g.kickoff).getTime() > now + 5 * 60e3 && g.home_team_id && g.away_team_id
    && (!predAt.has(g.seq) || now - predAt.get(g.seq)! > 6 * 3600e3)).slice(0, 5); // limita requisições por ciclo
  for (const g of todo) {
    const [home, away] = await Promise.all([teamHistory(g.home_team_id!), teamHistory(g.away_team_id!)]);
    const h2h = home.filter((r) => r.oppId === g.away_team_id).slice(0, 5)
      .map((r) => ({ homeGoals: r.gf, awayGoals: r.ga, date: r.date }));
    const [homeRank, awayRank] = await Promise.all([rankOf(g.source_league, g.home_team_id!), rankOf(g.source_league, g.away_team_id!)]);
    const hn = g.home_full ?? g.home_name, an = g.away_full ?? g.away_name;
    const p = predict({ homeName: hn, awayName: an, home, away, h2h, homeRank, awayRank });
    if (!p) { await log(db, "predicao", false, `Jogo ${g.seq}: dados insuficientes`); continue; }
    const { error } = await db.from("predictions").upsert({
      contest: g.contest, seq: g.seq, p1: p.p1, px: p.px, p2: p.p2, lambda_home: p.lambdaHome, lambda_away: p.lambdaAway,
      pick: p.pick, top_pick: p.topPick, confidence: p.confidence, complete: p.complete,
      factors: JSON.parse(JSON.stringify(p.factors)), explanation: p.explanation, model_version: MODEL_VERSION,
      kickoff: g.kickoff, generated_at: new Date().toISOString(),
    });
    if (error) await log(db, "predicao", false, `Jogo ${g.seq}: ${error.message}`);
  }
}
