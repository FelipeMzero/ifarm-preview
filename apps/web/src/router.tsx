import { createBrowserRouter } from "react-router";
import type { ComponentType } from "react";
import { queryClient } from "@/lib/query-client";
import {
  INITIAL_PROPERTY_LIST_PARAMS,
  propertyDetailQuery,
  propertyListQuery,
} from "@/features/property/queries";
import { GuestLayout } from "@/layouts/GuestLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";
import { AppLoading, RootLayout } from "@/layouts/RootLayout";

// Cada página é carregada sob demanda (um pedaço do build por página).
function page(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

type RouteParams = Record<string, string | undefined>;

// Loader que começa a buscar os dados da página no clique, junto com o download do código. Com
// os dados já no cache, não espera (a página os mostra e atualiza em segundo plano). Se a busca
// falhar, a navegação segue e a própria página mostra o erro.
function prefetch(load: (params: RouteParams) => Promise<unknown>) {
  return async ({ params }: { params: RouteParams }) => {
    await load(params).catch(() => {});
    return null;
  };
}

// As URLs das páginas (em português; as da API ficam em /api, no apps/api).
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    HydrateFallback: AppLoading,
    children: [
      { path: "/", lazy: page(() => import("./pages/page")) },
      {
        Component: GuestLayout,
        children: [
          { path: "/login", lazy: page(() => import("./pages/login/page")) },
        ],
      },
      {
        Component: ProtectedLayout,
        children: [
          { path: "/abates", lazy: page(() => import("./pages/abates/page")) },
          {
            path: "/animais",
            lazy: page(() => import("./pages/animais/page")),
          },
          {
            path: "/animais/:id",
            lazy: page(() => import("./pages/animais/[id]/page")),
          },
          {
            path: "/animais/:id/detalhes",
            lazy: page(() => import("./pages/animais/[id]/detalhes/page")),
          },
          {
            path: "/animais/novo",
            lazy: page(() => import("./pages/animais/novo/page")),
          },
          { path: "/areas", lazy: page(() => import("./pages/areas/page")) },
          {
            path: "/compras",
            lazy: page(() => import("./pages/compras/page")),
          },
          {
            path: "/compras/:id",
            lazy: page(() => import("./pages/compras/[id]/page")),
          },
          {
            path: "/compras/novo",
            lazy: page(() => import("./pages/compras/novo/page")),
          },
          { path: "/lotes", lazy: page(() => import("./pages/lotes/page")) },
          {
            path: "/lotes/:id",
            lazy: page(() => import("./pages/lotes/[id]/page")),
          },
          {
            path: "/lotes/:id/detalhes",
            lazy: page(() => import("./pages/lotes/[id]/detalhes/page")),
          },
          {
            path: "/lotes/novo",
            lazy: page(() => import("./pages/lotes/novo/page")),
          },
          {
            path: "/lotes/transferencias",
            lazy: page(() => import("./pages/lotes/transferencias/page")),
          },
          {
            path: "/lotes/transferencias/:id",
            lazy: page(() => import("./pages/lotes/transferencias/[id]/page")),
          },
          {
            path: "/lotes/transferencias/nova",
            lazy: page(() => import("./pages/lotes/transferencias/nova/page")),
          },
          {
            path: "/manejos",
            lazy: page(() => import("./pages/manejos/page")),
          },
          {
            path: "/manejos/:id",
            lazy: page(() => import("./pages/manejos/[id]/page")),
          },
          {
            path: "/manejos/:id/registro",
            lazy: page(() => import("./pages/manejos/[id]/registro/page")),
          },
          {
            path: "/manejos/:id/registro/:animalId",
            lazy: page(
              () => import("./pages/manejos/[id]/registro/[animalId]/page"),
            ),
          },
          {
            path: "/manejos/:id/registro/:animalId/:passo",
            lazy: page(
              () =>
                import("./pages/manejos/[id]/registro/[animalId]/[passo]/page"),
            ),
          },
          {
            path: "/manejos/novo",
            lazy: page(() => import("./pages/manejos/novo/page")),
          },
          { path: "/marcas", lazy: page(() => import("./pages/marcas/page")) },
          { path: "/painel", lazy: page(() => import("./pages/painel/page")) },
          { path: "/perdas", lazy: page(() => import("./pages/perdas/page")) },
          {
            path: "/pessoas",
            lazy: page(() => import("./pages/pessoas/page")),
          },
          {
            path: "/pessoas/:id",
            lazy: page(() => import("./pages/pessoas/[id]/page")),
          },
          {
            path: "/pessoas/:id/detalhes",
            lazy: page(() => import("./pages/pessoas/[id]/detalhes/page")),
          },
          {
            path: "/pessoas/novo",
            lazy: page(() => import("./pages/pessoas/novo/page")),
          },
          {
            path: "/propriedades",
            loader: prefetch(() =>
              queryClient.ensureQueryData(
                propertyListQuery(INITIAL_PROPERTY_LIST_PARAMS),
              ),
            ),
            lazy: page(() => import("./pages/propriedades/page")),
          },
          {
            path: "/propriedades/:id",
            loader: prefetch(({ id }) =>
              queryClient.ensureQueryData(propertyDetailQuery(id!)),
            ),
            lazy: page(() => import("./pages/propriedades/[id]/page")),
          },
          {
            path: "/propriedades/:id/detalhes",
            loader: prefetch(({ id }) =>
              queryClient.ensureQueryData(propertyDetailQuery(id!)),
            ),
            lazy: page(() => import("./pages/propriedades/[id]/detalhes/page")),
          },
          {
            path: "/propriedades/novo",
            lazy: page(() => import("./pages/propriedades/novo/page")),
          },
          { path: "/racas", lazy: page(() => import("./pages/racas/page")) },
          {
            path: "/recepcoes",
            lazy: page(() => import("./pages/recepcoes/page")),
          },
          {
            path: "/recepcoes/:id",
            lazy: page(() => import("./pages/recepcoes/[id]/page")),
          },
          {
            path: "/recepcoes/:id/:animalId",
            lazy: page(() => import("./pages/recepcoes/[id]/[animalId]/page")),
          },
          {
            path: "/recepcoes/:id/:animalId/:passo",
            lazy: page(
              () => import("./pages/recepcoes/[id]/[animalId]/[passo]/page"),
            ),
          },
          {
            path: "/recepcoes/compras/:id",
            lazy: page(() => import("./pages/recepcoes/compras/[id]/page")),
          },
          {
            path: "/tecnicas-castracao",
            lazy: page(() => import("./pages/tecnicas-castracao/page")),
          },
          {
            path: "/tipos-sanitarios",
            lazy: page(() => import("./pages/tipos-sanitarios/page")),
          },
          {
            path: "/usuarios",
            lazy: page(() => import("./pages/usuarios/page")),
          },
          { path: "/vendas", lazy: page(() => import("./pages/vendas/page")) },
        ],
      },
      { path: "*", lazy: page(() => import("./pages/nao-encontrada/page")) },
    ],
  },
]);
