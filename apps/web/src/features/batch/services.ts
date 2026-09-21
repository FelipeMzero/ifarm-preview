import { BatchFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type BatchRow = {
  id: string;
  name: string;
  notes: string | null;
  hasMeta: boolean;
  targetDate: string | null;
  targetWeight: number | null;
  area: { id: string; name: string } | null;
  animalCount: number;
  avgWeightKg: number | null;
  closedAt: string | null;
  updatedAt: string;
};

export type BatchDetail = {
  id: string;
  name: string;
  notes: string;
  hasMeta: boolean;
  targetDate: string | null;
  targetWeight: number | null;
  currentArea: { id: string; name: string } | null;
  areaHistory: {
    id: number;
    area: { id: string; name: string };
    enteredAt: string;
    exitedAt: string | null;
    notes: string | null;
  }[];
  closedAt: string | null;
  updatedAt: string;
};

const API_ENDPOINTS = {
  BATCHES: "/api/batch",
  BATCH_BY_ID: (id: string) => `/api/batch/${id}`,
  AREAS: "/api/area",
} as const;

export async function getBatches(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    propertyId?: string;
  } = {},
): Promise<{
  data: BatchRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.propertyId) query.set("propertyId", params.propertyId);

  const response = await fetch(`${API_ENDPOINTS.BATCHES}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível buscar os lotes.");
  }

  return result;
}

export async function getBatch(id: string): Promise<BatchDetail> {
  const response = await fetch(API_ENDPOINTS.BATCH_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível buscar os dados do lote.",
    );
  }

  return result;
}

export async function createBatch(data: BatchFormData & { propertyId?: string }) {
  const response = await fetch(API_ENDPOINTS.BATCHES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível salvar o lote.",
      result.errors,
    );
  }

  return result;
}

export async function updateBatch(
  id: string,
  data: {
    name: string;
    notes?: string;
    hasMeta: boolean;
    targetDate?: string;
    targetWeight?: string;
    newAreaId?: string;
    areaChangeDescription?: string;
  },
) {
  const response = await fetch(API_ENDPOINTS.BATCH_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível atualizar o lote.",
      result.errors,
    );
  }

  return result;
}

export async function deleteBatch(id: string) {
  const response = await fetch(API_ENDPOINTS.BATCH_BY_ID(id), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível excluir o lote.");
  }

  return result;
}

export async function toggleBatchStatus(id: string) {
  const response = await fetch(API_ENDPOINTS.BATCH_BY_ID(id), {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível alterar o status do lote.",
    );
  }

  return result;
}

export async function getAreasForBatch(
  search?: string,
  propertyId?: string,
): Promise<{ data: { id: string; name: string }[] }> {
  const query = new URLSearchParams();
  query.set("status", "active");
  query.set("availableOnly", "true");
  if (search) query.set("search", search);
  if (propertyId) query.set("propertyId", propertyId);

  const response = await fetch(`${API_ENDPOINTS.AREAS}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error("Não foi possível buscar as áreas.");
  }

  return result;
}
