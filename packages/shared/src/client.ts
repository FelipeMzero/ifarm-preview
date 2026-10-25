// Base dos clientes da API compartilhados entre o web e o mobile. Cada app fornece a função
// `ApiRequest`, que resolve o que é dele: a URL base e o envio da sessão.

export type ApiRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type ApiResponse = {
  ok: boolean;
  /** Código HTTP da resposta (200, 404…). */
  status: number;
  json(): Promise<unknown>;
};

/** Faz a requisição para `path` (ex.: "/api/person"), relativo à origem da API. */
export type ApiRequest = (
  path: string,
  init?: ApiRequestInit,
) => Promise<ApiResponse>;

export class ApiError extends Error {
  errors?: Record<string, string>;
  /** Corpo completo da resposta de erro, para casos com dados extras (ex.: `code`). */
  body?: Record<string, unknown>;
  /** Código HTTP da resposta de erro (ex.: 404). */
  status?: number;

  constructor(
    message: string,
    errors?: Record<string, string>,
    body?: Record<string, unknown>,
    status?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
    this.body = body;
    this.status = status;
  }
}

/**
 * Erro do lado de quem pede (4xx: não encontrado, sem permissão, dados inválidos): pedir de
 * novo dá a mesma resposta.
 */
export function isClientError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
  );
}

/** O registro pedido não existe (ou foi excluído). */
export function isNotFoundError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404;
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
    throw new ApiError(
      fieldMessage ?? message ?? fallbackMessage,
      errors,
      (body ?? {}) as Record<string, unknown>,
      response.status,
    );
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
