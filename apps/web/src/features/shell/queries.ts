import { queryOptions } from "@tanstack/react-query";
import { currentPropertyClient } from "@/lib/clients";

// Chaves das consultas da propriedade atual (a selecionada no menu lateral) no cache
// (TanStack Query). Invalidar `all` recarrega o que depende dela depois de trocar de propriedade
// ou de alterar a propriedade selecionada.
export const currentPropertyKeys = {
  all: ["currentProperty"] as const,
  // A propriedade faz parte da chave: ao trocar no menu, o painel busca a nova.
  details: (propertyId?: string) =>
    ["currentProperty", "details", { propertyId }] as const,
};

/** Dados da propriedade atual para o painel (null se nenhuma estiver selecionada). */
export const currentPropertyDetailsQuery = (propertyId?: string) =>
  queryOptions({
    queryKey: currentPropertyKeys.details(propertyId),
    queryFn: () => currentPropertyClient.getCurrentPropertyDetails(),
  });
