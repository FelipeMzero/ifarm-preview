# Relatório de Implementação: KPIs do Painel e Projeções Preditivas (Dashboard)

## 1. Visão Geral

Implementação do módulo de **Dashboard / Painel Gerencial** do iFarm, integrando indicadores zootécnicos, monitoramento de pastagens e algoritmos preditivos lineares para abate, inspirados no modelo de pecuária de precisão.

A funcionalidade foi construída seguindo a arquitetura de fatias verticais, com regras de negócio puras testadas no servidor, tipagem estrita no `@ifarm/shared` e interface responsiva com Recharts e Tailwind CSS no `@ifarm/web`.

---

## 2. Indicadores e Funcionalidades Implementadas

### 2.1 KPIs Principais (`DashboardKpis`)

- **Total de Animais**: Contagem dos animais ativos da propriedade, detalhando machos e fêmeas.
- **Lotes Ativos**: Contagem dos lotes vigentes de manejo.
- **Peso Médio**: Média dos pesos atuais dos animais ativos aferidos em pesagens.
- **GMD Médio (kg/dia)**: Ganho Médio Diário do rebanho a partir de regressões lineares e pesagens históricas.
- **Taxa de Lotação (UA/ha)**: Relação entre a Unidade Animal total ($1\text{ UA} = 450\text{ kg}$) e a área em hectares das pastagens.
- **Pastos Prontos**: Contagem das áreas livres cujo tempo de descanso decorrido atingiu ou superou o período mínimo exigido.

### 2.2 Status das Pastagens (`PastureStatusChart`)

- Gráfico Donut (Recharts) indicando:
  - **Disponível**: Áreas sem lote com período de descanso cumprido.
  - **Ocupada**: Áreas com lote vigente atualmente.
  - **Em Descanso**: Áreas liberadas recentemente ainda cumprindo período mínimo de recuperação.

### 2.3 Distribuição por Categoria (`CategoryDistributionChart`)

- Gráfico de barras horizontais categorizando os animais conforme parâmetros zootécnicos usuais:
  - Bezerros / Bezerras ($< 1$ ano)
  - Garrotes / Novilhas ($1$ a $2$ anos)
  - Bois Castrados ($> 2$ anos)
  - Touros Inteiros ($> 2$ anos)
  - Vacas ($> 2$ anos)

### 2.4 Evolução do Peso Médio — Últimos 6 Meses (`WeightEvolutionChart`)

- Gráfico de área temporal com preenchimento em gradiente exibindo a progressão mensal da média dos pesos aferidos nas pesagens válidas.

### 2.5 Pastos Prontos para Uso (`ReadyPasturesTable`)

- Tabela detalhando as áreas aptas para receber animais:
  - Nome da pastagem
  - Tamanho da área (ha)
  - Taxa de suporte (UA/ha)
  - Capacidade total (UA)
  - Dias em descanso decorridos vs. mínimo recomendado

### 2.6 Projeção de Abate por Predição Linear (`SlaughterProjectionsTable`)

- Algoritmo de Regressão Linear Simples por Mínimos Quadrados ($y = mx + b$):
  - Projeta a data em que os animais mais pesados atingirão o peso alvo de abate ($450\text{ kg}$).
  - Barra de progresso com porcentagem atual em relação ao alvo.
  - Cálculo de dias restantes até o abate com badges coloridos de prioridade.
  - Coeficiente de determinação ($R^2$) medindo o grau de confiança estatística da projeção.

---

## 3. Arquitetura e Estrutura Técnica

### 3.1 Contrato da API (`packages/shared/src/dashboard/`)

- `schema.ts`: Validação de parâmetros de query com Zod (`propertyId` UUID obrigatório).
- `types.ts`: Tipos TypeScript das respostas da API.
- `client.ts`: Cliente HTTP `createDashboardClient`, integrado em `apps/web/src/lib/clients.ts`.

### 3.2 Backend e Regras de Negócio (`apps/api/src/features/dashboard/`)

- `rules.ts`: Funções puras sem dependência de banco:
  - `calculateLinearRegression`: Cálculo de inclinação ($m$), intercepto ($b$) e coeficiente $R^2$.
  - `projectSlaughterDate`: Resolução linear da data estimada de abate.
  - `computePastureStatus`: Classificação de situação das pastagens e cálculo de carência.
  - `categorizeAnimal`: Classificação zootécnica com base na data de nascimento, sexo e castração.
- `rules.test.ts`: Cobertura completa de testes unitários com Vitest.
- `get-dashboard/handler.ts`: Transaction script que lê dados consolidados do Prisma, invoca as regras puras e devolve os dados estruturados.
- `get-dashboard/route.ts`: Endpoint Hono validado com Zod e protegido por sessão.
- `routes.ts`: Roteador montado em `/api/dashboard`.

### 3.3 Frontend (`apps/web/src/features/dashboard/`)

- Componentização modular e responsiva:
  - `DashboardKpis.tsx`
  - `PastureStatusChart.tsx`
  - `CategoryDistributionChart.tsx`
  - `WeightEvolutionChart.tsx`
  - `ReadyPasturesTable.tsx`
  - `SlaughterProjectionsTable.tsx`
  - `Dashboard.tsx`
  - `queries.ts` (TanStack Query)
- Compatibilidade total com layout responsivo (mobile, tablet e desktop).

### 3.4 CI/CD e GitHub Pages (`.github/workflows/deploy-pages.yml`)

- Workflow do GitHub Actions configurado para build automatizado da SPA.
- Suporte a subcaminho relativo (`VITE_BASE_PATH="/ifarm/"`) no Vite e no React Router.
- Fallback para `404.html` garantindo roteamento direto em URLs da SPA no GitHub Pages.

---

## 4. Testes e Qualidade

- **Testes Unitários**: `pnpm test` executado com 100% de aprovação (101 testes no shared + 104 testes na API).
- **Typecheck**: `tsc --noEmit` verificado com 0 erros na API, no Shared e no Web.
- **Lint**: ESLint executado em todos os arquivos modificados sem nenhum erro ou aviso.
- **Formatação**: Código 100% alinhado com o Prettier do monorepo.
