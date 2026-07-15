import { PersonFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type PersonRow = {
  id: string;
  type: string;
  taxId: string;
  name: string;
  phone: string | null;
  email: string | null;
  deactivatedAt: string | null;
  updatedAt: string;
};

const API_ENDPOINTS = {
  PEOPLE: "/api/person",
  PERSON_BY_ID: (id: string) => `/api/person/${id}`,
} as const;

export async function createPerson(data: PersonFormData) {
  const response = await fetch(API_ENDPOINTS.PEOPLE, {
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



export async function updatePerson(id: string, data: PersonFormData) {
  const response = await fetch(API_ENDPOINTS.PERSON_BY_ID(id), {
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



export async function deletePerson(id: string) {
  const response = await fetch(API_ENDPOINTS.PERSON_BY_ID(id), { method: "DELETE" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export async function togglePersonStatus(id: string) {
  const response = await fetch(API_ENDPOINTS.PERSON_BY_ID(id), { method: "PATCH" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export async function getPerson(id: string): Promise<PersonFormData> {
  const response = await fetch(API_ENDPOINTS.PERSON_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export type PersonListResult = {
  data: PersonRow[];
  total: number;
  pageCount: number;
};

export async function getPeople(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  status?: string;
} = {}): Promise<PersonListResult> {
  const { page = 0, pageSize = 10, search = "", type = "", status = "" } = params;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);
  if (type) query.set("type", type);
  if (status) query.set("status", status);

  const response = await fetch(`${API_ENDPOINTS.PEOPLE}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}
