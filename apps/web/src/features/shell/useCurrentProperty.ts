import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_TIME_ZONE } from "@ifarm/shared";
import { currentPropertyClient } from "@/lib/clients";
import { propertyOptionsQuery } from "@/features/property/queries";
import { currentPropertyKeys, currentPropertyQuery } from "./queries";

/**
 * Propriedade atualmente selecionada (no menu lateral) e as que podem ser escolhidas. Fonte
 * única para qualquer tela da área logada: vem do cache, então trocar no menu vale para todas,
 * e as telas que listam por propriedade buscam de novo (a propriedade faz parte das chaves).
 */
export function useCurrentProperty() {
  const queryClient = useQueryClient();
  const current = useQuery(currentPropertyQuery());
  const options = useQuery(propertyOptionsQuery());

  /** Troca a propriedade atual (gravada no servidor, para valer também no próximo acesso). */
  async function select(propertyId: string) {
    const updated = await currentPropertyClient.setCurrentProperty(propertyId);
    // Uma busca ainda em andamento (ex.: a do menu aberto) traria a propriedade anterior e
    // sobrescreveria a troca: é cancelada antes de gravar a nova no cache.
    await queryClient.cancelQueries({
      queryKey: currentPropertyKeys.selected(),
    });
    queryClient.setQueryData(currentPropertyKeys.selected(), updated);
  }

  /** Busca de novo a propriedade atual e as opções (ex.: ao abrir o menu). */
  function refresh() {
    current.refetch();
    options.refetch();
  }

  return {
    property: current.data ?? null,
    // Fuso da propriedade (RN-PROPRIEDADE-05): o "agora" dos campos de data e hora. Antes de
    // carregar, o padrão (horário de Brasília).
    timeZone: current.data?.timeZone ?? DEFAULT_TIME_ZONE,
    options: options.data ?? [],
    // Só a primeira carga: sem as respostas, as telas não sabem a propriedade. Uma falha
    // encerra a carga (sem propriedade), e a tela segue com o que tem.
    isLoading: current.isPending || options.isPending,
    select,
    refresh,
  };
}

/**
 * A propriedade de um envio à API (a API pede sempre o propertyId). As telas que dependem de
 * propriedade já mostram NoPropertySelected quando não há nenhuma; isto só garante o tipo.
 */
export function requirePropertyId(propertyId: string | undefined): string {
  if (!propertyId) throw new Error("Selecione uma propriedade no menu.");
  return propertyId;
}
