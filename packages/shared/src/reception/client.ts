import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { ManagementSessionStatus } from "../management-session/steps";
import type { CreateReceptionPayload } from "./schema";

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
  performedAt: string | null;
  scheduledAt: string;
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

export type ReceptionPurchaseListResult = {
  data: ReceptionPurchase[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};

export type ReceptionFilter = "pending" | "all";

export type ReceptionDocuments = {
  gtaNumber?: string | null;
  invoiceNumber?: string | null;
};

export type ReceptionPurchaseListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: ReceptionFilter;
  propertyId?: string;
};

const RECEPTION_PURCHASES = "/api/reception/purchases";

export function createReceptionClient(request: ApiRequest) {
  return {
    async getReceptionPurchases(params: ReceptionPurchaseListParams = {}) {
      const response = await request(
        `${RECEPTION_PURCHASES}?${toQueryString(params)}`,
      );
      return readJson<ReceptionPurchaseListResult>(
        response,
        "Não foi possível buscar as compras.",
      );
    },

    async getReceptionPurchase(id: string) {
      const response = await request(`${RECEPTION_PURCHASES}/${id}`);
      return readJson<ReceptionPurchase>(
        response,
        "Não foi possível buscar a compra.",
      );
    },

    async createReception(purchaseId: string, data: CreateReceptionPayload) {
      const response = await request(
        `${RECEPTION_PURCHASES}/${purchaseId}/receptions`,
        jsonRequest("POST", data),
      );
      return readJson<{
        success: true;
        data: { receptionId: string; sessionId: string };
      }>(response, "Não foi possível abrir a recepção.");
    },

    async updateReceptionDocuments(
      sessionId: string,
      data: ReceptionDocuments,
    ) {
      const response = await request(
        `/api/management-session/${sessionId}/reception`,
        jsonRequest("PATCH", data),
      );
      return readJson(
        response,
        "Não foi possível salvar os documentos da carga.",
      );
    },
  };
}
