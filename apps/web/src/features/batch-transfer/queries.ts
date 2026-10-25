import { queryOptions } from "@tanstack/react-query";
import type { BatchTransferListParams } from "@ifarm/shared";
import { batchTransferClient } from "@/lib/clients";

// Chaves das consultas de transferências entre lotes no cache (TanStack Query). Invalidar
// `all` recarrega as listas e os detalhes depois de criar, alterar, confirmar ou cancelar.
export const batchTransferKeys = {
  all: ["batchTransfers"] as const,
  list: (params: BatchTransferListParams) =>
    ["batchTransfers", "list", params] as const,
  detail: (id: string) => ["batchTransfers", "detail", id] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const batchTransferListQuery = (params: BatchTransferListParams) =>
  queryOptions({
    queryKey: batchTransferKeys.list(params),
    queryFn: () => batchTransferClient.getBatchTransfers(params),
  });

export const batchTransferDetailQuery = (id: string) =>
  queryOptions({
    queryKey: batchTransferKeys.detail(id),
    queryFn: () => batchTransferClient.getBatchTransfer(id),
  });
