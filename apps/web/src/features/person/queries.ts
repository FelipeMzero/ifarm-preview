import { queryOptions } from "@tanstack/react-query";
import type { PersonListParams } from "@ifarm/shared";
import { personClient } from "@/lib/clients";

// Chaves das consultas de pessoas no cache (TanStack Query).
export const personKeys = {
  all: ["people"] as const,
  list: (params: PersonListParams) => ["people", "list", params] as const,
  detail: (id: string) => ["people", "detail", id] as const,
};

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery.
export const personListQuery = (params: PersonListParams) =>
  queryOptions({
    queryKey: personKeys.list(params),
    queryFn: () => personClient.getPeople(params),
  });

export const personDetailQuery = (id: string) =>
  queryOptions({
    queryKey: personKeys.detail(id),
    queryFn: () => personClient.getPerson(id),
  });
