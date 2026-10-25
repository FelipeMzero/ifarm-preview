import { queryOptions } from "@tanstack/react-query";
import { currentPropertyClient } from "@/lib/clients";
import { propertyKeys } from "@/features/property/queries";

// Chaves das consultas da propriedade atual (a selecionada no menu lateral) no cache
// (TanStack Query). Ficam dentro das de propriedades: alterar, desativar ou excluir uma
// propriedade (que invalida propertyKeys.all) recarrega também a atual e o painel.
export const currentPropertyKeys = {
  all: [...propertyKeys.all, "current"] as const,
  selected: () => [...propertyKeys.all, "current", "selected"] as const,
  // A propriedade faz parte da chave: ao trocar no menu, o painel busca a nova.
  details: (propertyId?: string) =>
    [...propertyKeys.all, "current", "details", { propertyId }] as const,
};

/** Propriedade selecionada pelo usuário (null se nenhuma). */
export const currentPropertyQuery = () =>
  queryOptions({
    queryKey: currentPropertyKeys.selected(),
    queryFn: () => currentPropertyClient.getCurrentProperty(),
  });

/** Dados da propriedade atual para o painel (null se nenhuma estiver selecionada). */
export const currentPropertyDetailsQuery = (propertyId?: string) =>
  queryOptions({
    queryKey: currentPropertyKeys.details(propertyId),
    queryFn: () => currentPropertyClient.getCurrentPropertyDetails(),
  });
