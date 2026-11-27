import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { dashboardQuery } from "./index";
import { generateTicket, ticketCost, validateTicket, type Outcome, type Strategy } from "@/lib/loteca/model";
import { listTickets, saveTicket } from "@/lib/loteca/api.functions";
import { getDeviceId } from "@/lib/loteca/device";
import { fmtMoney, fmtTime } from "@/lib/loteca/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/volante")({
  head: () => ({
    meta: [
      { title: "Gerador de volante – Loteca Inteligente" },
      { name: "description", content: "Monte seu volante da Loteca com simples, duplos e triplos a partir das probabilidades estatísticas." },
      { property: "og:title", content: "Gerador de volante da Loteca" },
      { property: "og:description", content: "Estratégias conservadora, equilibrada e arriscada com custo calculado." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: Volante,
});

const OUTS: Outcome[] = ["1", "X", "2"];

function Volante() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const [strategy, setStrategy] = useState<Strategy>("equilibrada");
  const [doubles, setDoubles] = useState(2);
  const [triples, setTriples] = useState(0);
  const [seed, setSeed] = useState(1);
  const [manual, setManual] = useState<Record<number, Outcome[]> | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  if (typeof window !== "undefined" && !deviceId) queueMicrotask(() => setDeviceId(getDeviceId()));
  const tickets = useQuery({ queryKey: ["tickets", deviceId], queryFn: () => listTickets({ data: { deviceId: deviceId! } }), enabled: !!deviceId });

  const probs = data.games.map((g) => g.prediction ? { seq: g.seq, p1: g.prediction.p1, px: g.prediction.px, p2: g.prediction.p2 } : { seq: g.seq, p1: 40, px: 30, p2: 30 });
  const err = validateTicket(doubles, triples);
  const gen = useMemo(() => (probs.length === 14 && !err ? generateTicket(probs, strategy, doubles, triples, seed) : null), [JSON.stringify(probs), strategy, doubles, triples, seed, err]);
  const picks = data.games.map((g) => ({ seq: g.seq, outcomes: manual?.[g.seq] ?? gen?.picks.find((p) => p.seq === g.seq)?.outcomes ?? [], reason: manual ? "Ajuste manual" : gen?.picks.find((p) => p.seq === g.seq)?.reason ?? "" }));
  const d = picks.filter((p) => p.outcomes.length === 2).length, t = picks.filter((p) => p.outcomes.length === 3).length;
  const cost = ticketCost(d, t);
  const curErr = picks.some((p) => !p.outcomes.length) ? "Marque ao menos um resultado em cada jogo." : validateTicket(d, t);

  const toggle = (seq: number, o: Outcome) => {
    const base = Object.fromEntries(picks.map((p) => [p.seq, [...p.outcomes]])) as Record<number, Outcome[]>;
    const cur = base[seq] ?? [];
    base[seq] = cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o].sort((a, b) => "1X2".indexOf(a) - "1X2".indexOf(b));
    setManual(base);
  };
  const save = async () => {
    if (!deviceId || !data.contest || curErr) return;
    try {
      await saveTicket({ data: { deviceId, contest: data.contest.number, strategy: manual ? "manual" : strategy, picks: picks.map(({ seq, outcomes }) => ({ seq, outcomes })), doubles: d, triples: t, combinations: cost.combinations, cost: cost.cost } });
      toast.success("Volante salvo neste dispositivo");
      tickets.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  if (data.games.length !== 14) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="font-display text-4xl uppercase">Volante indisponível</h1><p className="mt-2 text-muted-foreground">Os 14 jogos do próximo concurso ainda não foram publicados pela Caixa.</p></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-bold uppercase">Gerador de volante</h1>
      <p className="mt-1 text-muted-foreground">Concurso #{data.contest?.number}. Clique nos resultados para ajustar à mão.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-border">
          {data.games.map((g, i) => {
            const p = picks[i]!;
            return (
              <div key={g.seq} className="flex items-center gap-3 border-b border-border bg-card px-3 py-2 last:border-0">
                <span className="w-6 font-mono text-xs text-muted-foreground">{String(g.seq).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.home_name} × {g.away_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.reason}{g.prediction ? "" : " · sem prognóstico (probabilidade neutra)"}</p>
                </div>
                {OUTS.map((o) => {
                  const on = p.outcomes.includes(o);
                  const pct = g.prediction ? (o === "1" ? g.prediction.p1 : o === "X" ? g.prediction.px : g.prediction.p2) : null;
                  return (
                    <button key={o} onClick={() => toggle(g.seq, o)} aria-pressed={on}
                      className={`h-10 w-12 rounded border font-mono text-sm font-bold transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}>
                      {o}{pct != null && <span className="block text-[10px] font-normal leading-none">{pct}%</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-2 font-display text-xl uppercase">Estratégia</h2>
            <div className="grid grid-cols-3 gap-1">
              {(["conservadora", "equilibrada", "arriscada"] as Strategy[]).map((s) => (
                <Button key={s} size="sm" variant={strategy === s && !manual ? "default" : "secondary"} onClick={() => { setStrategy(s); setManual(null); }} className="capitalize">{s}</Button>
              ))}
            </div>
            <label className="mt-4 block text-sm">Duplos: <b>{doubles}</b>
              <input type="range" min={0} max={9} value={doubles} onChange={(e) => { setDoubles(+e.target.value); setManual(null); }} className="w-full accent-primary" /></label>
            <label className="mt-2 block text-sm">Triplos: <b>{triples}</b>
              <input type="range" min={0} max={6} value={triples} onChange={(e) => { setTriples(+e.target.value); setManual(null); }} className="w-full accent-primary" /></label>
            {err && <p className="mt-2 text-xs text-away">{err}</p>}
            <Button variant="secondary" className="mt-3 w-full" onClick={() => { setSeed((s) => s + 1); setManual(null); }}>Gerar outra variação</Button>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="flex justify-between"><span>Simples / duplos / triplos</span><b>{14 - d - t} / {d} / {t}</b></div>
            <div className="flex justify-between"><span>Combinações</span><b>{cost.combinations}</b></div>
            <div className="flex justify-between text-lg"><span>Custo</span><b className="text-primary">{fmtMoney(cost.cost)}</b></div>
            {gen && !manual && <p className="mt-2 text-xs text-muted-foreground">Acertos esperados: {gen.expectedHits.toFixed(1)} de 14</p>}
            {curErr && <p className="mt-2 text-xs text-away">{curErr}</p>}
            <Button className="mt-3 w-full" onClick={save} disabled={!!curErr || !deviceId}>Salvar volante</Button>
            <p className="mt-2 text-xs text-muted-foreground">A aposta deve ser feita em lotérica ou no site oficial da Caixa.</p>
          </div>
          {!!tickets.data?.length && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <h2 className="mb-2 font-display text-xl uppercase">Meus volantes</h2>
              <ul className="space-y-2">
                {tickets.data.map((tk) => (
                  <li key={tk.id} className="border-b border-border pb-2 last:border-0">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>#{tk.contest} · {tk.strategy}</span><span>{fmtTime(tk.created_at)}</span></div>
                    <p className="font-mono text-xs">{(tk.picks as { outcomes: string[] }[]).map((p) => p.outcomes.join("")).join(" ")}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
