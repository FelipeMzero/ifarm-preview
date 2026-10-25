import { queryOptions, useQueryClient } from "@tanstack/react-query";
import type { AnimalListParams, IdentifierKind } from "@ifarm/shared";
import { animalClient } from "@/lib/clients";

// Chaves das consultas de animais no cache (TanStack Query). Invalidar `all` recarrega as
// listas, o cadastro, os detalhes e os históricos depois de qualquer alteração (criar, editar,
// excluir, registrar ou corrigir pesagem, castração e identificação).
export const animalKeys = {
  all: ["animals"] as const,
  list: (params: AnimalListParams) => ["animals", "list", params] as const,
  detail: (id: string) => ["animals", "detail", id] as const,
  fullDetails: (id: string) => ["animals", "fullDetails", id] as const,
  commitments: (id: string) => ["animals", "commitments", id] as const,
  weighings: (id: string) => ["animals", "weighings", id] as const,
  neuterings: (id: string) => ["animals", "neuterings", id] as const,
  identifiers: (id: string, kind: IdentifierKind) =>
    ["animals", "identifiers", id, kind] as const,
};

/**
 * Recarrega o que foi buscado de animais (listas, cadastro, ficha e históricos) depois de uma
 * alteração. A promessa termina quando as consultas na tela foram buscadas de novo.
 */
export function useReloadAnimals() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: animalKeys.all });
}

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const animalListQuery = (params: AnimalListParams) =>
  queryOptions({
    queryKey: animalKeys.list(params),
    queryFn: () => animalClient.getAnimals(params),
  });

/** Cadastro do animal (edição). */
export const animalDetailQuery = (id: string) =>
  queryOptions({
    queryKey: animalKeys.detail(id),
    queryFn: () => animalClient.getAnimal(id),
  });

/** Ficha completa (tela de detalhes): cadastro, históricos e indicadores. */
export const animalFullDetailsQuery = (id: string) =>
  queryOptions({
    queryKey: animalKeys.fullDetails(id),
    queryFn: () => animalClient.getAnimalDetails(id),
  });

/** Operações em aberto do animal (avisos de conflito nos registros). */
export const animalCommitmentsQuery = (id: string) =>
  queryOptions({
    queryKey: animalKeys.commitments(id),
    queryFn: () => animalClient.getAnimalCommitments(id),
  });

export const animalWeighingsQuery = (id: string) =>
  queryOptions({
    queryKey: animalKeys.weighings(id),
    queryFn: () => animalClient.getWeighings(id),
  });

export const animalNeuteringsQuery = (id: string) =>
  queryOptions({
    queryKey: animalKeys.neuterings(id),
    queryFn: () => animalClient.getNeuterings(id),
  });

export const animalIdentifiersQuery = (id: string, kind: IdentifierKind) =>
  queryOptions({
    queryKey: animalKeys.identifiers(id, kind),
    queryFn: () => animalClient.getIdentifiers(id, kind),
  });
