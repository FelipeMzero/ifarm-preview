import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type {
  PurchasePayload,
  PurchasePaymentPayload,
  PurchaseListParams,
} from "./schema";
import type { PurchaseListResult, PurchaseDetail } from "./types";

/** Corpo enviado na criação e na edição (validado por purchaseSchema). */
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

    async payPurchase(id: string, data: PurchasePaymentPayload) {
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
