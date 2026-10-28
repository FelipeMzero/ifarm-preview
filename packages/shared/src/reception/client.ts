import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type {
  CreateReceptionPayload,
  ReceptionPurchaseListParams,
} from "./schema";
import type {
  ReceptionPurchase,
  ReceptionPurchaseListResult,
  ReceptionDocuments,
} from "./types";

// Área de recepções: a compra vista por quem recebe os animais (sem valores).

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
