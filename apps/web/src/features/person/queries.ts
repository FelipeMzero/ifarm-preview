import type { PersonListParams } from "@ifarm/shared";

// Chaves das consultas de pessoas no cache (TanStack Query).
export const personKeys = {
  all: ["people"] as const,
  list: (params: PersonListParams) => ["people", "list", params] as const,
  detail: (id: string) => ["people", "detail", id] as const,
};
