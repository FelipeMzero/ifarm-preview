import { queryOptions } from "@tanstack/react-query";
import { healthManagementTypeClient } from "@/lib/clients";

// Chaves das consultas de tipos de manejo sanitário no cache (TanStack Query). Invalidar `all`
// recarrega a lista depois de criar, alterar, ativar/desativar ou excluir.
export const healthManagementTypeKeys = {
  all: ["healthManagementTypes"] as const,
  list: () => ["healthManagementTypes", "list"] as const,
};

// A consulta (com o cliente do @ifarm/shared), usada pelas telas com useQuery; definida aqui
// para a chave e a busca andarem juntas.
export const healthManagementTypeListQuery = () =>
  queryOptions({
    queryKey: healthManagementTypeKeys.list(),
    queryFn: () => healthManagementTypeClient.getHealthManagementTypes(),
  });
