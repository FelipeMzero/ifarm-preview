# iFarm Web

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral e como configurar o [apps/mobile](../mobile/README.md).

Este é um projeto desenvolvido com Next.js. Além do site, também expõe a API (rotas `/api/*`) consumida pelo `apps/mobile`. As regras de negócio ficam em `packages/domain`, e o banco de dados (PostgreSQL, via Prisma ORM, com o container Docker) em `packages/db`.

## 🚀 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (recomendado v22+)
- [pnpm](https://pnpm.io/) (gerenciador de pacotes)
- [Docker](https://www.docker.com/) com suporte ao Docker Compose V2

---

## 🛠️ Configuração e Instalação

As dependências já devem ter sido instaladas com `pnpm install` na raiz do repositório (veja o [README raiz](../../README.md)).

Siga os passos abaixo para configurar o app web:

### 1. Configurar Variáveis de Ambiente

O web e o banco têm cada um o seu arquivo `.env` (o `DATABASE_URL` aparece nos dois). Copie os modelos de exemplo e preencha com seus dados locais:

```bash
cp apps/web/.env.example apps/web/.env      # app web e seed
cp packages/db/.env.example packages/db/.env  # container do banco e comandos pnpm db:*
```

Depois, gere um valor para `BETTER_AUTH_SECRET` (usado para assinar sessões/cookies) e preencha no `apps/web/.env`:

```bash
openssl rand -base64 32
```

### 2. Iniciar o Banco de Dados

Suba o container do PostgreSQL utilizando o Docker, dentro de `packages/db`:

```bash
docker compose up -d
```

### 3. Sincronizar o Prisma ORM

Gere o cliente do Prisma e sincronize o banco de dados com o schema atual (comandos rodados na raiz do repositório):

```bash
pnpm db:generate
pnpm db:push
```

Depois, rode o seed para criar o usuário admin (credenciais definidas em `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` no `.env`) e alguns dados fictícios:

```bash
pnpm db:seed
```

---

## 💻 Executando o Projeto

Após concluir a configuração, você pode iniciar o servidor de desenvolvimento. Dentro de `apps/web`:

```bash
pnpm dev
```

Ou a partir da raiz do repositório:

```bash
pnpm --filter web dev
```

O projeto estará disponível em: http://localhost:3000

---

## 🔍 Comandos Úteis

| Comando                | Descrição                                                                        |
| :--------------------- | :------------------------------------------------------------------------------- |
| pnpm db:studio         | Abre uma interface gráfica para visualizar e editar os dados do banco (na raiz). |
| pnpm db:seed           | Roda novamente o seed (cria admin e dados de exemplo) (na raiz).                 |
| docker compose logs -f | Visualiza os logs do banco de dados em tempo real (em `packages/db`).            |
| docker compose down    | Para e remove o container do banco (em `packages/db`).                           |

---

## 📂 Estrutura do Banco de Dados

O projeto utiliza o PostgreSQL. O esquema de dados é definido no arquivo packages/db/prisma/schema.prisma (na raiz do monorepo). Sempre que realizar alterações neste arquivo, lembre-se de rodar o comando abaixo, na raiz, para sincronizar o banco.

```bash
pnpm db:push
```
