import { PropertyFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type PropertyRow = {
  id: string;
  name: string;
  totalArea: number | null;
  city: string | null;
  state: string | null;
  ownerName: string;
  updatedAt: string;
};

const API_ENDPOINTS = {
  PROPERTIES: "/api/property",
  PROPERTY_BY_ID: (id: string) => `/api/property/${id}`,
  PROPERTY_OPTIONS: "/api/property/options",
} as const;

export async function createProperty(data: PropertyFormData) {
  const response = await fetch(API_ENDPOINTS.PROPERTIES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível salvar a propriedade.", result.errors);
  }

  return result;
}



export async function updateProperty(id: string, data: PropertyFormData) {
  const response = await fetch(API_ENDPOINTS.PROPERTY_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível atualizar a propriedade.", result.errors);
  }

  return result;
}



export async function deleteProperty(id: string) {
  const response = await fetch(API_ENDPOINTS.PROPERTY_BY_ID(id), { method: "DELETE" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export async function getProperty(id: string): Promise<PropertyFormData> {
  const response = await fetch(API_ENDPOINTS.PROPERTY_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export type PropertyListResult = {
  data: PropertyRow[];
  total: number;
  pageCount: number;
};

export async function getProperties(params: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<PropertyListResult> {
  const { page = 0, pageSize = 10, search = "" } = params;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);

  const response = await fetch(`${API_ENDPOINTS.PROPERTIES}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export type PropertyOption = {
  id: string;
  name: string;
};

export async function getPropertyOptions(): Promise<PropertyOption[]> {
  const response = await fetch(API_ENDPOINTS.PROPERTY_OPTIONS);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
