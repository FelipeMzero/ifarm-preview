import { queryOptions } from "@tanstack/react-query";
import { neuteringTechniqueClient } from "@/lib/clients";

// Chaves das consultas de técnicas de castração no cache (TanStack Query). Invalidar `all`
// recarrega a lista depois de criar, alterar, ativar/desativar ou excluir.
export const neuteringTechniqueKeys = {
  all: ["neuteringTechniques"] as const,
  list: () => ["neuteringTechniques", "list"] as const,
};

// A consulta (com o cliente do @ifarm/shared), usada pelas telas com useQuery; definida aqui
// para a chave e a busca andarem juntas.
export const neuteringTechniqueListQuery = () =>
  queryOptions({
    queryKey: neuteringTechniqueKeys.list(),
    queryFn: () => neuteringTechniqueClient.getNeuteringTechniques(),
  });
