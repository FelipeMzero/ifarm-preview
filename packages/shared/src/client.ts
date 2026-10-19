// Base dos clientes da API compartilhados entre o web e o mobile. Cada app fornece a função
// `ApiRequest`, que resolve o que é dele: a URL base e o envio da sessão.

export type ApiRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type ApiResponse = {
  ok: boolean;
  json(): Promise<unknown>;
};

/** Faz a requisição para `path` (ex.: "/api/person"), relativo à origem da API. */
export type ApiRequest = (
  path: string,
  init?: ApiRequestInit,
) => Promise<ApiResponse>;

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

type ErrorBody = { message?: string; errors?: Record<string, string> };

/**
 * Lê o corpo JSON; em resposta de erro, lança ApiError com a mensagem e os erros por campo.
 * Com `messageField`, o erro desse campo, se houver, vira a mensagem principal (telas que só
 * mostram um aviso, sem destacar campos).
 */
export async function readJson<T>(
  response: ApiResponse,
  fallbackMessage: string,
  messageField?: string,
): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    const { message, errors } = (body ?? {}) as ErrorBody;
    const fieldMessage = messageField ? errors?.[messageField] : undefined;
    throw new ApiError(fieldMessage ?? message ?? fallbackMessage, errors);
  }
  return body as T;
}

/**
 * Monta a query string ignorando valores vazios. Não usa URLSearchParams: ele não está nos tipos
 * deste pacote (sem "dom") e é incompleto no React Native.
 */
export function toQueryString(
  params: Record<string, string | number | undefined>,
): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
}

export function jsonRequest(method: string, data: unknown): ApiRequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
