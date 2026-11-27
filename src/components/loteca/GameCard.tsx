import type { GameWithPred } from "@/lib/loteca/api.functions";
import { fmtTime, fmtDate } from "@/lib/loteca/format";

export function ProbBar({ p1, px, p2 }: { p1: number; px: number; p2: number }) {
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-home" style={{ width: `${p1}%` }} />
        <div className="bg-draw" style={{ width: `${px}%` }} />
        <div className="bg-away" style={{ width: `${p2}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs">
        <span className="text-home">1 · {p1}%</span>
        <span className="text-draw">X · {px}%</span>
        <span className="text-away">2 · {p2}%</span>
      </div>
    </div>
  );
}

function Team({ name, logo, align }: { name: string; logo: string | null; align: "l" | "r" }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === "r" ? "flex-row-reverse text-right" : ""}`}>
      {logo ? <img src={logo} alt="" className="h-8 w-8 shrink-0 object-contain" loading="lazy" /> : <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />}
      <span className="truncate font-display text-lg font-semibold uppercase tracking-wide">{name}</span>
    </div>
  );
}

type Ev = { type: string; minute: string; side: string; player: string | null; penalty?: boolean; ownGoal?: boolean };

export function GameCard({ g }: { g: GameWithPred }) {
  const live = g.state === "in";
  const done = g.state === "post";
  const p = g.prediction;
  const evs = (Array.isArray(g.events) ? g.events : []) as Ev[];
  const res = done && g.home_score != null && g.away_score != null ? (g.home_score > g.away_score ? "1" : g.home_score === g.away_score ? "X" : "2") : null;
  return (
    <article className={`rounded-lg border bg-card p-4 ${live ? "border-live" : "border-border"}`}>
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono">JOGO {String(g.seq).padStart(2, "0")}</span>
        <span className="truncate">{g.league_name ?? ""}</span>
        {live ? (
          <span className="flex items-center gap-1 font-semibold text-live"><span className="h-2 w-2 animate-pulse rounded-full bg-live" />AO VIVO {g.clock}</span>
        ) : done ? <span className="font-semibold">ENCERRADO</span> : <span>{g.kickoff ? fmtTime(g.kickoff) : fmtDate(g.game_date)}</span>}
      </div>
      <div className="flex items-center gap-3">
        <Team name={g.home_name} logo={g.home_logo} align="l" />
        <div className="shrink-0 rounded bg-secondary px-3 py-1 font-mono text-xl font-bold tabular-nums">
          {g.home_score ?? "-"} : {g.away_score ?? "-"}
        </div>
        <Team name={g.away_name} logo={g.away_logo} align="r" />
      </div>
      {evs.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {evs.slice(-6).map((e, i) => (
            <li key={i} className={e.side === "away" ? "text-right" : ""}>
              {e.type === "gol" ? "⚽" : e.type === "vermelho" ? "🟥" : "🟨"} {e.minute} {e.player}{e.penalty ? " (pên.)" : ""}{e.ownGoal ? " (contra)" : ""}
            </li>
          ))}
        </ul>
      )}
      {g.venue && <p className="mt-2 truncate text-xs text-muted-foreground">📍 {g.venue}</p>}
      <div className="mt-3 border-t border-border pt-3">
        {p ? (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Prognóstico: <b className="font-mono text-primary">{p.pick}</b>{res && <span className={`ml-2 text-xs ${p.pick.includes(res) ? "text-primary" : "text-away"}`}>{p.pick.includes(res) ? "✔ acertou" : "✘ errou"}</span>}</span>
              <span className="text-xs text-muted-foreground">confiança {p.confidence}</span>
            </div>
            <ProbBar p1={p.p1} px={p.px} p2={p.p2} />
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">Por que esse palpite?</summary>
              <p className="mt-1 leading-relaxed">{p.explanation}</p>
            </details>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {g.match_status === "validado" ? "Prognóstico sendo calculado…" : g.match_note ?? "Aguardando associação com a fonte de placares."}
          </p>
        )}
      </div>
    </article>
  );
}
