<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Como adicionar uma feature ao iFarm

Monorepo pnpm (use sempre `pnpm`, nunca `npm`/`npx`):

- `apps/web`: Next.js. Telas **e** a API REST (`app/api`) que o web e o mobile consomem; a
  autenticação (`src/lib/auth.ts`, better-auth) e o seed (`scripts/seed.ts`) também ficam aqui.
- `apps/mobile`: Expo / React Native. Consome a mesma API.
- `packages/shared` (`@ifarm/shared`): contrato da API e as poucas regras que o cliente executa.
- `packages/domain` (`@ifarm/domain`): domínio do servidor (consultas, escritas e regras).
  Importado por módulo: `@ifarm/domain/<domínio>/<arquivo>`.
- `packages/db` (`@ifarm/db`): schema do Prisma (`prisma/schema.prisma`), o cliente gerado
  (`@ifarm/db/client`, `@ifarm/db/enums`) e a instância do banco (`prisma`, de `@ifarm/db`). O
  CLI do Prisma roda a partir de `apps/web` (`pnpm prisma …`), apontando para esse schema.

Arquitetura em camadas descrita em `docs/architecture.md`; requisitos de cada módulo em
`docs/requirements/mod-XX-<nome>.md`.

## 1. Antes de escrever

- **Leia, sem alterar,** o requisito do módulo (`docs/requirements/`, e o `comum.md`) e o modelo
  em `packages/db/prisma/schema.prisma`. **Não altere os documentos nem o schema do banco**: se a
  feature precisar disso, pare e informe o que seria necessário.
- Siga um domínio parecido como modelo: `breed` (cadastro simples), `batch` (regras e
  histórico) ou `purchase` (fluxo com situações e valores).
- Use o mesmo nome de domínio em todas as camadas (inglês no código e na API, português só na
  URL da página: `/api/batch` e `/lotes`). Comentários e mensagens ao usuário em português.
- Se a feature estende um mecanismo existente (etapas de manejo, compromissos, situações),
  siga o registro existente em vez de criar um paralelo. Os registros são `Record<…Type, …>`:
  o TypeScript aponta cada lugar que falta.

## 2. Onde cada coisa vai

| O que você está escrevendo                               | Onde vai                                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Dados que o cliente **envia** (corpo de POST/PUT)        | `packages/shared/src/<domínio>/schema.ts`: schema Zod; `XPayload = z.input`, `XData = z.output`                                                 |
| **Filtros e paginação** de uma listagem                  | mesmo `schema.ts`: `xQuerySchema`; `XQuery = z.output`, `XListParams = Partial<XQuery>`                                                         |
| Tipos das **respostas** e funções que chamam a API       | `packages/shared/src/<domínio>/client.ts` (`createXClient`), com os tipos derivados do `schema.ts`; registrado em `apps/web/src/lib/clients.ts` |
| Leitura do banco                                         | `packages/domain/src/<domínio>/queries.ts`                                                                                                      |
| Escrita no banco / transação                             | `packages/domain/src/<domínio>/mutations.ts`, escritas dentro de `write()`                                                                      |
| Regra de negócio (decidir, calcular, bloquear, situação) | `packages/domain/src/<domínio>/rules.ts`, puro, com `rules.test.ts` ao lado                                                                     |
| Filtro de listagem por situação (consulta)               | `X_STATUS_WHERE` no `rules.ts`, ao lado da função de situação, coberto por `packages/domain/src/status-where.test.ts`                           |
| Erro de negócio                                          | classes de `packages/domain/src/errors.ts`                                                                                                      |
| Conversão de formato do banco (ex.: datas `@db.Date`)    | `packages/domain/src/db-dates.ts` e utilitários do domínio; nunca no shared                                                                     |
| Endpoint                                                 | `apps/web/src/app/api/<domínio>/.../route.ts`                                                                                                   |
| Permissão                                                | `RESOURCE_ACCESS` em `src/lib/permissions.ts` (a chave é o segmento da URL da página)                                                           |
| Tela, formulário, lista                                  | `apps/web/src/features/<domínio>/`                                                                                                              |
| Página e menu                                            | `app/(protected)/<rota-pt>/page.tsx` (só monta a feature); item em `features/shell/nav.ts`                                                      |
| Enum                                                     | o do banco, espelhado em `shared/src/enums.ts` (rótulos em `enum-labels.ts`); a UI usa sempre o do shared                                       |

## 3. Regras de cada camada

**Shared (contrato)**

- O tipo que o cliente usa é **sempre derivado do schema**, nunca escrito à mão.
- Campo numérico vindo do formulário **não usa `z.coerce`** (o tipo de entrada vira `unknown`):
  use `z.union([z.string(), z.number()])` com `.transform(Number).pipe(z.number()…)`.
- Datas circulam como texto ("AAAA-MM-DD" ou "AAAA-MM-DDTHH:mm"), com `dateField` /
  `dateTimeField`. A conversão para o banco é do servidor.
- O shared não depende de Prisma, Node nem do `apps/web` (o mobile depende dele). Tudo nele vai
  para o navegador e para o app: é **público**. Nada de segredo, decisão de negócio ou cálculo
  sensível.

**Rota da API (`app/api`)**: sempre o mesmo formato, sem Prisma e sem regra:
`requireSession(RESOURCE_ACCESS.x)` → `schema.safeParse` (erro → `validationErrorResponse`) →
função de `@ifarm/domain` → `NextResponse.json`; no `catch`, `errorResponse(error)`.

**Domínio (`packages/domain`)**

- Todo arquivo com acesso ao banco começa com `import "server-only"`. O banco vem de
  `@ifarm/db` (`prisma`, `Prisma`) e os enums do banco, de `@ifarm/db/enums`.
- Não conhece HTTP; não deixa erro do Prisma sair (`write()` e as classes de `errors.ts`).
- Não declare schemas aqui (eles são o contrato, no shared). Zod no servidor só como tipo
  (`import type { ZodType }`), exceto o que depende do servidor.
- Extraia para `rules.ts` as regras com lógica de verdade; um `if` de uma linha pode ficar na
  mutation.
- Registros da propriedade atual: `getOrAssignCurrentProperty`.

**UI (`features/`)**

- Nunca importa de `@ifarm/domain` nem de `@ifarm/db` (só as rotas da API, a autenticação, o seed
  e os scripts usam esses pacotes).

- O formulário valida com o schema do shared: `zodResolver(xSchema, undefined, { raw: true })`.
  Com `raw`, a tela aplica as regras da API e envia os valores do formulário (a API converte).
- O tipo do formulário é o `XPayload`. Campo que aceita `null` no contrato usa
  `value={field.value ?? ""}` no input.
- Schema próprio só para o que é **só da tela** (ex.: estado de um diálogo), derivado do shared
  com `.pick` / `.omit` / `.extend`, sem redeclarar campos nem regras. Declare-o no componente;
  `features/<domínio>/schema.ts` só quando mais de um componente usa.
- Filtros de listagem: converta o valor da tela para o `XListParams` com uma tabela tipada
  (fora da tabela = sem filtro), ou pelo schema do shared (como `toAnimalListParams`).
- Mostre o que a API decide (situação, bloqueio, motivo); não recalcule regra na tela. Enums
  vêm de `@ifarm/shared`, nunca de `@/generated/prisma`.
- Gráficos com eixo de datas: `timeDomain` e `timeTicks` (`lib/time-domain.ts`).

## 4. Shared ou servidor?

Vai para o shared: (1) **o contrato da API** (o que o cliente envia, filtros, respostas), porque
o tipo do cliente é derivado dele; (2) **regras que o cliente executa** (validação de
formulário, simulação interativa como `batch/projection.ts`, vocabulário de situações como
`isSessionOpen`, ou o que um recurso offline do mobile vai precisar, como
`animal/commitments.ts`). Em ambos os casos, só se puder ficar exposto e tolerar rodar
desatualizado num app antigo (o servidor sempre revalida).

Fica no servidor: decidir ou bloquear, cálculos de valores, a situação de um registro (a API
manda pronta) e detalhes de persistência. Se o cliente passar a precisar de uma regra do
servidor, mova-a nesse momento (funções puras: só os imports mudam).

## 5. Tipo novo de etapa de manejo

1. **Banco** (pela equipe): valor no enum `ManagementStepType` e a tabela contêiner da etapa
   (modelo: `WeighingManagement`).
2. **Shared**: o tipo em `management-session/steps.ts` (`STEP_TYPES`, `STEP_TYPE_LABELS` e,
   se repetível, `REPEATABLE_STEP_TYPES`); o schema de planejamento em `plan-steps.ts`
   (incluído na união `planStepSchema`); o schema de registro em `step-payloads.ts`.
3. **Servidor**: `packages/domain/src/management-session/steps/<tipo>.ts` com `defineStep`, usando os
   schemas do shared (`planSchema` e `payloadSchema`), registrado em `STEP_MODULES`
   (`steps/index.ts`). O que depende do banco fica no `prepare` / `save`. Se o registro aparece
   no histórico do animal, crie o filtro em `management-session/effective.ts`.
4. **Compromissos**: decida se a etapa é exclusiva entre sessões abertas (`isExclusiveStep`,
   em `shared/animal/commitments.ts`).
5. **UI**: a tela em `features/management-session/steps/<tipo>/` (com o schema de registro do
   shared), o registro em `CLIENT_STEP_MODULES` (`steps/registry.ts`) e o ícone em
   `STEP_ICONS` (`display.tsx`); no planejamento, o campo em `planStepFormSchema` e no
   `toStepPayload` (tipado com o contrato).

## 6. Antes de concluir

Em `apps/web`:

- `pnpm exec tsc --noEmit -p .` e `pnpm test`;
- `pnpm build`;
- `pnpm exec eslint <arquivos alterados>`, olhando **erros e avisos** (imports sem uso aparecem
  como aviso). O lint do projeto tem problemas antigos: não introduza novos;
- o ESLint do web não analisa os pacotes (`packages/*`): para eles, confira variáveis e imports
  sem uso com `pnpm exec tsc --noEmit -p . --noUnusedLocals`, que cobre o que o web importa;
- se mexeu no shared, também `pnpm exec tsc --noEmit` em `apps/mobile`.

Teste o fluxo no app: não há testes com banco, então a ligação entre a mutation e a regra só é
verificada no uso.

Testes unitários (vitest, rodados pelo `pnpm test` do web) ficam ao lado do código
(`*.test.ts`), no shared e no domain. Ao mover ou renomear algo exportado, procure os usos nos
pacotes e em `apps/web` (`src/` **e** `scripts/`: o seed e os scripts rodam com `tsx`,
fora do Next). Mudou o schema do banco? Rode `pnpm prisma generate` em `apps/web`.
