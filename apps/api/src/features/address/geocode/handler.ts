import type { Coordinates, GeocodeQuery } from "@ifarm/shared";
import { cached, getJson } from "../external";

const geocodeCache = cached<Coordinates | null>();

// Política de uso do Nominatim: no máximo 1 requisição por segundo e identificação de quem
// chama (User-Agent). As consultas entram numa fila e saem com pelo menos 1,1 s de intervalo.
const NOMINATIM_HEADERS = {
  "User-Agent": "iFarm/0.1 (sistema de gestão pecuária)",
  "Accept-Language": "pt-BR",
};
const NOMINATIM_INTERVAL_MS = 1100;
// Quando a próxima consulta pode sair: cada uma responde assim que chega e só atrasa a seguinte.
let nextSlot: Promise<void> = Promise.resolve();

function nominatimSearch(params: Record<string, string>) {
  const query = new URLSearchParams({
    ...params,
    format: "json",
    country: "Brasil",
    limit: "1",
  });
  const run = nextSlot.then(async () => {
    const results = (await getJson(
      `https://nominatim.openstreetmap.org/search?${query}`,
      NOMINATIM_HEADERS,
    )) as { lat: string; lon: string }[];
    const first = results[0];
    return first
      ? { latitude: Number(first.lat), longitude: Number(first.lon) }
      : null;
  });
  nextSlot = run
    .catch(() => {})
    .then(
      () =>
        new Promise((resolve) => setTimeout(resolve, NOMINATIM_INTERVAL_MS)),
    );
  return run;
}

/**
 * Coordenadas aproximadas do endereço; null se nada foi encontrado. Tenta, na ordem: o endereço
 * completo, só o CEP e a cidade com o estado.
 */
export async function geocode({ street, city, state, zipCode }: GeocodeQuery) {
  const postalcode = zipCode?.replace(/\D/g, "") || undefined;
  const key = JSON.stringify([street, city, state, postalcode]);
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const attempts: Record<string, string>[] = [];
  if (street && city && state)
    attempts.push({ street, city, state, ...(postalcode && { postalcode }) });
  if (postalcode) attempts.push({ postalcode });
  if (city && state) attempts.push({ city, state });

  let found: Coordinates | null = null;
  for (const attempt of attempts) {
    found = await nominatimSearch(attempt);
    if (found) break;
  }
  geocodeCache.set(key, found);
  return found;
}
