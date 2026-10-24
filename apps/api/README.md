# iFarm API

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral.

API REST do iFarm, em [Hono](https://hono.dev/), consumida pelo `apps/web` e pelo `apps/mobile`. Também é o servidor da autenticação (better-auth: login, sessões e usuários). As regras de negócio ficam em `packages/domain`, e o banco de dados em [`packages/db`](../../packages/db/README.md).

## 🚀 Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado v22+) e [pnpm](https://pnpm.io/)
- As dependências instaladas com `pnpm install` na raiz do repositório
- O banco de dados configurado e rodando: siga o [README do packages/db](../../packages/db/README.md)

---

## 🛠️ Configuração

### 1. Configurar Variáveis de Ambiente

Dentro de `apps/api`, copie o modelo de exemplo e preencha com seus dados locais (o `DATABASE_URL` é o mesmo do `packages/db/.env`):

```bash
cp .env.example .env
```

Depois, gere um valor para `BETTER_AUTH_SECRET` (usado para assinar sessões/cookies) e preencha no `.env` (só a API usa esse segredo):

```bash
openssl rand -base64 32
```

### 2. Popular o Banco (seed)

Na raiz do repositório, rode o seed para criar os usuários e alguns dados fictícios:

```bash
pnpm db:seed
```

Ele cria um usuário de cada papel, todos com a senha `admin1234`:

| E-mail                 | Papel                  |
| :--------------------- | :--------------------- |
| `admin@ifarm.local`    | administrador          |
| `gerente@ifarm.local`  | gerente                |
| `tecnico@ifarm.local`  | técnico                |
| `vaqueiro@ifarm.local` | funcionário (vaqueiro) |

---

## 💻 Executando

Na raiz do repositório, `pnpm dev` sobe a API junto com o web. Só a API, dentro de `apps/api`:

```bash
pnpm dev
```

A API fica em http://localhost:3001 (porta definida em `PORT`).

Para ver os estados de carregamento das telas (os _skeletons_), atrase as respostas da API, menos as de login e sessão. O atraso só funciona fora de produção:

```bash
API_DELAY_MS=2000 pnpm dev
```

---

## 🔍 Comandos Úteis

| Comando        | Descrição                                                            |
| :------------- | :------------------------------------------------------------------- |
| `pnpm dev`     | Sobe a API em desenvolvimento, reiniciando ao salvar (em `apps/api`) |
| `pnpm start`   | Sobe a API sem recarregar (as variáveis vêm do ambiente)             |
| `pnpm lint`    | Roda o lint da API (em `apps/api`)                                   |
| `pnpm db:seed` | Roda novamente o seed (cria admin e dados de exemplo) (na raiz)      |

---

## 📂 Estrutura

| Caminho           | O que fica ali                                                             |
| :---------------- | :------------------------------------------------------------------------- |
| `src/index.ts`    | O app do Hono: CORS de desenvolvimento, autenticação e os routers montados |
| `src/routes/`     | Um router por domínio, montado em `/api/<domínio>`                         |
| `src/auth.ts`     | O servidor do better-auth                                                  |
| `src/session.ts`  | `requireSession`: sessão e permissão de cada rota                          |
| `src/http.ts`     | Conversão dos erros do domínio em respostas HTTP                           |
| `scripts/seed.ts` | Os dados de exemplo                                                        |
