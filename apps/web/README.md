# iFarm Web

> Parte do monorepo iFarm — veja o [README da raiz](../../README.md) para a visão geral.

Aplicação web do iFarm: uma SPA em React, com [Vite](https://vite.dev/) e [React Router](https://reactrouter.com/), só com as telas. Os dados vêm da [API](../../apps/api/README.md) (`apps/api`): o navegador chama `/api/*` no próprio endereço do site, e quem repassa para a API é o Vite (em desenvolvimento) ou o proxy reverso (em produção).

## 🚀 Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado v22+) e [pnpm](https://pnpm.io/)
- As dependências instaladas com `pnpm install` na raiz do repositório (veja o [README raiz](../../README.md))
- A API configurada: siga o [README do apps/api](../../apps/api/README.md)

---

## 💻 Executando o Projeto

Inicie o servidor de desenvolvimento. Na raiz do repositório, `pnpm dev` sobe a API e o web juntos; dentro de `apps/web`, sobe só o web:

```bash
pnpm dev
```

O projeto estará disponível em: http://localhost:3000

O Vite repassa as chamadas a `/api/*` para a API em `http://localhost:3001`. Se ela estiver em outro endereço, defina `API_URL` ao subir o web (ex.: `API_URL=http://192.168.0.10:3001 pnpm dev`).

---

## 📦 Produção

O `pnpm build` gera arquivos estáticos em `dist/` (HTML, JS e CSS), sem servidor Node próprio. Para publicar, o proxy reverso (Nginx, Caddy…) deve:

- repassar `/api/*` para a API;
- servir os arquivos de `dist/` e, para qualquer outro caminho, o `dist/index.html` (as rotas são resolvidas no navegador).

Para conferir o build localmente, com o mesmo repasse do desenvolvimento: `pnpm preview`.

---

## 🔍 Comandos Úteis

| Comando        | Descrição                                                                      |
| :------------- | :----------------------------------------------------------------------------- |
| `pnpm dev`     | Sobe o servidor de desenvolvimento (na raiz, junto com a API)                  |
| `pnpm build`   | Verifica os tipos e gera o build de produção em `dist/`                        |
| `pnpm preview` | Serve o build de `dist/` em http://localhost:3000 (em `apps/web`)              |
| `pnpm lint`    | Roda o lint do web (em `apps/web`; na raiz, roda o de todos os apps e pacotes) |

Os comandos da API e do seed estão no [README do apps/api](../../apps/api/README.md), e os do banco no [README do packages/db](../../packages/db/README.md).

---

## 📂 Estrutura

| Caminho                       | O que fica ali                                                                                                     |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `index.html` e `src/main.tsx` | A entrada da aplicação: fontes, CSS global, tema e o roteador                                                      |
| `src/router.tsx`              | As URLs das páginas (em português) e o componente de cada uma                                                      |
| `src/pages/`                  | Um arquivo por domínio (`person.tsx`…) com as páginas que montam a feature: leem a URL e decidem para onde navegar |
| `src/layouts/`                | `ProtectedLayout` (login, permissão e menu) e `GuestLayout` (o login)                                              |
| `src/features/`               | As telas, formulários e listas de cada domínio                                                                     |
