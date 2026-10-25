import { queryOptions } from "@tanstack/react-query";
import type { AreaListParams, StockingPreviewRequest } from "@ifarm/shared";
import { areaClient, stockingClient } from "@/lib/clients";

// Chaves das consultas de áreas no cache (TanStack Query). Invalidar `all` recarrega as listas,
// os históricos de ocupação e as prévias de lotação depois de criar, alterar, ativar/desativar
// ou excluir uma área.
export const areaKeys = {
  all: ["areas"] as const,
  list: (params: AreaListParams) => ["areas", "list", params] as const,
  occupancyHistory: (id: string) => ["areas", "occupancyHistory", id] as const,
  stockingPreview: (request: StockingPreviewRequest) =>
    ["areas", "stockingPreview", request] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const areaListQuery = (params: AreaListParams) =>
  queryOptions({
    queryKey: areaKeys.list(params),
    queryFn: () => areaClient.getAreas(params),
  });

export const areaOccupancyHistoryQuery = (id: string) =>
  queryOptions({
    queryKey: areaKeys.occupancyHistory(id),
    queryFn: () => areaClient.getAreaOccupancyHistory(id),
  });

/** Lotação da área depois de uma operação que leva animais para ela (aviso informativo). */
export const stockingPreviewQuery = (request: StockingPreviewRequest) =>
  queryOptions({
    queryKey: areaKeys.stockingPreview(request),
    queryFn: () => stockingClient.getStockingPreview(request),
  });

/**
 * Localização do navegador (para centralizar o mapa quando a propriedade não tem endereço).
 * Sem permissão ou sem resposta em 8 s, fica null. Pedida uma vez por sessão.
 */
export const browserLocationQuery = queryOptions({
  queryKey: ["browserLocation"],
  queryFn: () =>
    new Promise<[number, number] | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
        () => resolve(null),
        { timeout: 8000 },
      );
    }),
  staleTime: Infinity,
  retry: false,
});
