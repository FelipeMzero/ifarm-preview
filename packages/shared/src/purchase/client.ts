import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { PurchaseCostSplit, PurchasePricingType, Sex } from "../enums";
import type { ManagementSessionStatus } from "../management-session/steps";

export type PurchaseStatus = "open" | "confirmed" | "cancelled";

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

export type PurchaseListResult = {
  data: PurchaseRow[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};

export type PurchaseCategory = {
  id: number;
  label: string;
  sex: Sex;
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

/** Corpo enviado na criação e na edição (validado por purchaseSchema). */
export type PurchasePayload = {
  title: string;
  sellerId: string;
  purchaseDate: string;
  notes?: string;
  categories: Record<string, unknown>[];
  propertyId?: string;
};

export type PurchaseListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  propertyId?: string;
};

const PURCHASES = "/api/purchase";
const PURCHASE_BY_ID = (id: string) => `${PURCHASES}/${id}`;

export function createPurchaseClient(request: ApiRequest) {
  return {
    async getPurchases(params: PurchaseListParams = {}) {
      const response = await request(`${PURCHASES}?${toQueryString(params)}`);
      return readJson<PurchaseListResult>(
        response,
        "Não foi possível buscar as compras.",
      );
    },

    async getPurchase(id: string) {
      const response = await request(PURCHASE_BY_ID(id));
      return readJson<PurchaseDetail>(
        response,
        "Não foi possível buscar a compra.",
      );
    },

    async createPurchase(data: PurchasePayload) {
      const response = await request(PURCHASES, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a compra.",
      );
    },

    async updatePurchase(id: string, data: PurchasePayload) {
      const response = await request(
        PURCHASE_BY_ID(id),
        jsonRequest("PUT", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível atualizar a compra.",
      );
    },

    async payPurchase(
      id: string,
      data: { paidAt: string; paymentReference?: string },
    ) {
      const response = await request(
        `${PURCHASE_BY_ID(id)}/pay`,
        jsonRequest("POST", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível registrar o pagamento.",
      );
    },

    async undoPurchasePayment(id: string) {
      const response = await request(`${PURCHASE_BY_ID(id)}/pay`, {
        method: "DELETE",
      });
      return readJson<{ success: true }>(
        response,
        "Não foi possível desfazer o pagamento.",
      );
    },

    async consolidatePurchase(id: string) {
      const response = await request(`${PURCHASE_BY_ID(id)}/consolidate`, {
        method: "POST",
      });
      return readJson<{ success: true }>(
        response,
        "Não foi possível consolidar a compra.",
      );
    },

    async cancelPurchase(id: string) {
      const response = await request(`${PURCHASE_BY_ID(id)}/cancel`, {
        method: "POST",
      });
      return readJson<{ success: true }>(
        response,
        "Não foi possível cancelar a compra.",
      );
    },
  };
}
