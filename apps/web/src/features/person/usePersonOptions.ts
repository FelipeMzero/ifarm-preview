import { useCallback, useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SearchComboboxItem } from "@/components/our/SearchCombobox";
import { personDetailQuery, personKeys, personListQuery } from "./queries";

type SelectedPerson = { id?: string | null; name?: string | null } | null;

/**
 * Opções de um campo para escolher uma pessoa (ex.: titular da propriedade, vendedor): as 5
 * primeiras pessoas ativas ou, com busca digitada, até 20 que batem com ela (depois de uma
 * pausa). Sem busca, a pessoa já escolhida (`selected`) e a recém-cadastrada (`addCreated`)
 * entram no topo, se não vierem na lista, para o campo ter o nome delas.
 */
export function usePersonOptions({
  selected = null,
}: { selected?: SelectedPerson } = {}) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchPeople = useCallback((query: string) => {
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
    ...personListQuery({
      search,
      pageSize: search ? 20 : 5,
      status: "active",
    }),
    placeholderData: keepPreviousData,
  });
  const listed: SearchComboboxItem[] =
    data?.data.map((p) => ({ value: p.id, label: p.name })) ?? [];

  const [created, setCreated] = useState<SearchComboboxItem | null>(null);
  const pinned: SearchComboboxItem[] = search
    ? []
    : [
        created,
        selected?.id && selected.name
          ? { value: selected.id, label: selected.name }
          : null,
      ].filter(
        (o): o is SearchComboboxItem =>
          !!o && !listed.some((l) => l.value === o.value),
      );

  /** Pessoa cadastrada agora (ex.: pelo modal): recarrega as opções e a põe no topo. */
  async function addCreated(id: string) {
    queryClient.invalidateQueries({ queryKey: personKeys.all });
    const person = await queryClient.query(personDetailQuery(id));
    setCreated({ value: id, label: person.name });
    return person;
  }

  return { items: [...pinned, ...listed], search: searchPeople, addCreated };
}
