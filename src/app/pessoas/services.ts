import { PessoaFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type PessoaRow = {
  id: string;
  tipo: string;
  documento: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  excluidoEm: string | null;
  atualizadoEm: string;
};

const API_ENDPOINTS = {
  PESSOAS: "/api/pessoas",
  PESSOA_BY_ID: (id: string) => `/api/pessoas/${id}`,
} as const;

export async function createPessoa(data: PessoaFormData) {
  const response = await fetch(API_ENDPOINTS.PESSOAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível salvar a pessoa.", result.errors);
  }

  return result;
}



export async function updatePessoa(id: string, data: PessoaFormData) {
  const response = await fetch(API_ENDPOINTS.PESSOA_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível atualizar a pessoa.", result.errors);
  }

  return result;
}



export async function deletePessoa(id: string) {
  const response = await fetch(API_ENDPOINTS.PESSOA_BY_ID(id), { method: "DELETE" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export async function getPessoa(id: string): Promise<PessoaFormData> {
  const response = await fetch(API_ENDPOINTS.PESSOA_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export type PessoaListResult = {
  data: PessoaRow[];
  total: number;
  pageCount: number;
};

export async function getPessoas(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  tipo?: string;
} = {}): Promise<PessoaListResult> {
  const { page = 0, pageSize = 10, search = "", tipo = "" } = params;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);
  if (tipo) query.set("tipo", tipo);

  const response = await fetch(`${API_ENDPOINTS.PESSOAS}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}
