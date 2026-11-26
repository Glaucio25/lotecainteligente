import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

export type Game = Database["public"]["Tables"]["loteca_games"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type Contest = Database["public"]["Tables"]["contests"]["Row"];
export type GameWithPred = Game & { prediction: Prediction | null };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadDashboard(force: boolean) {
  const db = await admin();
  let syncError: string | null = null;
  try {
    const { maybeSync } = await import("./sync.server");
    await maybeSync(db, force);
  } catch (e) { syncError = (e as Error).message; }
  const { data: contest } = await db.from("contests").select("*").eq("status", "proximo").order("number", { ascending: false }).limit(1).maybeSingle();
  const { data: lastResult } = await db.from("contests").select("*").eq("results_official", true).order("number", { ascending: false }).limit(1).maybeSingle();
  const [{ data: games }, { data: preds }, { data: sync }] = await Promise.all([
    contest ? db.from("loteca_games").select("*").eq("contest", contest.number).order("seq") : Promise.resolve({ data: [] as Game[] }),
    contest ? db.from("predictions").select("*").eq("contest", contest.number) : Promise.resolve({ data: [] as Prediction[] }),
    db.from("sync_state").select("*").eq("key", "main").maybeSingle(),
  ]);
  const pm = new Map((preds ?? []).map((p) => [p.seq, p]));
  return {
    contest: contest ?? null,
    lastResult: lastResult ?? null,
    games: (games ?? []).map((g) => ({ ...g, prediction: pm.get(g.seq) ?? null })) as GameWithPred[],
    sync: { lastRun: sync?.last_run ?? null, lastOk: sync?.last_ok ?? null, lastError: sync?.last_error ?? syncError },
    serverTime: new Date().toISOString(),
  };
}
export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;

export const getDashboard = createServerFn({ method: "GET" }).handler(() => loadDashboard(false));
export const refreshDashboard = createServerFn({ method: "POST" }).handler(() => loadDashboard(true));

export const getHistory = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data: contests } = await db.from("contests").select("*").eq("results_official", true).order("number", { ascending: false }).limit(30);
  const nums = (contests ?? []).map((c) => c.number);
  const [{ data: games }, { data: preds }] = await Promise.all([
    db.from("loteca_games").select("contest,seq,home_name,away_name,game_date,official_home_goals,official_away_goals,official_result,home_logo,away_logo").in("contest", nums.length ? nums : [-1]),
    db.from("predictions").select("contest,seq,p1,px,p2,pick,top_pick,confidence,generated_at,kickoff").in("contest", nums.length ? nums : [-1]),
  ]);
  return { contests: contests ?? [], games: games ?? [], predictions: preds ?? [] };
});

type Pick = { seq: number; outcomes: string[] };
export const saveTicket = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceId: string; contest: number; strategy: string; picks: Pick[]; doubles: number; triples: number; combinations: number; cost: number }) => {
    if (!/^[a-z0-9-]{8,64}$/i.test(d.deviceId)) throw new Error("Dispositivo inválido");
    if (!Array.isArray(d.picks) || d.picks.length !== 14) throw new Error("O volante precisa de 14 palpites");
    if (!d.picks.every((p) => p.outcomes.length >= 1 && p.outcomes.every((o) => ["1", "X", "2"].includes(o)))) throw new Error("Palpite inválido");
    if (!["conservadora", "equilibrada", "arriscada", "manual"].includes(d.strategy)) throw new Error("Estratégia inválida");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const doubles = data.picks.filter((p) => p.outcomes.length === 2).length;
    const triples = data.picks.filter((p) => p.outcomes.length === 3).length;
    const combinations = 2 ** doubles * 3 ** triples;
    const { error } = await db.from("user_tickets").insert({
      device_id: data.deviceId, contest: data.contest, strategy: data.strategy, picks: data.picks,
      doubles, triples, combinations, cost: Math.max(4, combinations * 2),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTickets = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceId: string }) => {
    if (!/^[a-z0-9-]{8,64}$/i.test(d.deviceId)) throw new Error("Dispositivo inválido");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows } = await db.from("user_tickets").select("*").eq("device_id", data.deviceId).order("created_at", { ascending: false }).limit(20);
    return rows ?? [];
  });
