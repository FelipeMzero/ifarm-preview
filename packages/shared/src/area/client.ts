import {
  ApiError,
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { AreaOccupancy } from "../stocking/client";
import type { AreaInput } from "./schema";

export type AreaRow = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  polygon: any;
  hectares: number;
  stockingRate: number;
  defaultOccupationDays: number | null;
  defaultRestDays: number | null;
  notes: string | null;
  propertyId: string;
  closedAt: string | null;
  updatedAt: string;
  /** Lote que ocupa a área hoje; null quando livre. */
  occupancy: AreaOccupancy | null;
  /** Saída do último lote (início do descanso); null se nunca foi ocupada. */
  lastExitAt: string | null;
};

export type AreaOccupancyHistoryEntry = {
  id: number;
  batch: { id: string; name: string };
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};

export type AreaListParams = {
  propertyId?: string;
  status?: string;
  search?: string;
  availableOnly?: boolean;
};

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
      return readJson<AreaInput>(
        response,
        "Não foi possível buscar os dados da área.",
      );
    },

    async createArea(data: AreaInput) {
      const response = await request(AREAS, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a área.",
      );
    },

    async updateArea(id: string, data: AreaInput) {
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
