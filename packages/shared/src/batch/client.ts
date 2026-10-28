import {
  ApiError,
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type {
  BatchCreatePayload,
  BatchReopenPayload,
  BatchUpdatePayload,
  BatchListParams,
} from "./schema";
import type { BatchDetail, BatchFullDetails, BatchListResult } from "./types";

// Recusa de encerramento: lote com animais ou destino de transferências pendentes.
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

const BATCHES = "/api/batch";
const BATCH_BY_ID = (id: string) => `${BATCHES}/${id}`;

export function createBatchClient(request: ApiRequest) {
  return {
    async getBatches(params: BatchListParams = {}) {
      const response = await request(`${BATCHES}?${toQueryString(params)}`);
      return readJson<BatchListResult>(
        response,
        "Não foi possível buscar os lotes.",
      );
    },

    async getBatch(id: string) {
      const response = await request(BATCH_BY_ID(id));
      return readJson<BatchDetail>(
        response,
        "Não foi possível buscar os dados do lote.",
      );
    },

    async getBatchDetails(id: string) {
      const response = await request(`${BATCH_BY_ID(id)}/details`);
      return readJson<BatchFullDetails>(
        response,
        "Não foi possível buscar os detalhes do lote.",
      );
    },

    async createBatch(data: BatchCreatePayload) {
      const response = await request(BATCHES, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar o lote.",
      );
    },

    async updateBatch(id: string, data: BatchUpdatePayload) {
      const response = await request(BATCH_BY_ID(id), jsonRequest("PUT", data));
      return readJson<{ success: true }>(
        response,
        "Não foi possível atualizar o lote.",
      );
    },

    async deleteBatch(id: string) {
      const response = await request(BATCH_BY_ID(id), { method: "DELETE" });
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir o lote.",
      );
    },

    async closeBatch(id: string) {
      const response = await request(`${BATCH_BY_ID(id)}/close`, {
        method: "POST",
      });
      try {
        return await readJson<{ success: true }>(
          response,
          "Não foi possível encerrar o lote.",
        );
      } catch (error) {
        if (error instanceof ApiError) {
          throw new BatchCloseError(
            error.message,
            error.body?.code as BatchCloseError["code"],
            error.body?.animalCount as number | undefined,
          );
        }
        throw error;
      }
    },

    async reopenBatch(id: string, data: BatchReopenPayload) {
      const response = await request(
        `${BATCH_BY_ID(id)}/reopen`,
        jsonRequest("POST", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível reativar o lote.",
      );
    },

    // Áreas ativas e livres, para escolher onde o lote fica.
    async getAreasForBatch(search?: string, propertyId?: string) {
      const query = toQueryString({
        status: "active",
        availableOnly: "true",
        search,
        propertyId,
      });
      const response = await request(`/api/area?${query}`);
      return readJson<{ data: { id: string; name: string }[] }>(
        response,
        "Não foi possível buscar as áreas.",
      );
    },
  };
}
