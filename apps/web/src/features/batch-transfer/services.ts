import { BatchTransferFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type BatchTransferStatus = "pending" | "confirmed" | "cancelled";

type BatchRef = { id: string; name: string };

export type BatchTransferRow = {
  id: string;
  transferDate: string;
  notes: string | null;
  originBatches: string[];
  destinationBatch: BatchRef;
  animalCount: number;
  status: BatchTransferStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
};

export type TransferAnimal = {
  id: string;
  code: number;
  earTag: string | null;
  rfid: string | null;
  name: string | null;
  sex: string;
  status: string;
  currentWeightKg: number | null;
  currentBatch: BatchRef | null;
  // Lote de onde o animal saiu; só é preenchido quando a transferência é confirmada.
  originBatch?: BatchRef | null;
  // Situação que impede o animal de continuar na transferência pendente (ex.: "Morto").
  unavailableReason?: string | null;
};

export type BatchTransferDetail = {
  id: string;
  transferDate: string;
  notes: string;
  destinationBatch: BatchRef;
  propertyId: string;
  status: BatchTransferStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  animals: TransferAnimal[];
};

export type BatchTransferPayload = BatchTransferFormData & {
  animalIds: string[];
  propertyId?: string;
};

const API_ENDPOINTS = {
  TRANSFERS: "/api/batch-transfer",
  TRANSFER_BY_ID: (id: string) => `/api/batch-transfer/${id}`,
  CONFIRM: (id: string) => `/api/batch-transfer/${id}/confirm`,
  CANCEL: (id: string) => `/api/batch-transfer/${id}/cancel`,
} as const;

export async function getBatchTransfers(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    propertyId?: string;
  } = {},
): Promise<{
  data: BatchTransferRow[];
  total: number;
  pageCount: number;
}> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined)
    query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.propertyId) query.set("propertyId", params.propertyId);

  const response = await fetch(`${API_ENDPOINTS.TRANSFERS}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível buscar as transferências.",
    );
  }

  return result;
}

export async function getBatchTransfer(
  id: string,
): Promise<BatchTransferDetail> {
  const response = await fetch(API_ENDPOINTS.TRANSFER_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível buscar os dados da transferência.",
    );
  }

  return result;
}

export async function createBatchTransfer(data: BatchTransferPayload) {
  const response = await fetch(API_ENDPOINTS.TRANSFERS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível salvar a transferência.",
      result.errors,
    );
  }

  return result as { success: true; data: { id: string } };
}

export async function updateBatchTransfer(
  id: string,
  data: BatchTransferPayload,
) {
  const response = await fetch(API_ENDPOINTS.TRANSFER_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível atualizar a transferência.",
      result.errors,
    );
  }

  return result;
}

export async function confirmBatchTransfer(id: string) {
  const response = await fetch(API_ENDPOINTS.CONFIRM(id), { method: "POST" });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível confirmar a transferência.",
    );
  }

  return result;
}

export async function cancelBatchTransfer(id: string) {
  const response = await fetch(API_ENDPOINTS.CANCEL(id), { method: "POST" });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível cancelar a transferência.",
    );
  }

  return result;
}
