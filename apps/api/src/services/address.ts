// Consultas de endereço em serviços externos: ViaCEP (endereço pelo CEP) e Nominatim, do
// OpenStreetMap (coordenadas pelo endereço). As telas chamam a API, e só ela fala com eles.
import type { Coordinates, GeocodeQuery, ZipCodeAddress } from "@ifarm/shared";

/** Falha ao falar com o serviço externo (fora do ar, lento, resposta inválida). */
export class ExternalServiceError extends Error {}

const TIMEOUT_MS = 8000;

// Resultados guardados em memória (endereços não mudam): até MAX_CACHED por tipo de consulta.
const MAX_CACHED = 1000;
function cached<T>() {
  const store = new Map<string, T>();
  return {
    get: (key: string) => store.get(key),
    has: (key: string) => store.has(key),
    set(key: string, value: T) {
      if (store.size >= MAX_CACHED) store.delete(store.keys().next().value!);
      store.set(key, value);
    },
  };
}

const zipCache = cached<ZipCodeAddress | null>();
const geocodeCache = cached<Coordinates | null>();

async function getJson(url: string, headers?: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ExternalServiceError(`Falha ao consultar ${new URL(url).host}`, {
      cause: error,
    });
  }
  if (!response.ok) {
    throw new ExternalServiceError(
      `${new URL(url).host} respondeu ${response.status}`,
    );
  }
  return (await response.json()) as unknown;
}

type ViaCepResponse = {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

/** Endereço do CEP (8 dígitos); null se o CEP não existe. */
export async function lookupZipCode(digits: string) {
  if (zipCache.has(digits)) return zipCache.get(digits)!;
  const data = (await getJson(
    `https://viacep.com.br/ws/${digits}/json/`,
  )) as ViaCepResponse;
  const address: ZipCodeAddress | null = data.erro
    ? null
    : {
        zipCode: digits,
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
  zipCache.set(digits, address);
  return address;
}

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
