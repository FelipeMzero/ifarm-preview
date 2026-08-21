# iFarm Web

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral e como configurar o [apps/mobile](../mobile/README.md).

Este é um projeto desenvolvido com Next.js, utilizando Prisma ORM para persistência de dados e Docker para orquestração do banco de dados PostgreSQL. Além do site, também expõe a API (rotas `/api/*`) consumida pelo `apps/mobile`.

## 🚀 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (recomendado v22+)
* [pnpm](https://pnpm.io/) (gerenciador de pacotes)
* [Docker](https://www.docker.com/) com suporte ao Docker Compose V2

---

## 🛠️ Configuração e Instalação

As dependências já devem ter sido instaladas com `pnpm install` na raiz do repositório (veja o [README raiz](../../README.md)).


Agora dentro da pasta `apps/web` siga os passos abaixo para configurar app web:

### 1. Configurar Variáveis de Ambiente
O projeto utiliza um arquivo `.env` para gerenciar credenciais e configurações de conexão, copie o modelo de exemplo e preencha com seus dados locais:

```bash
cp .env.example .env
```

Depois, gere um valor para `BETTER_AUTH_SECRET` (usado para assinar sessões/cookies) e preencha no `.env`:

```bash
openssl rand -base64 32
```


### 2. Iniciar o Banco de Dados
Suba o container do PostgreSQL utilizando o Docker:

```bash
docker compose up -d
```

### 3. Sincronizar o Prisma ORM
Gere o cliente do Prisma e sincronize o banco de dados com o schema atual:

```bash
pnpm prisma generate
pnpm prisma db push
```

Depois, rode o seed para criar o usuário admin (credenciais definidas em `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` no `.env`) e alguns dados fictícios:

```bash
pnpm prisma db seed
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

| Comando | Descrição |
| :--- | :--- |
| pnpm prisma studio | Abre uma interface gráfica para visualizar e editar os dados do banco. |
| pnpm exec prisma db seed | Roda novamente o seed (cria admin e dados de exemplo). |
| docker compose logs -f | Visualiza os logs do banco de dados em tempo real. |
| docker compose down | Para e remove os containers do projeto. |

---

## 📂 Estrutura do Banco de Dados
O projeto utiliza o PostgreSQL. O esquema de dados é definido no arquivo prisma/schema.prisma. Sempre que realizar alterações neste arquivo, lembre-se de rodar o comando abaixo para sincronizar o banco.

```bash
pnpm prisma db push
```
