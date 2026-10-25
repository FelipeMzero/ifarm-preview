import { queryOptions } from "@tanstack/react-query";
import type { BatchListParams } from "@ifarm/shared";
import { batchClient } from "@/lib/clients";

// Chaves das consultas de lotes no cache (TanStack Query). Invalidar `all` recarrega as listas,
// os detalhes e as áreas disponíveis depois de criar, alterar, encerrar, reabrir ou excluir.
export const batchKeys = {
  all: ["batches"] as const,
  list: (params: BatchListParams) => ["batches", "list", params] as const,
  detail: (id: string) => ["batches", "detail", id] as const,
  fullDetails: (id: string) => ["batches", "fullDetails", id] as const,
  // Áreas sem lote: mudam quando um lote troca de área, é criado, encerrado ou reaberto.
  availableAreas: (search: string, propertyId?: string) =>
    ["batches", "availableAreas", { search, propertyId }] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const batchListQuery = (params: BatchListParams) =>
  queryOptions({
    queryKey: batchKeys.list(params),
    queryFn: () => batchClient.getBatches(params),
  });

/** Cadastro do lote (edição). */
export const batchDetailQuery = (id: string) =>
  queryOptions({
    queryKey: batchKeys.detail(id),
    queryFn: () => batchClient.getBatch(id),
  });

/** Ficha completa (tela de detalhes): animais, histórico, meta e lotação. */
export const batchFullDetailsQuery = (id: string) =>
  queryOptions({
    queryKey: batchKeys.fullDetails(id),
    queryFn: () => batchClient.getBatchDetails(id),
  });

/** Áreas ativas e livres (sem lote) da propriedade, para pôr um lote. */
export const availableAreasQuery = (search: string, propertyId?: string) =>
  queryOptions({
    queryKey: batchKeys.availableAreas(search, propertyId),
    queryFn: () => batchClient.getAreasForBatch(search, propertyId),
  });
