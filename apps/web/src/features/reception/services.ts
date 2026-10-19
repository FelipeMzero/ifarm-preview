import type { ManagementSessionStatus } from "@ifarm/shared";
import { ApiError } from "@/features/management-session/services";

// Área de recepções: a compra vista por quem recebe os animais (sem valores).

type Ref = { id: string; name: string };

export type ReceptionPurchaseCategory = {
  id: number;
  label: string;
  expectedQuantity: number;
  receivedQuantity: number;
};

export type ReceptionSummary = {
  id: string;
  sessionId: string;
  title: string;
  status: ManagementSessionStatus;
  managementDate: string | null;
  scheduledDate: string;
  entryBatch: Ref;
  gtaNumber: string | null;
  invoiceNumber: string | null;
  animalCount: number;
};

export type ReceptionPurchase = {
  id: string;
  title: string;
  purchaseDate: string;
  notes: string | null;
  seller: Ref;
  /** Recepções só em compras em andamento. */
  status: "open" | "confirmed" | "cancelled";
  categories: ReceptionPurchaseCategory[];
  receptions: ReceptionSummary[];
  expectedQuantity: number;
  receivedQuantity: number;
  hasOpenReception: boolean;
};

export type ReceptionFilter = "pending" | "all";

const BASE = "/api/reception/purchases";

async function request<T>(
  url: string,
  fallbackMessage: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(url, {
    ...rest,
    ...(json !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        }
      : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new ApiError(result.message ?? fallbackMessage, result.errors);
  }
  return result as T;
}

export function getReceptionPurchases(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    filter?: ReceptionFilter;
    propertyId?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined)
    query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.filter) query.set("filter", params.filter);
  if (params.propertyId) query.set("propertyId", params.propertyId);

  return request<{
    data: ReceptionPurchase[];
    total: number;
    pageCount: number;
  }>(`${BASE}?${query}`, "Não foi possível buscar as compras.");
}

export function getReceptionPurchase(id: string) {
  return request<ReceptionPurchase>(
    `${BASE}/${id}`,
    "Não foi possível buscar a compra.",
  );
}

export type ReceptionDocuments = {
  gtaNumber?: string | null;
  invoiceNumber?: string | null;
};

export function createReception(
  purchaseId: string,
  data: ReceptionDocuments & {
    entryBatchId: string;
    steps: Record<string, unknown>[];
  },
) {
  return request<{
    success: true;
    data: { receptionId: string; sessionId: string };
  }>(`${BASE}/${purchaseId}/receptions`, "Não foi possível abrir a recepção.", {
    method: "POST",
    json: data,
  });
}

export function updateReceptionDocuments(
  sessionId: string,
  data: ReceptionDocuments,
) {
  return request(
    `/api/management-session/${sessionId}/reception`,
    "Não foi possível salvar os documentos da carga.",
    { method: "PATCH", json: data },
  );
}
