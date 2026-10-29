import { useCallback, useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SearchComboboxItem } from "@/components/our/SearchCombobox";
import { useCurrentProperty } from "@/features/shell/useCurrentProperty";
import { batchDetailQuery, batchKeys, batchListQuery } from "./queries";

/**
 * Opções de um campo para escolher um lote vigente de uma propriedade (`propertyId`; sem ela, a
 * propriedade atual): os 10 primeiros ou, com busca digitada, até 20 que batem com ela (depois
 * de uma pausa). Sem busca, o já escolhido (`selected`) e o recém-cadastrado (`addCreated`)
 * entram no topo, se não vierem na lista, para o campo ter o nome deles. `exclude` tira um lote
 * das opções (ex.: o atual, numa troca de lote); com `enabled` falso (ex.: diálogo fechado), não
 * busca.
 */
export function useBatchOptions({
  propertyId,
  exclude,
  selected = null,
  enabled = true,
}: {
  propertyId?: string;
  exclude?: string | null;
  selected?: { id: string; name: string } | null;
  enabled?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const current = useCurrentProperty();
  const property = propertyId ? { id: propertyId } : current.property;

  const [search, setSearch] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBatches = useCallback((query: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(query), 300);
  }, []);
  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );

  const { data } = useQuery({
    ...batchListQuery({
      propertyId: property?.id,
      status: "active",
      search,
      pageSize: search ? 20 : 10,
    }),
    // Só com a propriedade: a API pede sempre o propertyId.
    enabled: enabled && !!property,
    placeholderData: keepPreviousData,
  });
  const listed: SearchComboboxItem[] =
    data?.data
      .filter((b) => b.id !== exclude)
      .map((b) => ({ value: b.id, label: b.name })) ?? [];

  const [created, setCreated] = useState<SearchComboboxItem | null>(null);
  const pinned: SearchComboboxItem[] = search
    ? []
    : [
        created,
        selected ? { value: selected.id, label: selected.name } : null,
      ].filter(
        (o, i, all): o is SearchComboboxItem =>
          !!o &&
          !listed.some((l) => l.value === o.value) &&
          all.findIndex((x) => x?.value === o.value) === i,
      );

  /** Lote cadastrado agora (ex.: pelo modal): recarrega as opções e o põe no topo. */
  async function addCreated(id: string) {
    queryClient.invalidateQueries({ queryKey: batchKeys.all });
    const batch = await queryClient.query(batchDetailQuery(id));
    setCreated({ value: id, label: batch.name });
    return batch;
  }

  /** Volta à lista inicial (ex.: ao fechar o diálogo que usa as opções). */
  function clearSearch() {
    if (debounce.current) clearTimeout(debounce.current);
    setSearch("");
  }

  return {
    items: [...pinned, ...listed],
    search: searchBatches,
    clearSearch,
    addCreated,
  };
}
