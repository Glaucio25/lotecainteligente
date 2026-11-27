import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getHistory } from "@/lib/loteca/api.functions";
import { fmtDate } from "@/lib/loteca/format";

const historyQuery = queryOptions({ queryKey: ["history"], queryFn: () => getHistory() });

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico e precisão – Loteca Inteligente" },
      { name: "description", content: "Resultados oficiais dos concursos anteriores da Loteca e taxa de acerto dos prognósticos." },
      { property: "og:title", content: "Histórico da Loteca e precisão dos prognósticos" },
      { property: "og:description", content: "Compare os prognósticos com os resultados oficiais da Caixa." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(historyQuery),
  component: Historico,
});

function Historico() {
  const { data } = useSuspenseQuery(historyQuery);
  const pred = new Map(data.predictions.map((p) => [`${p.contest}-${p.seq}`, p]));
  let total = 0, hitTop = 0, hitPick = 0;
  for (const g of data.games) {
    const p = pred.get(`${g.contest}-${g.seq}`);
    if (!p || !g.official_result) continue;
    total++; if (p.top_pick === g.official_result) hitTop++; if (p.pick.includes(g.official_result)) hitPick++;
  }
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "—");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-bold uppercase">Histórico e precisão</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Jogos avaliados", String(total)], ["Acerto do favorito", pct(hitTop)], ["Acerto do palpite (c/ duplos)", pct(hitPick)]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{k}</p><p className="font-display text-4xl font-bold text-primary">{v}</p></div>
        ))}
      </div>
      {total === 0 && <p className="mt-3 text-sm text-muted-foreground">A precisão começa a ser medida quando um concurso com prognósticos for apurado pela Caixa.</p>}
      <div className="mt-8 space-y-6">
        {data.contests.map((c) => {
          const games = data.games.filter((g) => g.contest === c.number).sort((a, b) => a.seq - b.seq);
          return (
            <section key={c.number} className="rounded-lg border border-border bg-card">
              <header className="flex justify-between border-b border-border px-4 py-2"><h2 className="font-display text-2xl uppercase">Concurso #{c.number}</h2><span className="text-sm text-muted-foreground">{fmtDate(c.draw_date)}</span></header>
              <table className="w-full text-sm">
                <tbody>
                  {games.map((g) => {
                    const p = pred.get(`${g.contest}-${g.seq}`);
                    const ok = p && g.official_result ? p.pick.includes(g.official_result) : null;
                    return (
                      <tr key={g.seq} className="border-b border-border last:border-0">
                        <td className="w-8 px-3 py-1.5 font-mono text-xs text-muted-foreground">{g.seq}</td>
                        <td className="py-1.5">{g.home_name} <b className="font-mono">{g.official_home_goals ?? "-"}×{g.official_away_goals ?? "-"}</b> {g.away_name}</td>
                        <td className="px-2 font-mono font-bold">{g.official_result ?? "—"}</td>
                        <td className="px-3 text-right text-xs">{p ? <span className={ok ? "text-primary" : "text-away"}>{p.pick} {ok ? "✔" : "✘"}</span> : <span className="text-muted-foreground">sem prog.</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </div>
  );
}
