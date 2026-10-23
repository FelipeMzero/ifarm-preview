# iFarm DB

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral.

Banco de dados do iFarm: PostgreSQL (em um container Docker, para desenvolvimento), com o schema, o cliente gerado e o CLI do Prisma ORM. O código usa o banco pelo pacote `@ifarm/db`.

## 🚀 Pré-requisitos

- [Docker](https://www.docker.com/) com suporte ao Docker Compose V2
- As dependências instaladas com `pnpm install` na raiz do repositório

---

## 🛠️ Configuração

### 1. Configurar Variáveis de Ambiente

Dentro de `packages/db`, copie o modelo de exemplo e preencha com seus dados locais:

```bash
cp .env.example .env
```

As variáveis `DB_*` são usadas pelo container, e o `DATABASE_URL`, pelos comandos `pnpm db:*`. O app web tem o próprio `.env`, com o mesmo `DATABASE_URL`.

### 2. Iniciar o Banco de Dados

Ainda dentro de `packages/db`, suba o container do PostgreSQL:

```bash
docker compose up -d
```

### 3. Sincronizar o Prisma ORM

Na raiz do repositório, gere o cliente do Prisma e sincronize o banco com o schema atual:

```bash
pnpm db:generate
pnpm db:push
```

O seed (usuário admin e dados de exemplo) fica no app web, porque também cria os usuários pela autenticação: veja o [README do web](../../apps/web/README.md).

---

## 🔍 Comandos Úteis

| Comando                  | Descrição                                                              |
| :----------------------- | :--------------------------------------------------------------------- |
| `pnpm db:generate`       | Gera o cliente do Prisma (e o `docs/ERD.md`) a partir do schema (raiz) |
| `pnpm db:push`           | Sincroniza o banco com o schema (raiz)                                 |
| `pnpm db:seed`           | Roda o seed do app web (raiz)                                          |
| `pnpm db:studio`         | Abre uma interface gráfica para ver e editar os dados (raiz)           |
| `docker compose logs -f` | Visualiza os logs do banco em tempo real (em `packages/db`)            |
| `docker compose down`    | Para e remove o container do banco (em `packages/db`)                  |

---

## 📂 Estrutura do Banco de Dados

O esquema de dados é definido em `prisma/schema.prisma`. Sempre que alterar este arquivo, rode na raiz:

```bash
pnpm db:generate
pnpm db:push
```
