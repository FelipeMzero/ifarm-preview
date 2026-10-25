import { queryOptions } from "@tanstack/react-query";
import { breedClient } from "@/lib/clients";

// Chaves das consultas de raças no cache (TanStack Query). Invalidar `all` recarrega a lista
// depois de criar, alterar, ativar/desativar ou excluir.
export const breedKeys = {
  all: ["breeds"] as const,
  list: () => ["breeds", "list"] as const,
};

// A consulta (com o cliente do @ifarm/shared), usada pelas telas com useQuery; definida aqui
// para a chave e a busca andarem juntas.
export const breedListQuery = () =>
  queryOptions({
    queryKey: breedKeys.list(),
    queryFn: () => breedClient.getBreeds(),
  });
