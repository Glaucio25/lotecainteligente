import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDashboard, refreshDashboard } from "@/lib/loteca/api.functions";
import { GameCard } from "@/components/loteca/GameCard";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/loteca/format";
import { Button } from "@/components/ui/button";

export const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
  refetchInterval: (q) => (q.state.data?.games.some((g) => g.state === "in") ? 60_000 : 300_000),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loteca Inteligente – próximo concurso, jogos ao vivo e prognósticos" },
      { name: "description", content: "Os 14 jogos do próximo concurso da Loteca com placares ao vivo e prognósticos estatísticos gratuitos." },
      { property: "og:title", content: "Loteca Inteligente – ao vivo + prognósticos" },
      { property: "og:description", content: "Acompanhe os 14 jogos da Loteca ao vivo e veja as probabilidades de cada confronto." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const c = data.contest;
  const live = data.games.filter((g) => g.state === "in").length;
  const refresh = async () => {
    setBusy(true);
    try { qc.setQueryData(["dashboard"], await refreshDashboard()); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Próximo concurso</p>
          <h1 className="font-display text-6xl font-bold uppercase leading-none md:text-7xl">
            Loteca {c ? <span className="text-primary">#{c.number}</span> : "—"}
          </h1>
          {c && (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div><dt className="text-muted-foreground">Prêmio estimado</dt><dd className="font-semibold">{fmtMoney(c.estimated_prize)}</dd></div>
              <div><dt className="text-muted-foreground">Apostas até</dt><dd className="font-semibold">{fmtDate(c.bet_end)}</dd></div>
              <div><dt className="text-muted-foreground">Jogos</dt><dd className="font-semibold">{fmtDate(c.games_start)} – {fmtDate(c.games_end)}</dd></div>
              <div><dt className="text-muted-foreground">Apuração</dt><dd className="font-semibold">{fmtDate(c.draw_date)}</dd></div>
            </dl>
          )}
        </div>
        <aside className="rounded-lg border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{live ? <span className="text-live">● {live} jogo(s) ao vivo</span> : "Nenhum jogo ao vivo"}</span>
            <Button size="sm" variant="secondary" onClick={refresh} disabled={busy}>{busy ? "Atualizando…" : "Atualizar"}</Button>
          </div>
          <p className="mt-3 text-muted-foreground">Última atualização: {fmtTime(data.sync.lastOk)}</p>
          {data.sync.lastError && <p className="mt-2 text-xs text-away">Aviso: {data.sync.lastError}</p>}
          <p className="mt-3 text-xs text-muted-foreground">Dados oficiais da Caixa; placares de fonte pública gratuita. Atualização automática a cada 1–5 min.</p>
        </aside>
      </section>

      {!c?.official_published || data.games.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <h2 className="font-display text-3xl uppercase">Programação ainda não publicada</h2>
          <p className="mt-2 text-muted-foreground">A Caixa ainda não divulgou os 14 jogos do concurso {c?.number ?? ""}. Assim que sair, eles aparecem aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.games.map((g) => <GameCard key={g.seq} g={g} />)}
        </div>
      )}
      <p className="mt-8 text-center text-xs text-muted-foreground">Prognósticos são estimativas estatísticas, sem garantia de acerto. Jogue com responsabilidade. Proibido para menores de 18 anos.</p>
    </div>
  );
}
