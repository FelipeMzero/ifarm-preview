// Consultas de endereço em serviços externos: ViaCEP (endereço pelo CEP) e Nominatim, do
// OpenStreetMap (coordenadas pelo endereço). As telas chamam a API, e só ela fala com eles.
// Aqui fica o que as duas consultas usam: a chamada com tempo limite, o cache e o erro.

/** Falha ao falar com o serviço externo (fora do ar, lento, resposta inválida). */
export class ExternalServiceError extends Error {}

const TIMEOUT_MS = 8000;

// Resultados guardados em memória (endereços não mudam): até MAX_CACHED por tipo de consulta.
const MAX_CACHED = 1000;
export function cached<T>() {
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

export async function getJson(url: string, headers?: Record<string, string>) {
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

// Falha do serviço externo: 502, com a mensagem para a tela.
export function externalErrorResponse(error: unknown, message: string) {
  if (error instanceof ExternalServiceError) {
    console.warn(error.message);
    return Response.json({ message }, { status: 502 });
  }
  throw error;
}
