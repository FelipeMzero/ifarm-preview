import { queryOptions, useQueryClient } from "@tanstack/react-query";
import type { ReceptionPurchaseListParams } from "@ifarm/shared";
import { receptionClient } from "@/lib/clients";
import { animalKeys } from "@/features/animal/queries";
import { batchKeys } from "@/features/batch/queries";
import { managementSessionKeys } from "@/features/management-session/queries";
import { purchaseKeys } from "@/features/purchase/queries";

// Chaves das consultas de recepções no cache (TanStack Query): as compras vistas por quem
// recebe (lista e detalhe, com as recepções de cada uma).
export const receptionKeys = {
  all: ["receptions"] as const,
  list: (params: ReceptionPurchaseListParams) =>
    ["receptions", "list", params] as const,
  purchase: (id: string) => ["receptions", "purchase", id] as const,
};

/**
 * Recarrega o que uma recepção altera: as compras (recebidos e situação), a própria sessão,
 * os animais recebidos e os lotes em que entram. A promessa termina quando as consultas na
 * tela foram buscadas de novo.
 */
export function useReloadReception() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [
        receptionKeys.all,
        purchaseKeys.all,
        managementSessionKeys.all,
        animalKeys.all,
        batchKeys.all,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const receptionPurchaseListQuery = (
  params: ReceptionPurchaseListParams,
) =>
  queryOptions({
    queryKey: receptionKeys.list(params),
    queryFn: () => receptionClient.getReceptionPurchases(params),
  });

export const receptionPurchaseQuery = (id: string) =>
  queryOptions({
    queryKey: receptionKeys.purchase(id),
    queryFn: () => receptionClient.getReceptionPurchase(id),
  });
