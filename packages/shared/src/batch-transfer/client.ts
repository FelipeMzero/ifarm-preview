import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { BatchTransferPayload, BatchTransferListParams } from "./schema";

export type BatchTransferStatus = "pending" | "confirmed" | "cancelled";

type BatchRef = { id: string; name: string };

export type BatchTransferRow = {
  id: string;
  transferredAt: string;
  notes: string | null;
  originBatches: string[];
  destinationBatch: BatchRef;
  animalCount: number;
  status: BatchTransferStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
};

export type BatchTransferListResult = {
  data: BatchTransferRow[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
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
  transferredAt: string;
  notes: string;
  destinationBatch: BatchRef;
  propertyId: string;
  status: BatchTransferStatus;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  animals: TransferAnimal[];
};

const TRANSFERS = "/api/batch-transfer";
const TRANSFER_BY_ID = (id: string) => `${TRANSFERS}/${id}`;

export function createBatchTransferClient(request: ApiRequest) {
  return {
    async getBatchTransfers(params: BatchTransferListParams = {}) {
      const response = await request(`${TRANSFERS}?${toQueryString(params)}`);
      return readJson<BatchTransferListResult>(
        response,
        "Não foi possível buscar as transferências.",
      );
    },

    async getBatchTransfer(id: string) {
      const response = await request(TRANSFER_BY_ID(id));
      return readJson<BatchTransferDetail>(
        response,
        "Não foi possível buscar os dados da transferência.",
      );
    },

    async createBatchTransfer(data: BatchTransferPayload) {
      const response = await request(TRANSFERS, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a transferência.",
      );
    },

    async updateBatchTransfer(id: string, data: BatchTransferPayload) {
      const response = await request(
        TRANSFER_BY_ID(id),
        jsonRequest("PUT", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível atualizar a transferência.",
      );
    },

    async confirmBatchTransfer(id: string) {
      const response = await request(`${TRANSFER_BY_ID(id)}/confirm`, {
        method: "POST",
      });
      return readJson<{ success: true }>(
        response,
        "Não foi possível confirmar a transferência.",
      );
    },

    async cancelBatchTransfer(id: string) {
      const response = await request(`${TRANSFER_BY_ID(id)}/cancel`, {
        method: "POST",
      });
      return readJson<{ success: true }>(
        response,
        "Não foi possível cancelar a transferência.",
      );
    },
  };
}
