# iFarm Web

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral.

Este é um projeto desenvolvido com Next.js. Além do site, também expõe a API (rotas `/api/*`) consumida pelo `apps/mobile`. As regras de negócio ficam em `packages/domain`, e o banco de dados em [`packages/db`](../../packages/db/README.md).

## 🚀 Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado v22+) e [pnpm](https://pnpm.io/)
- As dependências instaladas com `pnpm install` na raiz do repositório (veja o [README raiz](../../README.md))
- O banco de dados configurado e rodando: siga o [README do packages/db](../../packages/db/README.md)

---

## 🛠️ Configuração

### 1. Configurar Variáveis de Ambiente

Dentro de `apps/web`, copie o modelo de exemplo e preencha com seus dados locais (o `DATABASE_URL` é o mesmo do `packages/db/.env`):

```bash
cp .env.example .env
```

Depois, gere um valor para `BETTER_AUTH_SECRET` (usado para assinar sessões/cookies) e preencha no `.env`:

```bash
openssl rand -base64 32
```

### 2. Popular o Banco (seed)

Na raiz do repositório, rode o seed para criar o usuário admin (credenciais definidas em `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` no `.env`) e alguns dados fictícios:

```bash
pnpm db:seed
```

---

## 💻 Executando o Projeto

Após concluir a configuração, inicie o servidor de desenvolvimento (na raiz do repositório ou dentro de `apps/web`):

```bash
pnpm dev
```

O projeto estará disponível em: http://localhost:3000

---

## 🔍 Comandos Úteis

| Comando        | Descrição                                                                      |
| :------------- | :----------------------------------------------------------------------------- |
| `pnpm dev`     | Sobe o servidor de desenvolvimento (na raiz ou em `apps/web`)                  |
| `pnpm build`   | Gera o build de produção (na raiz ou em `apps/web`)                            |
| `pnpm lint`    | Roda o lint do web (em `apps/web`; na raiz, roda o de todos os apps e pacotes) |
| `pnpm db:seed` | Roda novamente o seed (cria admin e dados de exemplo) (na raiz)                |

Os comandos do banco (Docker, `db:push`, `db:studio`) estão no [README do packages/db](../../packages/db/README.md).
