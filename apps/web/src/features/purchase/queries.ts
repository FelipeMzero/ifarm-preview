import { queryOptions } from "@tanstack/react-query";
import type { PurchaseListParams } from "@ifarm/shared";
import { purchaseClient } from "@/lib/clients";

// Chaves das consultas de compras no cache (TanStack Query). Invalidar `all` recarrega as listas
// e os detalhes depois de criar, alterar, pagar, desfazer o pagamento, consolidar ou cancelar.
export const purchaseKeys = {
  all: ["purchases"] as const,
  list: (params: PurchaseListParams) => ["purchases", "list", params] as const,
  detail: (id: string) => ["purchases", "detail", id] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const purchaseListQuery = (params: PurchaseListParams) =>
  queryOptions({
    queryKey: purchaseKeys.list(params),
    queryFn: () => purchaseClient.getPurchases(params),
  });

export const purchaseDetailQuery = (id: string) =>
  queryOptions({
    queryKey: purchaseKeys.detail(id),
    queryFn: () => purchaseClient.getPurchase(id),
  });
