import { jsonRequest, readJson, type ApiRequest } from "../client";
import type { StockingPreviewRequest } from "./schema";

export type UaTotal = { ua: number; count: number; estimatedCount: number };

export type StockingPreview = {
  area: { id: string; name: string };
  capacityUa: number;
  current: UaTotal;
  incoming: UaTotal;
  projectedUa: number;
  exceeds: boolean;
};

export type AreaOccupancy = {
  batch: { id: string; name: string };
  /** Entrada do lote atual na área (início do período de ocupação). */
  occupiedSince: string;
  animalCount: number;
  currentUa: number;
  estimatedCount: number;
  capacityUa: number;
  exceeds: boolean;
};

export function createStockingClient(request: ApiRequest) {
  return {
    async getStockingPreview(input: StockingPreviewRequest) {
      const response = await request(
        "/api/stocking-preview",
        jsonRequest("POST", input),
      );
      const result = await readJson<{ data: StockingPreview | null }>(
        response,
        "Não foi possível calcular a lotação.",
      );
      return result.data;
    },
  };
}
