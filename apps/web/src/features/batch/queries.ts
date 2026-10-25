import { queryOptions } from "@tanstack/react-query";
import type { BatchListParams } from "@ifarm/shared";
import { batchClient } from "@/lib/clients";

// Chaves das consultas de lotes no cache (TanStack Query). Invalidar `all` recarrega as listas
// e os detalhes depois de criar, alterar, encerrar, reabrir ou excluir.
export const batchKeys = {
  all: ["batches"] as const,
  list: (params: BatchListParams) => ["batches", "list", params] as const,
  detail: (id: string) => ["batches", "detail", id] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const batchListQuery = (params: BatchListParams) =>
  queryOptions({
    queryKey: batchKeys.list(params),
    queryFn: () => batchClient.getBatches(params),
  });

export const batchDetailQuery = (id: string) =>
  queryOptions({
    queryKey: batchKeys.detail(id),
    queryFn: () => batchClient.getBatch(id),
  });
