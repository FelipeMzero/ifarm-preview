# iFarm — Sistema de Gestão Pecuária

Plataforma para gestão do ciclo produtivo de fazendas de pecuária de corte (cria, recria, engorda e abate), cobrindo controle de animais, propriedades, áreas de pastagem e usuários. Monorepo com os apps **web** e **mobile**, compartilhando o mesmo backend.

## 📂 Estrutura

```
apps/
  web/      → Next.js (site + API). Ver apps/web/README.md
  mobile/   → Expo / React Native. Ver apps/mobile/README.md
packages/
  shared/   → contrato da API (schemas, tipos e clientes), usado pelo web e pelo mobile
  domain/   → regras de negócio e acesso ao banco do servidor (usado pela API)
  db/       → banco de dados: schema e CLI do Prisma, container do PostgreSQL. Ver packages/db/README.md
docs/       → requisitos, arquitetura e visão do produto
```

## 🚀 Setup

Pré-requisitos: [Node.js](https://nodejs.org/) 22+, [pnpm](https://pnpm.io/), [Docker](https://www.docker.com/) (para o banco de dados, em `packages/db`).

Na raiz do repositório, instale as dependências de todos os apps e pacotes com:

```bash
pnpm install
```

Depois, configure nesta ordem:

1. **[packages/db](packages/db/README.md)**: o banco de dados
2. **[apps/web](apps/web/README.md)**: o site e a API
3. **[apps/mobile](apps/mobile/README.md)**

O `apps/mobile` **depende do `apps/web` estar rodando**, pois consome a API do web pela rede. Sempre suba o web antes de testar o mobile.

## 🔍 Comandos úteis na raiz

| Comando                         | Descrição                                                       |
| :------------------------------ | :-------------------------------------------------------------- |
| `pnpm dev`                      | Sobe o web em desenvolvimento (`pnpm --filter web dev`)         |
| `pnpm build`                    | Gera o build de produção do web                                 |
| `pnpm test`                     | Roda os testes de cada app/pacote                               |
| `pnpm lint`                     | Roda o lint de cada app/pacote                                  |
| `pnpm db:generate`              | Gera o cliente do Prisma (e o `docs/ERD.md`) a partir do schema |
| `pnpm db:push`                  | Sincroniza o banco com o schema                                 |
| `pnpm db:seed`                  | Roda o seed (admin e dados de exemplo)                          |
| `pnpm db:studio`                | Abre o Prisma Studio para ver e editar os dados                 |
| `pnpm format`                   | Formata o código com o Prettier                                 |
| `pnpm --filter web <script>`    | Roda um script definido em `apps/web/package.json`              |
| `pnpm --filter mobile <script>` | Roda um script definido em `apps/mobile/package.json`           |

## 📖 Documentação do produto

Requisitos, regras de negócio e arquitetura ficam em [docs/](docs/).
