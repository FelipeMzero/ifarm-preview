import type { ManagementSessionStatus } from "@/lib/management-steps";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type PurchaseStatus = "open" | "confirmed" | "cancelled";
export type PurchasePricingType = "PER_HEAD" | "PER_ARROBA" | "LUMP_SUM";
export type PurchaseCostSplit = "EQUAL" | "BY_WEIGHT";

type Ref = { id: string; name: string };

export type PurchaseRow = {
  id: string;
  title: string;
  purchaseDate: string;
  seller: Ref;
  categories: string[];
  expectedQuantity: number;
  receivedQuantity: number;
  receptionCount: number;
  /** Estimado em andamento; sobre os recebidos depois de consolidada. */
  value: number | null;
  status: PurchaseStatus;
  paid: boolean;
};

export type PurchaseCategory = {
  id: number;
  label: string;
  sex: "MALE" | "FEMALE";
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  breed: Ref | null;
  expectedQuantity: number;
  pricingType: PurchasePricingType;
  unitPrice: number | null;
  totalPrice: number | null;
  invoicedWeight: number | null;
  shrinkPercent: number | null;
  costSplit: PurchaseCostSplit;
  notes: string | null;
  receivedQuantity: number;
  estimatedValue: number | null;
  /** Soma do peso de chegada dos recebidos (sugestão do peso por arroba). */
  arrivalWeight: { totalKg: number; weighed: number; received: number };
  costTotal: number | null;
};

export type PurchaseReception = {
  id: string;
  sessionId: string;
  title: string;
  status: ManagementSessionStatus;
  scheduledDate: string;
  managementDate: string | null;
  entryBatch: Ref;
  gtaNumber: string | null;
  invoiceNumber: string | null;
  animalCount: number;
};

export type PurchaseDetail = {
  id: string;
  title: string;
  status: PurchaseStatus;
  purchaseDate: string;
  notes: string;
  seller: Ref;
  destinationProperty: Ref;
  paidAt: string | null;
  paymentReference: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  categories: PurchaseCategory[];
  receptions: PurchaseReception[];
};

export type PurchasePayload = {
  title: string;
  sellerId: string;
  purchaseDate: string;
  notes?: string;
  categories: Record<string, unknown>[];
  propertyId?: string;
};

const BASE = "/api/purchase";

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

export function getPurchases(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    propertyId?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined)
    query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.propertyId) query.set("propertyId", params.propertyId);

  return request<{ data: PurchaseRow[]; total: number; pageCount: number }>(
    `${BASE}?${query}`,
    "Não foi possível buscar as compras.",
  );
}

export function getPurchase(id: string) {
  return request<PurchaseDetail>(
    `${BASE}/${id}`,
    "Não foi possível buscar a compra.",
  );
}

export function createPurchase(data: PurchasePayload) {
  return request<{ success: true; data: { id: string } }>(
    BASE,
    "Não foi possível salvar a compra.",
    { method: "POST", json: data },
  );
}

export function updatePurchase(id: string, data: PurchasePayload) {
  return request(`${BASE}/${id}`, "Não foi possível atualizar a compra.", {
    method: "PUT",
    json: data,
  });
}

export function payPurchase(
  id: string,
  data: { paidAt: string; paymentReference?: string },
) {
  return request(
    `${BASE}/${id}/pay`,
    "Não foi possível registrar o pagamento.",
    { method: "POST", json: data },
  );
}

export function undoPurchasePayment(id: string) {
  return request(
    `${BASE}/${id}/pay`,
    "Não foi possível desfazer o pagamento.",
    { method: "DELETE" },
  );
}

export function consolidatePurchase(id: string) {
  return request(
    `${BASE}/${id}/consolidate`,
    "Não foi possível consolidar a compra.",
    { method: "POST" },
  );
}

export function cancelPurchase(id: string) {
  return request(
    `${BASE}/${id}/cancel`,
    "Não foi possível cancelar a compra.",
    { method: "POST" },
  );
}
