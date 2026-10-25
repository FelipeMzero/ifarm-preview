import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    options: options.data ?? [],
    // Só a primeira carga: sem as respostas, as telas não sabem a propriedade. Uma falha
    // encerra a carga (sem propriedade), e a tela segue com o que tem.
    isLoading: current.isPending || options.isPending,
    select,
    refresh,
  };
}
