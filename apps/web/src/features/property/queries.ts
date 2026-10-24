import { queryOptions } from "@tanstack/react-query";
import type { PropertyListParams } from "@ifarm/shared";
import { propertyClient } from "@/lib/clients";

// Chaves das consultas de propriedades no cache (TanStack Query). Invalidar `all` recarrega
// as listas e os detalhes depois de criar, alterar, ativar/desativar ou excluir.
export const propertyKeys = {
  all: ["properties"] as const,
  list: (params: PropertyListParams) => ["properties", "list", params] as const,
  detail: (id: string) => ["properties", "detail", id] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas (useQuery) e pelos loaders
// das rotas (src/router.tsx), que começam a busca no clique, junto com o código da página.
export const propertyListQuery = (params: PropertyListParams) =>
  queryOptions({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertyClient.getProperties(params),
  });

export const propertyDetailQuery = (id: string) =>
  queryOptions({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyClient.getProperty(id),
  });

// Filtros com que a lista abre (os mesmos do estado inicial de PropertyList).
export const INITIAL_PROPERTY_LIST_PARAMS = {
  page: 0,
  pageSize: 10,
  search: "",
  status: "active",
} satisfies PropertyListParams;
