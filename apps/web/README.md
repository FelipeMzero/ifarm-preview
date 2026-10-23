# iFarm Web

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral.

Este é um projeto desenvolvido com Next.js, só com as telas. Os dados vêm da [API](../../apps/api/README.md) (`apps/api`): o `next.config.ts` repassa as chamadas a `/api/*` para ela, de modo que, para o navegador, tudo continua no mesmo endereço.

## 🚀 Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado v22+) e [pnpm](https://pnpm.io/)
- As dependências instaladas com `pnpm install` na raiz do repositório (veja o [README raiz](../../README.md))
- A API configurada: siga o [README do apps/api](../../apps/api/README.md)

---

## 🛠️ Configuração

Dentro de `apps/web`, copie o modelo de exemplo e preencha com seus dados locais:

```bash
cp .env.example .env
```

- `API_URL`: o endereço da API (em desenvolvimento, `http://localhost:3001`). É lido no **build**: em produção, defina-o antes do `pnpm build`.
- `BETTER_AUTH_SECRET`: o mesmo valor do `apps/api/.env`. O web lê o cookie da sessão para decidir quais páginas mostrar (a autorização de verdade é da API).

---

## 💻 Executando o Projeto

Após concluir a configuração, inicie o servidor de desenvolvimento. Na raiz do repositório, `pnpm dev` sobe a API e o web juntos; dentro de `apps/web`, sobe só o web:

```bash
pnpm dev
```

O projeto estará disponível em: http://localhost:3000

---

## 🔍 Comandos Úteis

| Comando      | Descrição                                                                      |
| :----------- | :----------------------------------------------------------------------------- |
| `pnpm dev`   | Sobe o servidor de desenvolvimento (na raiz, junto com a API)                  |
| `pnpm build` | Gera o build de produção (na raiz ou em `apps/web`)                            |
| `pnpm lint`  | Roda o lint do web (em `apps/web`; na raiz, roda o de todos os apps e pacotes) |

Os comandos da API e do seed estão no [README do apps/api](../../apps/api/README.md), e os do banco no [README do packages/db](../../packages/db/README.md).
