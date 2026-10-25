import { queryOptions } from "@tanstack/react-query";
import { managementSessionClient } from "@/lib/clients";

// Chaves das consultas de sessões de manejo no cache (TanStack Query). Invalidar `all` recarrega
// as sessões depois de iniciar, registrar, receber animais, concluir ou cancelar.
// Por enquanto, só as consultas usadas pela recepção (que por baixo é uma sessão de manejo);
// a migração das telas de manejo completa o restante.
export const managementSessionKeys = {
  all: ["managementSessions"] as const,
  detail: (id: string) => ["managementSessions", "detail", id] as const,
  options: (propertyId?: string) =>
    ["managementSessions", "options", { propertyId }] as const,
};

export const managementSessionDetailQuery = (id: string) =>
  queryOptions({
    queryKey: managementSessionKeys.detail(id),
    queryFn: () => managementSessionClient.getManagementSession(id),
  });

/** Opções para planejar manejos: lotes, tipos sanitários, técnicas e pessoas da propriedade. */
export const managementOptionsQuery = (propertyId?: string) =>
  queryOptions({
    queryKey: managementSessionKeys.options(propertyId),
    queryFn: () => managementSessionClient.getManagementOptions(propertyId),
  });
