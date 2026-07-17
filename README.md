# iFarm — Sistema de Gestão Pecuária

Plataforma para gestão do ciclo produtivo de fazendas de pecuária de corte (cria, recria, engorda e abate), cobrindo controle de animais, propriedades, áreas de pastagem e usuários. Monorepo com os apps **web** e **mobile**, compartilhando o mesmo backend.

## 📂 Estrutura

```
apps/
  web/      → Next.js (site + API + banco de dados). Ver apps/web/README.md
  mobile/   → Expo / React Native. Ver apps/mobile/README.md
packages/
  shared/   → código compartilhado entre web e mobile
docs/       → requisitos, arquitetura e visão do produto
```



## 🚀 Setup

Pré-requisitos: [Node.js](https://nodejs.org/) 22+, [pnpm](https://pnpm.io/), [Docker](https://www.docker.com/) (só para o `apps/web`).

Na raiz do repositório, instale as dependências dos dois apps com:

```bash
pnpm install
```

Depois, configure **cada app separadamente**:

1. **[apps/web](apps/web/README.md)**
2. **[apps/mobile](apps/mobile/README.md)**

O `apps/mobile` **depende do `apps/web` estar rodando**, pois consome a API do web pela rede. Sempre suba o web antes de testar o mobile.

## 🔍 Comandos úteis na raiz

| Comando | Descrição |
| :--- | :--- |
| `pnpm dev` | Atalho para `pnpm --filter web dev` |
| `pnpm --filter web <script>` | Roda um script definido em `apps/web/package.json` |
| `pnpm --filter mobile <script>` | Roda um script definido em `apps/mobile/package.json` |

## 📖 Documentação do produto

Requisitos, regras de negócio e arquitetura ficam em [docs/](docs/).
