import { jsonRequest, readJson, type ApiRequest } from "../client";

export type HealthManagementType = {
  id: string;
  name: string;
  deactivatedAt: string | null;
};

const HEALTH_MANAGEMENT_TYPES = "/api/health-management-type";
const HEALTH_MANAGEMENT_TYPE_BY_ID = (id: string) =>
  `${HEALTH_MANAGEMENT_TYPES}/${id}`;

export function createHealthManagementTypeClient(request: ApiRequest) {
  return {
    async getHealthManagementTypes() {
      const response = await request(HEALTH_MANAGEMENT_TYPES);
      const result = await readJson<{ data: HealthManagementType[] }>(
        response,
        "Não foi possível carregar os tipos de manejo sanitário.",
      );
      return result.data;
    },

    async createHealthManagementType(name: string) {
      const response = await request(
        HEALTH_MANAGEMENT_TYPES,
        jsonRequest("POST", { name }),
      );
      const result = await readJson<{ data: HealthManagementType }>(
        response,
        "Não foi possível criar o tipo de manejo sanitário.",
        "name",
      );
      return result.data;
    },

    async updateHealthManagementType(id: string, name: string) {
      const response = await request(
        HEALTH_MANAGEMENT_TYPE_BY_ID(id),
        jsonRequest("PUT", { name }),
      );
      const result = await readJson<{ data: HealthManagementType }>(
        response,
        "Não foi possível salvar o tipo de manejo sanitário.",
        "name",
      );
      return result.data;
    },

    async deleteHealthManagementType(id: string) {
      const response = await request(HEALTH_MANAGEMENT_TYPE_BY_ID(id), {
        method: "DELETE",
      });
      await readJson(
        response,
        "Não foi possível excluir o tipo de manejo sanitário.",
      );
    },

    async toggleHealthManagementTypeStatus(id: string) {
      const response = await request(HEALTH_MANAGEMENT_TYPE_BY_ID(id), {
        method: "PATCH",
      });
      const result = await readJson<{ data: HealthManagementType }>(
        response,
        "Não foi possível alterar o status do tipo de manejo sanitário.",
      );
      return result.data;
    },
  };
}
