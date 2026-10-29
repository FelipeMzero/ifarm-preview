# Como adicionar uma feature ao iFarm

Monorepo pnpm (use sempre `pnpm`, nunca `npm`/`npx`):

- `apps/api`: API REST em Hono, consumida pelo web e pelo mobile. Concentra as regras de negócio
  e o acesso ao banco, em `src/features/<domínio>/<operação>/` (fatias verticais). Também tem o
  servidor da autenticação (`src/auth.ts`, better-auth) e o seed (`scripts/seed.ts`).
- `apps/web`: React + Vite (SPA), só telas. As rotas ficam em `src/router.tsx` (React Router) e
  as páginas em `src/pages/<domínio>.tsx`; as que exigem login passam pelo
  `src/layouts/ProtectedLayout.tsx` (sessão vinda da API e `RESOURCE_ACCESS`). Em
  desenvolvimento o Vite repassa `/api/*` para a API (`vite.config.ts`).
- `apps/mobile`: Expo / React Native. Consome a mesma API.
- `packages/shared` (`@ifarm/shared`): contrato da API (schemas, tipos das respostas e clientes
  HTTP), as poucas regras que o cliente executa e as permissões (`permissions.ts`: a API usa
  para negar, as telas para esconder).
- `packages/db` (`@ifarm/db`): schema do Prisma (`prisma/schema.prisma`), o cliente gerado
  (`@ifarm/db/client`, `@ifarm/db/enums`), a instância do banco (`prisma`, de `@ifarm/db`), o CLI
  do Prisma (`prisma.config.ts`) e o container do PostgreSQL (`docker-compose.yaml`). Na raiz:
  `pnpm db:generate`, `db:push`, `db:seed` e `db:studio`.
- Variáveis de ambiente: cada app/pacote que precisa de configuração tem o próprio `.env` (modelo
  no `.env.example`): `apps/api/.env` (banco, autenticação e seed), `packages/db/.env` (container
  e CLI) e `apps/mobile/.env` (endereço da API). O web não tem: o Vite repassa `/api/*` para
  `localhost:3001`. Os pacotes só leem o `process.env`; quem carrega o arquivo é o processo
  (`tsx --env-file`, `prisma.config.ts`, Expo).

A arquitetura está em `docs/architecture.md`; os requisitos de cada módulo, em
`docs/requirements/mod-XX-<nome>.md`.

## 1. Antes de escrever

- **Leia, sem alterar,** o requisito do módulo (`docs/requirements/`, e o `comum.md`) e o modelo
  em `packages/db/prisma/schema.prisma`. **Não altere os documentos nem o schema do banco**: se a
  feature precisar disso, pare e informe o que seria necessário.
- Siga um domínio parecido como modelo: `breed` (cadastro simples), `batch` (regras e
  histórico) ou `purchase` (fluxo com situações e valores).
- Use o mesmo nome de domínio em todas as partes (inglês no código e na API, português só na URL
  da página: `/api/batch` e `/lotes`). Comentários e mensagens ao usuário em português.
- Se a feature estende um mecanismo existente (etapas de manejo, compromissos, situações), siga
  o registro existente em vez de criar um paralelo. Os registros são `Record<…Type, …>`: o
  TypeScript aponta cada lugar que falta.

## 2. Passo a passo

Para uma operação nova (ex.: "encerrar lote") num domínio que já existe:

1. **Contrato** (`packages/shared/src/<domínio>/`): o schema do que o cliente envia em
   `schema.ts`, o tipo da resposta em `types.ts` e a função que chama a API em `client.ts`.
2. **Fatia** (`apps/api/src/features/<domínio>/<operação>/`, em kebab-case, verbo + recurso:
   `close-batch`):
   - `route.ts`: o endpoint (formato fixo, ver a seção 4);
   - `handler.ts`: a operação, exportada com o nome da operação (`closeBatch`).
3. **Regras**: se a operação decide algo com lógica de verdade (pode ou não, situação, cálculo),
   escreva a função pura no `rules.ts` do domínio, com o teste em `rules.test.ts`.
4. **Montagem**: importe o `route.ts` no `routes.ts` do domínio (caminhos fixos, como
   `/options`, antes dos com parâmetro, como `/:id`).
5. **Permissão**: a chave do recurso em `RESOURCE_ACCESS` (`packages/shared/src/permissions.ts`),
   se for um recurso novo.
6. **Tela** (`apps/web/src/features/<domínio>/`): formulário, lista ou ação, usando o cliente do
   contrato (registrado em `apps/web/src/lib/clients.ts`); a página em `src/pages/<domínio>.tsx`,
   a rota em `src/router.tsx` e o item de menu em `features/shell/nav.ts`, se for uma página nova.
7. **Verificação**: a seção 8.

Para um domínio novo: a pasta `apps/api/src/features/<domínio>/` com o `routes.ts`, montado em
`/api/<domínio>` no `src/index.ts`, e a pasta `packages/shared/src/<domínio>/`, exportada no
`index.ts` do shared.

## 3. Onde cada coisa vai

| O que você está escrevendo                               | Onde vai                                                                                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dados que o cliente **envia** (corpo de POST/PUT)        | `packages/shared/src/<domínio>/schema.ts`: schema Zod; `XPayload = z.input` (o formulário), `XData = z.output` (o que a API recebe)                       |
| **Filtros e paginação** de uma listagem                  | mesmo `schema.ts`: `xQuerySchema`; `XQuery = z.output`, `XListParams = Partial<XQuery>`                                                                   |
| Tipos das **respostas** da API                           | `packages/shared/src/<domínio>/types.ts` (a API tipa o retorno com eles; o web e o mobile, as telas)                                                      |
| Funções que chamam a API                                 | `packages/shared/src/<domínio>/client.ts` (`createXClient`), tipadas com o `schema.ts` e o `types.ts`; registrado em `apps/web/src/lib/clients.ts`        |
| Endpoint                                                 | `apps/api/src/features/<domínio>/<operação>/route.ts`, montado no `routes.ts` do domínio                                                                  |
| A operação (ler, decidir, gravar)                        | `apps/api/src/features/<domínio>/<operação>/handler.ts`                                                                                                   |
| Regra de negócio (decidir, calcular, bloquear, situação) | `apps/api/src/features/<domínio>/rules.ts`, puro, com `rules.test.ts` ao lado                                                                             |
| Filtro de listagem por situação (consulta)               | `X_STATUS_WHERE` ao lado da função de situação, coberto por `apps/api/src/features/status-where.test.ts`                                                  |
| Código comum a várias operações do domínio               | `shared.ts` do domínio (peças pequenas); um assunto inteiro ganha arquivo com nome próprio (ex.: `purchase/costs.ts`)                                     |
| Código que **outro domínio** usa                         | `apps/api/src/features/<domínio>/<assunto>.public.ts` (ex.: `area/availability.public.ts`)                                                                |
| Erro de negócio                                          | classes de `apps/api/src/lib/errors.ts` (`NotFoundError`, `ValidationError`, `ConflictError`, `BusinessError`)                                            |
| Conversão de formato do banco (ex.: datas `@db.Date`)    | `apps/api/src/lib/db-dates.ts` e utilitários da API; nunca no shared                                                                                      |
| Permissão                                                | `RESOURCE_ACCESS` em `packages/shared/src/permissions.ts` (a chave é o segmento da URL da página)                                                         |
| Tela, formulário, lista                                  | `apps/web/src/features/<domínio>/`                                                                                                                        |
| Página e menu                                            | `apps/web/src/pages/<domínio>.tsx` (só monta a feature; parâmetros com `useRouteParams`), registrada em `src/router.tsx`; item em `features/shell/nav.ts` |
| Enum                                                     | o do banco, espelhado em `shared/src/enums.ts` (rótulos em `enum-labels.ts`; conferido por `apps/api/src/lib/enums.test.ts`); a UI usa sempre o do shared |

## 4. Regras de cada parte

**Shared (contrato)**

- O tipo que o cliente usa é **sempre derivado do schema**, nunca escrito à mão.
- O schema valida **e converte**: o handler recebe o `XData` pronto. Campo numérico vindo do
  formulário **não usa `z.coerce`** (o tipo de entrada vira `unknown`): use `numberField` /
  `optionalNumberField` (`zod-utils.ts`) ou `z.union([z.string(), z.number()])` com
  `.transform(Number).pipe(z.number()…)`. Texto opcional vazio vira `null`:
  `.optional().transform((v) => v || null)`.
- O shared não depende de Prisma, Node nem dos apps (o mobile depende dele). Tudo nele vai para o
  navegador e para o app: é **público**. Nada de segredo, decisão de negócio ou cálculo sensível.
  Não use APIs do navegador ou do Node que o pacote não tem nos tipos (ex.: `URLSearchParams`:
  use `toQueryString`).

**`route.ts`**: sempre o mesmo formato, sem Prisma e sem regra (modelo:
`breed/create-breed/route.ts`):

```ts
export const createBreedRoute = new Hono();

createBreedRoute.post("/", async (c) => {
  const { response } = await requireSession(RESOURCE_ACCESS.racas);
  if (response) return response;

  try {
    const validation = breedSchema.safeParse(await c.req.json());
    if (!validation.success) return validationErrorResponse(validation.error);

    const data = await createBreed(validation.data);
    return c.json({ success: true, data }, 201);
  } catch (error) {
    return errorResponse(error);
  }
});
```

Parâmetros com `c.req.param()` e `uuidParam("id")` no caminho; corpo com `c.req.json()`.

**`handler.ts`**

- Faz a operação inteira (Transaction Script): **lê** pelo Prisma, **decide** chamando as regras
  e **grava** conforme a resposta, numa transação (`prisma.$transaction`) quando grava em mais
  de um lugar. Não conhece HTTP.
- Não deixa erro do Prisma sair: escritas dentro de `write()` (`lib/db-errors.ts`), que converte
  conflitos de chave única e de vínculo em `ConflictError`. Erros de negócio com as classes de
  `lib/errors.ts`; o `route.ts` os converte em resposta.
- Quando o formato do contrato difere do banco (ex.: o endereço vem junto, mas é outra tabela),
  a função que monta os dados termina com `satisfies Prisma.XCreateInput` (ex.:
  `toPropertyData`).
- Registros da propriedade atual: `getOrAssignCurrentProperty`
  (`current-property/resolve.public.ts`).

**`rules.ts`**

- Funções puras: recebem os dados já lidos e devolvem a decisão (ex.: `paymentBlocker(compra)`
  devolve o motivo do bloqueio ou `null`). Nunca acessam o banco.
- Só o que tem lógica de verdade; um `if` de uma linha pode ficar no handler.
- Cálculos que só uma operação usa podem ficar num `rules.ts` dentro da pasta dela.

**Fronteiras** (garantidas pelo lint: `ifarm/slice-boundary` e `ifarm/domain-boundary`)

- O que está dentro da pasta de uma fatia é só dela.
- O nível do domínio (`rules.ts`, `shared.ts`, módulos com nome) é comum às fatias do domínio.
- De outro domínio, importe só arquivos `*.public.ts`. Se precisar de algo interno de outro
  domínio, mova-o para um `*.public.ts` de lá.
- Nomes de arquivo em kebab-case (`event-date.ts`, `confirm-transfer.public.ts`).

**UI (`apps/web/src/features/`)**

- Nunca importa de `@ifarm/db` (só o `apps/api` usa esse pacote).
- O formulário valida com o schema do shared: `zodResolver(xSchema, undefined, { raw: true })`.
  Com `raw`, a tela aplica as regras da API e envia os valores do formulário (a API converte).
- O tipo do formulário é o `XPayload`. Campo que aceita `null` no contrato usa
  `value={field.value ?? ""}` no input.
- Schema próprio só para o que é **só da tela** (ex.: estado de um diálogo), derivado do shared
  com `.pick` / `.omit` / `.extend`, sem redeclarar campos nem regras. Declare-o no componente;
  `features/<domínio>/schema.ts` só quando mais de um componente usa.
- Filtros de listagem: converta o valor da tela para o `XListParams` com uma tabela tipada
  (fora da tabela = sem filtro), ou pelo schema do shared (como `toAnimalListParams`).
- Mostre o que a API decide (situação, bloqueio, motivo); não recalcule regra na tela. Enums vêm
  de `@ifarm/shared`, nunca de `@ifarm/db/enums`.
- Gráficos com eixo de datas: `timeOf`, `timeDomain` e `timeTicks` (`lib/time-domain.ts`).

## 5. Datas e fusos horários

Cada propriedade tem o seu fuso (`Property.timeZone`). O banco guarda as datas e horas como
instantes (`timestamptz`, em UTC) e as datas civis como o dia (`@db.Date`).

| Tipo                                                                                                                              | Entrada (cliente → API)                                                                                     | Saída (API → cliente)                                                       |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Data civil (nascimento, pagamento)                                                                                                | `"AAAA-MM-DD"` (`dateField`); no banco com `toDbDate`                                                       | `fromDbDate` → `"AAAA-MM-DD"`                                               |
| Data e hora de um registro de propriedade (manejos, pesagens, transferências; e o `createdAt`, `confirmedAt`... desses registros) | `"AAAA-MM-DDTHH:mm"` (`dateTimeField`), convertido com `zonedDateTimeToInstant(valor, fuso da propriedade)` | `toZonedIso(instante, fuso)`: ISO com o deslocamento (`"…T08:00:00-04:00"`) |
| Instante de registro sem propriedade (usuários, pessoas, cadastros gerais)                                                        | —                                                                                                           | `toISOString()` (`"…Z"`)                                                    |

- O fuso vem sempre do banco, pela propriedade do registro (`propertyTimeZone`,
  `property/time-zone.public.ts`); nunca do cliente. Eventos do animal usam o fuso da propriedade
  onde ele estava no instante (`animalStays`, `timeZoneAt`).
- Regras que dependem do dia usam o fuso da propriedade: `dayInZone`, `todayInZone`.
- Na tela, mostre com `formatDay` / `formatDateTime` e preencha campos com `toDateTimeInput`
  (todos do shared): o valor com deslocamento aparece como veio; o valor em `Z`, no fuso de quem
  vê. Nunca crie `Date` para mostrar um dia.
- O "agora" e o "hoje" sugeridos nos campos (`nowInZone`, `todayInZone`) usam o fuso da
  propriedade **do registro** (o detalhe traz `property.timeZone`); ao criar um registro, o da
  propriedade atual (`useCurrentProperty`).

## 6. Shared ou servidor?

Vai para o shared: (1) **o contrato da API** (o que o cliente envia, filtros, respostas), porque
o tipo do cliente é derivado dele; (2) **regras que o cliente executa** (validação de
formulário, simulação interativa como `batch/projection.ts`, vocabulário de situações como
`isSessionOpen`, ou o que um recurso offline do mobile vai precisar, como
`animal/commitments.ts`). Em ambos os casos, só se puder ficar exposto e tolerar rodar
desatualizado num app antigo (o servidor sempre revalida).

Fica no servidor: decidir ou bloquear, cálculos de valores, a situação de um registro (a API
manda pronta) e detalhes de persistência. Se o cliente passar a precisar de uma regra do
servidor, mova-a nesse momento (funções puras: só os imports mudam).

## 7. Tipo novo de etapa de manejo

1. **Banco** (pela equipe): valor no enum `ManagementStepType` e a tabela contêiner da etapa
   (modelo: `WeighingManagement`).
2. **Shared**: o tipo em `management-session/steps.ts` (`STEP_TYPES`, `STEP_TYPE_LABELS` e,
   se repetível, `REPEATABLE_STEP_TYPES`); o schema de planejamento em `plan-steps.ts`
   (incluído na união `planStepSchema`); o schema de registro em `step-payloads.ts`.
3. **API**: `apps/api/src/features/management-session/steps/<tipo>.ts` com `defineStep`, usando
   os schemas do shared (`planSchema` e `payloadSchema`), registrado em `STEP_MODULES`
   (`steps/index.ts`). O que depende do banco fica no `prepare` / `save`. Se o registro aparece no
   histórico do animal, crie o filtro em `management-session/effective.public.ts`.
4. **Compromissos**: decida se a etapa é exclusiva entre sessões abertas (`isExclusiveStep`,
   em `shared/animal/commitments.ts`).
5. **UI**: a tela em `features/management-session/steps/<tipo>/` (com o schema de registro do
   shared), o registro em `CLIENT_STEP_MODULES` (`steps/registry.ts`) e o ícone em
   `STEP_ICONS` (`display.tsx`); no planejamento, o campo em `planStepFormSchema` e no
   `toStepPayload` (tipado com o contrato).

## 8. Antes de concluir

Na raiz, `pnpm test` (roda os testes de cada app/pacote). Em cada app/pacote alterado (api, web,
shared, db), `pnpm exec eslint <arquivos alterados>`, olhando **erros e avisos** (imports sem uso
aparecem como aviso; as fronteiras entre fatias e domínios, como erro). O lint do projeto tem
problemas antigos: não introduza novos. Typecheck com `pnpm exec tsc --noEmit -p .` em
`apps/api` e em `apps/web` (no web, também `pnpm build`); se mexeu no shared, também
`pnpm exec tsc --noEmit` em `packages/shared` (sozinho, sem os tipos do navegador e do Node que os
apps trazem) e em `apps/mobile`.

Teste o fluxo no app: não há testes com banco, então a ligação entre o handler e a regra só é
verificada no uso.

Testes unitários (vitest) ficam ao lado do código (`*.test.ts`); cada app/pacote com testes tem
o próprio script `test` (`pnpm test` dentro dele roda só os dele). Ao mover ou renomear algo
exportado, procure os usos nos pacotes, em `apps/web/src` e em `apps/api` (`src/` **e**
`scripts/`: o seed roda à parte, com `tsx`). Mudou o schema do banco? Rode `pnpm db:generate` na
raiz.

Dependência usada por mais de um app/pacote: a versão fica no `catalog` do
`pnpm-workspace.yaml`, e o `package.json` declara `"catalog:"`.

Lint: cada app/pacote tem o próprio `eslint.config.mjs` (typescript-eslint; o web também com as
regras de hooks do React; a API também com as regras de fronteira) e o script `lint`. A regra do
projeto (ponto e vírgula) se repete em cada um: ao mudá-la, mude em todos. O mobile não tem
lint.
