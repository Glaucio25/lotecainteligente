# Lotecainteligente

# PROJETO: LOTECA INTELIGENTE – AO VIVO + PROGNÓSTICOS IA

Desenvolva uma plataforma web completa, profissional e responsiva chamada **LOTECA INTELIGENTE**, especializada nos concursos da Loteca da Caixa Econômica Federal.

O objetivo é oferecer acompanhamento dos jogos em tempo real, consulta do próximo concurso e prognósticos inteligentes para os 14 confrontos.

**REGRA FUNDAMENTAL: utilizar exclusivamente APIs gratuitas, fontes públicas e serviços com plano gratuito permanente. Não contratar APIs, não criar dependências pagas e não utilizar dados fictícios.**

## 1. TELA PRINCIPAL – MOSTRAR IMEDIATAMENTE O PRÓXIMO CONCURSO

A página inicial deve abrir diretamente com o próximo concurso disponível da Loteca.

Não colocar uma tela de boas-vindas, menu vazio ou necessidade de clicar para consultar os jogos.

No topo apresentar:

- Logo LOTECA INTELIGENTE.
- Número do próximo concurso.
- Data prevista do concurso.
- Status de publicação dos confrontos.
- Quantidade de jogos cadastrados.
- Botão de atualizar dados.

Logo abaixo, mostrar os 14 jogos em cards individuais.

Cada card deverá apresentar:

- Número oficial do jogo (01 a 14).
- Escudo dos clubes.
- Nome completo dos times.
- Campeonato.
- Data e horário.
- Local da partida, quando disponível.
- Situação da partida.
- Prognóstico 1, X ou 2, quando disponível.

Se o concurso ainda não estiver oficialmente publicado, mostrar os jogos como aguardando divulgação. Nunca preencher confrontos com partidas inventadas.

## 2. PLACARES EM TEMPO REAL

A tela principal deve possuir um painel de placares atualizado automaticamente.

Criar três categorias:

### AO VIVO
Exibir primeiro as partidas em andamento.

Mostrar:
- Escudos dos clubes.
- Placar atual.
- Minuto da partida.
- Primeiro ou segundo tempo.
- Acréscimos.
- Intervalo.
- Eventos de gols.
- Cartões, quando disponíveis.

Destacar visualmente os jogos ao vivo com indicador verde pulsante.

### ENCERRADOS
Exibir partidas finalizadas, com:
- Placar final.
- Resultado 1, X ou 2.
- Horário de encerramento, quando disponível.

### A JOGAR
Exibir partidas que ainda não começaram:
- Data.
- Horário.
- Contagem regressiva.
- Escudos e nomes dos clubes.

Ordenar automaticamente conforme o horário das partidas, mantendo o número oficial da Loteca visível.

### Atualização
- Consultar os dados automaticamente.
- Atualizar placares preferencialmente a cada 60 segundos, respeitando as cotas gratuitas.
- Não fazer uma requisição independente para cada visitante.
- Utilizar cache no servidor e centralizar as consultas.
- Mostrar a última atualização.
- Em caso de falha, preservar os últimos dados válidos e informar que a atualização está temporariamente indisponível.

## 3. NOVA FUNÇÃO – PROGNÓSTICOS COM INTELIGÊNCIA ARTIFICIAL

Criar uma seção de destaque chamada:

**PALPITES INTELIGENTES – ANÁLISE DOS 14 JOGOS**

Essa será uma das principais funcionalidades da plataforma.

Para cada jogo, a inteligência deverá analisar os seguintes fatores, sempre que houver dados disponíveis:

1. Desempenho dos últimos 5 e 10 jogos.
2. Vitórias, empates e derrotas.
3. Desempenho como mandante.
4. Desempenho como visitante.
5. Gols marcados.
6. Gols sofridos.
7. Média de gols por partida.
8. Histórico de confrontos diretos.
9. Classificação no campeonato.
10. Momento atual das equipes.
11. Desfalques e suspensões, somente quando houver fonte confiável.

### Gerar três possibilidades de resultado

Para cada confronto, calcular:

- Probabilidade de vitória do mandante (1).
- Probabilidade de empate (X).
- Probabilidade de vitória do visitante (2).

Exemplo ilustrativo:

CORINTHIANS x PALMEIRAS

- 1 – Vitória do Corinthians: 38%.
- X – Empate: 30%.
- 2 – Vitória do Palmeiras: 32%.

<escape>**PROGNÓSTICO PRINCIPAL: 1X**</escape>

Apresentar também:
- Grau de confiança: baixo, médio ou alto.
- Justificativa da análise.
- Principal fator favorável a cada equipe.
- Possibilidade de empate.
- Data e horário da geração do prognóstico.

As porcentagens devem somar 100% e ser calculadas por um modelo estatístico consistente, não por números aleatórios.

### Modelo de inteligência

Começar com um modelo estatístico gratuito, utilizando:
- Média móvel de desempenho.
- Peso maior para jogos recentes.
- Desempenho mandante/visitante.
- Força ofensiva e defensiva.
- Modelo de Poisson para estimativa de gols.
- Distribuição de probabilidades para 1, X e 2.

Utilizar um modelo de classificação estatística que possa ser aprimorado conforme novos dados sejam armazenados.

A IA deverá explicar os motivos do prognóstico em linguagem simples.

Não afirmar que o modelo utiliza aprendizado de máquina se estiver utilizando apenas regras fixas.

Não inventar estatísticas quando os dados não estiverem disponíveis. Nesses casos, sinalizar análise incompleta e reduzir a confiança.

A funcionalidade deve operar sem exigir contratação de uma API de IA. Deixar integração com um modelo de linguagem gratuito como recurso opcional e substituível, caso exista uma cota gratuita disponível.

## 4. GERADOR DE VOLANTE INTELIGENTE

Criar uma funcionalidade chamada:

**GERAR MEU PROGNÓSTICO**

O usuário poderá escolher:

- Palpites simples.
- Palpites duplos.
- Palpites triplos.

O sistema deverá utilizar as probabilidades calculadas para montar combinações para os 14 jogos.

Permitir três estratégias:

**CONSERVADORA**
Priorizar resultados com maior probabilidade individual.

**EQUILIBRADA**
Combinar favoritos, empates e surpresas com critérios estatísticos.

**ARRISCADA**
Explorar resultados menos prováveis, mas com justificativa estatística.

Exibir:
- Os 14 palpites.
- Quantidade de duplos.
- Quantidade de triplos.
- Quantidade total de combinações.
- Estimativa de custo do volante conforme a tabela oficial da Caixa, quando disponível.
- Probabilidades estimadas e limitações da estimativa.

Permitir gerar novas combinações e salvar os palpites.

Não garantir premiações nem apresentar previsões como certezas.

## 5. ANÁLISE GERAL DO CONCURSO

Criar um painel com:

- Favoritos do concurso.
- Jogos com maior equilíbrio.
- Jogos com maior probabilidade de empate.
- Possíveis zebras.
- Jogos com maior incerteza.
- Jogos recomendados para duplo.
- Jogos recomendados para triplo.

Criar um resumo da IA:

"ANÁLISE GERAL DO CONCURSO"

Exemplo de texto:
"Este concurso apresenta três confrontos bastante equilibrados. Dois jogos apresentam tendência de empate e quatro equipes aparecem como favoritas com maior vantagem estatística."

O texto deve ser gerado a partir dos dados reais analisados.

## 6. ACOMPANHAMENTO DOS 14 RESULTADOS

Criar um painel visual com os 14 jogos.

Quando os jogos terminarem, atualizar automaticamente:

- Resultado de cada partida.
- Quantidade de resultados definidos.
- Quantidade de jogos pendentes.
- Acertos do prognóstico gerado.
- Comparação entre o palpite e o resultado real.

Criar indicadores de:
- 14 acertos.
- 13 acertos.
- 12 acertos.
- Demais faixas de acertos, quando aplicáveis.

## 7. HISTÓRICO E ESTATÍSTICAS

Criar uma página de histórico contendo concursos anteriores.

Permitir consultar:
- Número do concurso.
- Data.
- Os 14 jogos.
- Resultados oficiais.
- Prognósticos que foram gerados antes dos jogos.
- Desempenho histórico do modelo.
- Percentual de acertos em 1, X e 2.
- Evolução da precisão dos prognósticos.

Registrar os prognósticos antes do início das partidas, para impedir que o sistema altere previsões antigas depois de conhecer os resultados.

## 8. APIS E FONTES DE DADOS – SOMENTE GRATUITAS

Desenvolver uma arquitetura de integração modular.

### Fonte de resultados esportivos

Priorizar:

**API-Football / API-Sports**
- Utilizar o plano gratuito de US$ 0.
- Consultar partidas, placares, eventos e estatísticas conforme disponibilidade.
- Guardar a chave de API em variável secreta no backend.
- Respeitar o limite de requisições gratuitas.
- Não fazer chamadas diretamente do navegador expondo a chave.

Site: https://www.api-football.com/

### Fontes alternativas

Avaliar:
- TheSportsDB: https://www.thesportsdb.com/
- OpenLigaDB: https://www.openligadb.de/

Usar apenas os campeonatos efetivamente cobertos por cada fonte.

Não considerar uma fonte alternativa como substituta automática para os campeonatos brasileiros sem verificar sua cobertura.

### Loteca e Caixa

Utilizar fontes oficiais e públicas para:
- Identificação do concurso.
- Relação dos 14 confrontos.
- Calendário.
- Resultados oficiais.

Consultar o portal oficial da Caixa:
https://loterias.caixa.gov.br/

Se não houver endpoint público disponível, implementar um módulo de importação e atualização administrativa dos dados oficiais.

Não presumir a existência de uma API oficial da Caixa sem verificar sua disponibilidade.

### Regra de associação dos jogos

Criar uma tabela de correspondência que vincule:

- Número do concurso.
- Número do jogo da Loteca.
- Time mandante.
- Time visitante.
- Campeonato.
- Identificador da partida na API esportiva.

Essa associação deve ser validada antes de exibir qualquer placar.

Nunca associar partidas apenas porque os nomes dos times são semelhantes.

## 9. ESTRUTURA TÉCNICA

Utilizar:
- React.
- TypeScript.
- Tailwind CSS.
- Supabase para banco de dados.
- Supabase Edge Functions para integrações.
- Componentes reutilizáveis.
- Layout responsivo.

Criar tabelas para:
- Concursos.
- Jogos da Loteca.
- Clubes.
- Campeonatos.
- Partidas esportivas.
- Resultados.
- Prognósticos.
- Histórico de previsões.
- Palpites dos usuários.
- Configurações de API.

Utilizar variáveis de ambiente e Secrets do Supabase para armazenar chaves.

Não deixar chaves privadas no frontend.

## 10. AUTOMAÇÃO E ECONOMIA DE REQUISIÇÕES

Implementar:
- Cache de partidas e resultados.
- Atualização centralizada.
- Consulta de jogos somente quando necessário.
- Armazenamento dos últimos resultados.
- Controle de limites das APIs.
- Tratamento de erros.
- Registro de falhas.
- Identificação de dados desatualizados.

Durante períodos sem partidas, diminuir a frequência de consultas.

Durante jogos ao vivo, priorizar atualizações dentro da cota disponível.

Nunca prometer atualização instantânea quando a fonte gratuita não oferecer essa velocidade.

## 11. DESIGN DA PLATAFORMA

Criar um design moderno, com aparência de portal esportivo profissional.

Identidade visual:
- Fundo preto ou azul-marinho.
- Verde para jogos ao vivo.
- Branco para placares.
- Amarelo para destaques de prognósticos.
- Vermelho para alertas.
- Cards modernos.
- Escudos dos clubes.
- Tipografia esportiva.
- Animações discretas para gols e atualizações.

Menu principal:
1. Início.
2. Próximo concurso.
3. Jogos ao vivo.
4. Prognósticos IA.
5. Gerador de volante.
6. Histórico.
7. Estatísticas.

## 12. REQUISITOS DE ENTREGA

Entregar um sistema funcional, conectado ao banco de dados e às fontes de dados reais.

Não entregar somente telas demonstrativas.

Não preencher a interface com placares fictícios.

Não utilizar dados simulados em produção.

Se uma integração ainda não estiver configurada, exibir claramente o que está faltando.

Prioridades de desenvolvimento:

1. Identificar automaticamente o próximo concurso.
2. Exibir os 14 jogos corretos.
3. Mostrar placares reais em tempo real.
4. Gerar prognósticos estatísticos.
5. Gerar volantes com simples, duplos e triplos.
6. Armazenar histórico e medir a precisão da IA.

**RESULTADO FINAL:** Quero uma plataforma em que o visitante abra o site e já encontre o próximo concurso da Loteca, consiga acompanhar os jogos ao vivo e tenha acesso a uma análise inteligente dos 14 confrontos para montar seus próprios prognósticos.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lotecainteligente.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e16e9d91-6ebd-4623-95ad-1ec8f68144ad).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
