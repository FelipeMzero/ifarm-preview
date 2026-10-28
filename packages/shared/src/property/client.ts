import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { PropertyInput, PropertyListParams } from "./schema";
import type { PropertyListResult, PropertyOption } from "./types";

const PROPERTIES = "/api/property";
const PROPERTY_BY_ID = (id: string) => `${PROPERTIES}/${id}`;

export function createPropertyClient(request: ApiRequest) {
  return {
    async getProperties({
      page = 0,
      pageSize = 10,
      search = "",
      status,
    }: PropertyListParams = {}) {
      const query = toQueryString({ page, pageSize, search, status });
      const response = await request(`${PROPERTIES}?${query}`);
      return readJson<PropertyListResult>(
        response,
        "Não foi possível carregar as propriedades.",
      );
    },

    async getProperty(id: string) {
      const response = await request(PROPERTY_BY_ID(id));
      return readJson<PropertyInput>(
        response,
        "Não foi possível carregar a propriedade.",
      );
    },

    async getPropertyOptions() {
      const response = await request(`${PROPERTIES}/options`);
      const result = await readJson<{ data: PropertyOption[] }>(
        response,
        "Não foi possível carregar as propriedades.",
      );
      return result.data;
    },

    async createProperty(data: PropertyInput) {
      const response = await request(PROPERTIES, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a propriedade.",
      );
    },

    async updateProperty(id: string, data: PropertyInput) {
      const response = await request(
        PROPERTY_BY_ID(id),
        jsonRequest("PUT", data),
      );
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível atualizar a propriedade.",
      );
    },

    async deleteProperty(id: string) {
      const response = await request(PROPERTY_BY_ID(id), { method: "DELETE" });
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir a propriedade.",
      );
    },

    async togglePropertyStatus(id: string) {
      const response = await request(PROPERTY_BY_ID(id), { method: "PATCH" });
      return readJson<{
        success: true;
        data: { id: string; deactivatedAt: string | null };
      }>(response, "Não foi possível alterar o status da propriedade.");
    },
  };
}
