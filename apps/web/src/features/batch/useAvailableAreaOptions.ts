import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SearchComboboxItem } from "@/components/our/SearchCombobox";
import { availableAreasQuery } from "./queries";

/**
 * Opções de um campo para escolher a área de um lote: as áreas ativas e livres da propriedade,
 * filtradas pela busca digitada (depois de uma pausa). `exclude` tira uma área das opções
 * (ex.: a atual, numa troca de área); com `enabled` falso (ex.: diálogo fechado), não busca.
 */
export function useAvailableAreaOptions({
  propertyId,
  exclude,
  enabled = true,
}: {
  propertyId?: string;
  exclude?: string | null;
  enabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAreas = useCallback((query: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(query), 300);
  }, []);
  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );

  const { data, isPending } = useQuery({
    ...availableAreasQuery(search, propertyId),
    // Só com a propriedade: a API pede sempre o propertyId.
    enabled: enabled && !!propertyId,
    placeholderData: keepPreviousData,
  });
  const items: SearchComboboxItem[] =
    data?.data
      .filter((a) => a.id !== exclude)
      .map((a) => ({ value: a.id, label: a.name })) ?? [];

  /** Volta à lista inicial (ex.: ao fechar o diálogo que usa as opções). */
  function clearSearch() {
    if (debounce.current) clearTimeout(debounce.current);
    setSearch("");
  }

  return { items, search: searchAreas, clearSearch, isLoading: isPending };
}
