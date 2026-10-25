import { queryOptions, useQueryClient } from "@tanstack/react-query";
import type { ManagementSessionListParams } from "@ifarm/shared";
import { managementSessionClient } from "@/lib/clients";
import { animalKeys } from "@/features/animal/queries";
import { batchKeys } from "@/features/batch/queries";

// Chaves das consultas de sessões de manejo no cache (TanStack Query). Invalidar `all` recarrega
// as listas, as sessões e o registro de cada animal depois de planejar, iniciar, registrar,
// receber animais, consolidar ou cancelar.
export const managementSessionKeys = {
  all: ["managementSessions"] as const,
  lists: () => ["managementSessions", "list"] as const,
  list: (params: ManagementSessionListParams) =>
    ["managementSessions", "list", params] as const,
  detail: (id: string) => ["managementSessions", "detail", id] as const,
  animal: (sessionId: string, animalId: string) =>
    ["managementSessions", "animal", sessionId, animalId] as const,
  options: (propertyId?: string) =>
    ["managementSessions", "options", { propertyId }] as const,
};

/**
 * Recarrega o que uma sessão altera: as sessões, os animais (registros que passam a valer e
 * operações em aberto, que decidem o que cada um pode fazer) e os lotes (apartação). A promessa
 * termina quando as consultas na tela foram buscadas de novo.
 */
export function useReloadSessions() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [managementSessionKeys.all, animalKeys.all, batchKeys.all].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

// As consultas (com o cliente do @ifarm/shared), usadas pelas telas com useQuery; definidas aqui
// para a chave e a busca andarem juntas.
export const managementSessionListQuery = (
  params: ManagementSessionListParams,
) =>
  queryOptions({
    queryKey: managementSessionKeys.list(params),
    queryFn: () => managementSessionClient.getManagementSessions(params),
  });

export const managementSessionDetailQuery = (id: string) =>
  queryOptions({
    queryKey: managementSessionKeys.detail(id),
    queryFn: () => managementSessionClient.getManagementSession(id),
  });

/** Registro de um animal na sessão: as etapas, o que já foi registrado e o animal. */
export const sessionAnimalQuery = (sessionId: string, animalId: string) =>
  queryOptions({
    queryKey: managementSessionKeys.animal(sessionId, animalId),
    queryFn: () =>
      managementSessionClient.getSessionAnimal(sessionId, animalId),
  });

/** Opções para planejar manejos: lotes, tipos sanitários, técnicas e pessoas da propriedade. */
export const managementOptionsQuery = (propertyId?: string) =>
  queryOptions({
    queryKey: managementSessionKeys.options(propertyId),
    queryFn: () => managementSessionClient.getManagementOptions(propertyId),
  });
