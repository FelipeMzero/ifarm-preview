import { queryOptions } from "@tanstack/react-query";
import type { Coordinates, GeocodeParams } from "@ifarm/shared";
import { addressClient } from "@/lib/clients";

// Consultas de endereço (CEP, coordenadas e fuso horário), usadas pelos formulários de pessoa
// e propriedade e pelo mapa de áreas. Endereços não mudam: o resultado fica no cache sem expirar.
export const addressKeys = {
  zipCode: (digits: string) => ["address", "zip-code", digits] as const,
  geocode: (params: GeocodeParams) => ["address", "geocode", params] as const,
  timeZone: (coordinates: Coordinates) =>
    ["address", "time-zone", coordinates] as const,
};

/** Fuso horário do Brasil em que fica o ponto (sugestão do fuso da propriedade). */
export const timeZoneQuery = (coordinates: Coordinates) =>
  queryOptions({
    queryKey: addressKeys.timeZone(coordinates),
    queryFn: () => addressClient.lookupTimeZone(coordinates),
    staleTime: Infinity,
  });

export const zipCodeQuery = (zipCode: string) => {
  const digits = zipCode.replace(/\D/g, "");
  return queryOptions({
    queryKey: addressKeys.zipCode(digits),
    queryFn: () => addressClient.lookupZipCode(digits),
    staleTime: Infinity,
  });
};

export const geocodeQuery = (params: GeocodeParams) =>
  queryOptions({
    queryKey: addressKeys.geocode(params),
    queryFn: () => addressClient.geocode(params),
    staleTime: Infinity,
  });
