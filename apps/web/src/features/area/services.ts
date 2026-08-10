import { AreaFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type AreaRow = {
  id: string;
  name: string;
  polygon: any;
  hectares: number;
  stockingRate: number;
  notes: string | null;
  propertyId: string;
  deactivatedAt: string | null;
  updatedAt: string;
};

const API_ENDPOINTS = {
  AREAS: "/api/area",
  AREA_BY_ID: (id: string) => `/api/area/${id}`,
} as const;

export async function getAreas(params: { propertyId?: string; status?: string } = {}): Promise<{ data: AreaRow[] }> {
  const query = new URLSearchParams();
  if (params.propertyId) query.set("propertyId", params.propertyId);
  if (params.status) query.set("status", params.status);

  const response = await fetch(`${API_ENDPOINTS.AREAS}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível buscar as áreas.");
  }

  return result;
}

export async function getArea(id: string): Promise<AreaFormData> {
  const response = await fetch(API_ENDPOINTS.AREA_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível buscar os dados da área.");
  }

  return {
    name: result.name,
    polygon: result.polygon,
    hectares: String(result.hectares),
    stockingRate: String(result.stockingRate),
    notes: result.notes ?? "",
    propertyId: result.propertyId,
  };
}

export async function createArea(data: AreaFormData) {
  const response = await fetch(API_ENDPOINTS.AREAS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível salvar a área.", result.errors);
  }

  return result;
}

export async function updateArea(id: string, data: AreaFormData) {
  const response = await fetch(API_ENDPOINTS.AREA_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível atualizar a área.", result.errors);
  }

  return result;
}

export async function deleteArea(id: string) {
  const response = await fetch(API_ENDPOINTS.AREA_BY_ID(id), { method: "DELETE" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível excluir a área.");
  }

  return result;
}

export async function toggleAreaStatus(id: string) {
  const response = await fetch(API_ENDPOINTS.AREA_BY_ID(id), { method: "PATCH" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível alterar o status da área.");
  }

  return result;
}
