import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Como funcionam os prognósticos – Loteca Inteligente" },
      { name: "description", content: "Modelo estatístico de Poisson ponderado, fontes de dados gratuitas e limitações dos prognósticos da Loteca." },
      { property: "og:title", content: "Metodologia dos prognósticos da Loteca" },
      { property: "og:description", content: "Entenda o modelo, as fontes e os limites das previsões." },
    ],
  }),
  component: Metodologia,
});

function Metodologia() {
  const items: [string, string][] = [
    ["Fontes oficiais", "A programação e os resultados oficiais vêm da API pública da Caixa Econômica Federal. Os placares ao vivo, escudos e históricos vêm de uma fonte esportiva pública e gratuita."],
    ["Associação dos jogos", "Cada confronto da Caixa é ligado à partida correta comparando nomes dos times e data. Se houver dúvida, o jogo fica marcado como pendente em vez de mostrar um placar errado."],
    ["Modelo estatístico", "Usamos um modelo de Poisson: estimamos os gols esperados de cada time a partir dos últimos jogos (com mais peso para os recentes), desempenho em casa e fora, confronto direto e posição na tabela. Disso saem as probabilidades de 1, X e 2."],
    ["Confiança", "A confiança é alta quando um resultado se destaca e há bastante histórico; baixa quando os números são parecidos ou faltam dados."],
    ["Volantes", "O gerador coloca triplos e duplos nos jogos mais incertos e respeita os limites e preços da Caixa."],
    ["Limitações", "Futebol é imprevisível. Lesões, escalações e motivação não entram no modelo. Os prognósticos não garantem acerto nem lucro."],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-5xl font-bold uppercase">Como funciona</h1>
      <div className="mt-6 space-y-5">
        {items.map(([t, d]) => (
          <section key={t} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-2xl uppercase text-primary">{t}</h2>
            <p className="mt-1 leading-relaxed text-muted-foreground">{d}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">Site independente, sem vínculo com a Caixa. Jogue com responsabilidade. Proibido para menores de 18 anos.</p>
    </div>
  );
}
