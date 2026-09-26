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
  defaultOccupationDays: number | null;
  defaultRestDays: number | null;
  notes: string | null;
  propertyId: string;
  closedAt: string | null;
  updatedAt: string;
  /** Lote que ocupa a área hoje; null quando livre. */
  occupancy: {
    batch: { id: string; name: string };
    occupiedSince: string;
    animalCount: number;
    currentUa: number;
    estimatedCount: number;
    capacityUa: number;
    exceeds: boolean;
  } | null;
  /** Saída do último lote (início do descanso); null se nunca foi ocupada. */
  lastExitAt: string | null;
};

export type AreaOccupancyHistoryEntry = {
  id: number;
  batch: { id: string; name: string };
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};

const API_ENDPOINTS = {
  AREAS: "/api/area",
  AREA_BY_ID: (id: string) => `/api/area/${id}`,
  AREA_HISTORY: (id: string) => `/api/area/${id}/history`,
} as const;

export async function getAreas(
  params: { propertyId?: string; status?: string } = {},
): Promise<{ data: AreaRow[] }> {
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
    throw new Error(
      result.message ?? "Não foi possível buscar os dados da área.",
    );
  }

  return {
    name: result.name,
    polygon: result.polygon,
    hectares: String(result.hectares),
    stockingRate: String(result.stockingRate),
    defaultOccupationDays: result.defaultOccupationDays?.toString() ?? "",
    defaultRestDays: result.defaultRestDays?.toString() ?? "",
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
    throw new ApiError(
      result.message ?? "Não foi possível salvar a área.",
      result.errors,
    );
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
    throw new ApiError(
      result.message ?? "Não foi possível atualizar a área.",
      result.errors,
    );
  }

  return result;
}

export async function deleteArea(id: string) {
  const response = await fetch(API_ENDPOINTS.AREA_BY_ID(id), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível excluir a área.");
  }

  return result;
}

// Recusa de desativação por haver um lote na área.
export class AreaOccupiedError extends Error {
  constructor(
    message: string,
    public batch: { id: string; name: string },
  ) {
    super(message);
    this.name = "AreaOccupiedError";
  }
}

export async function toggleAreaStatus(id: string) {
  const response = await fetch(API_ENDPOINTS.AREA_BY_ID(id), {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    if (result.code === "OCCUPIED") {
      throw new AreaOccupiedError(result.message, result.batch);
    }
    throw new Error(
      result.message ?? "Não foi possível alterar o status da área.",
    );
  }

  return result;
}

export async function getAreaOccupancyHistory(
  id: string,
): Promise<AreaOccupancyHistoryEntry[]> {
  const response = await fetch(API_ENDPOINTS.AREA_HISTORY(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível buscar o histórico da área.",
    );
  }

  return result.data;
}
