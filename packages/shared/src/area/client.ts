import {
  ApiError,
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { AreaPayload, AreaListParams } from "./schema";
import type { AreaRow, AreaOccupancyHistoryEntry } from "./types";

// Recusa de desativação por haver um lote na área.
export class AreaOccupiedError extends Error {
  constructor(
    message: string,
    public batch: { id: string; name: string },
  ) {
    super(message);
    this.name = "AreaOccupiedError";
  }
}

const AREAS = "/api/area";
const AREA_BY_ID = (id: string) => `${AREAS}/${id}`;

export function createAreaClient(request: ApiRequest) {
  return {
    async getAreas({
      propertyId,
      status,
      search,
      availableOnly,
    }: AreaListParams = {}) {
      const query = toQueryString({
        propertyId,
        status,
        search,
        availableOnly: availableOnly ? "true" : undefined,
      });
      const response = await request(`${AREAS}?${query}`);
      return readJson<{ data: AreaRow[] }>(
        response,
        "Não foi possível buscar as áreas.",
      );
    },

    async getArea(id: string) {
      const response = await request(AREA_BY_ID(id));
      return readJson<AreaPayload>(
        response,
        "Não foi possível buscar os dados da área.",
      );
    },

    async createArea(data: AreaPayload) {
      const response = await request(AREAS, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a área.",
      );
    },

    async updateArea(id: string, data: AreaPayload) {
      const response = await request(AREA_BY_ID(id), jsonRequest("PUT", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível atualizar a área.",
      );
    },

    async deleteArea(id: string) {
      const response = await request(AREA_BY_ID(id), { method: "DELETE" });
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir a área.",
      );
    },

    async toggleAreaStatus(id: string) {
      const response = await request(AREA_BY_ID(id), { method: "PATCH" });
      try {
        return await readJson<{
          success: true;
          data: { id: string; closedAt: string | null };
        }>(response, "Não foi possível alterar o status da área.");
      } catch (error) {
        if (error instanceof ApiError && error.body?.code === "OCCUPIED") {
          throw new AreaOccupiedError(
            error.message,
            error.body.batch as { id: string; name: string },
          );
        }
        throw error;
      }
    },

    async getAreaOccupancyHistory(id: string) {
      const response = await request(`${AREA_BY_ID(id)}/history`);
      const result = await readJson<{ data: AreaOccupancyHistoryEntry[] }>(
        response,
        "Não foi possível buscar o histórico da área.",
      );
      return result.data;
    },
  };
}
