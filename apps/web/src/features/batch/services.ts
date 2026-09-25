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
  BATCH_DETAILS: (id: string) => `/api/batch/${id}/details`,
  BATCH_CLOSE: (id: string) => `/api/batch/${id}/close`,
  BATCH_REOPEN: (id: string) => `/api/batch/${id}/reopen`,
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
  if (params.pageSize !== undefined)
    query.set("pageSize", String(params.pageSize));
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

export async function createBatch(
  data: BatchFormData & { propertyId?: string },
) {
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

export class BatchCloseError extends Error {
  code?: "HAS_ANIMALS" | "HAS_PENDING_TRANSFERS";
  animalCount?: number;

  constructor(
    message: string,
    code?: BatchCloseError["code"],
    animalCount?: number,
  ) {
    super(message);
    this.name = "BatchCloseError";
    this.code = code;
    this.animalCount = animalCount;
  }
}

export async function closeBatch(id: string) {
  const response = await fetch(API_ENDPOINTS.BATCH_CLOSE(id), {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new BatchCloseError(
      result.message ?? "Não foi possível encerrar o lote.",
      result.code,
      result.animalCount,
    );
  }

  return result;
}

export async function reopenBatch(
  id: string,
  data: { areaId: string; notes?: string },
) {
  const response = await fetch(API_ENDPOINTS.BATCH_REOPEN(id), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível reativar o lote.",
      result.errors,
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

export type BatchDetailAnimal = {
  id: string;
  code: number;
  earTag: string | null;
  rfid: string | null;
  name: string | null;
  sex: string;
  neutered: boolean;
  birthDate: string | null;
  breedName: string | null;
  currentWeightKg: number | null;
  lastWeighingDate: string | null;
  adgKgPerDay: number | null;
  enteredAt: string | null;
};

export type BatchFullDetails = {
  id: string;
  name: string;
  notes: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  property: { id: string; name: string };
  saleGoal: { targetDate: string | null; targetWeightKg: number | null } | null;
  currentArea: {
    id: string;
    name: string;
    hectares: number;
    stockingRate: number;
    enteredAt: string;
  } | null;
  areaHistory: {
    id: number;
    area: { id: string; name: string };
    enteredAt: string;
    exitedAt: string | null;
    notes: string | null;
  }[];
  stocking: {
    capacityUa: number;
    currentUa: number;
    estimatedCount: number;
  } | null;
  animals: BatchDetailAnimal[];
  weightSeries: { date: string; avgWeightKg: number; animalCount: number }[];
  movements: {
    id: number;
    animal: {
      id: string;
      code: number;
      earTag: string | null;
      rfid: string | null;
    };
    enteredAt: string;
    exitedAt: string | null;
    notes: string | null;
  }[];
  pendingTransfers: {
    incoming: {
      id: string;
      transferDate: string;
      animalCount: number;
      notes: string | null;
    }[];
    outgoing: {
      id: string;
      transferDate: string;
      destinationBatch: { id: string; name: string };
      animalCount: number;
      notes: string | null;
    }[];
  };
  confirmedTransfers: {
    id: string;
    direction: "in" | "out";
    date: string;
    animalCount: number;
    otherBatchName: string | null;
  }[];
  purchases: {
    id: string;
    date: string;
    seller: { id: string; name: string };
    animalCount: number;
    confirmed: boolean;
  }[];
};

export async function getBatchDetails(id: string): Promise<BatchFullDetails> {
  const response = await fetch(API_ENDPOINTS.BATCH_DETAILS(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível buscar os detalhes do lote.",
    );
  }

  return result;
}
