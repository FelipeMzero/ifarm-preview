import { jsonRequest, readJson, type ApiRequest } from "../client";
import type { StockingPreviewRequest } from "./schema";
import type { StockingPreview } from "./types";

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
