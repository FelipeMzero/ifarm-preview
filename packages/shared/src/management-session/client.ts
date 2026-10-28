import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type {
  ManagementSessionPayload,
  ReceiveAnimalPayload,
  ManagementSessionListParams,
} from "./schema";
import type {
  ManagementSessionDetail,
  SessionAnimalContext,
  ManagementOptions,
  ManagementSessionListResult,
} from "./types";

const SESSIONS = "/api/management-session";
const SESSION_BY_ID = (id: string) => `${SESSIONS}/${id}`;
const STEP = (id: string, animalId: string, key: string) =>
  `${SESSION_BY_ID(id)}/animals/${animalId}/steps/${encodeURIComponent(key)}`;

export function createManagementSessionClient(request: ApiRequest) {
  return {
    async getManagementSessions(params: ManagementSessionListParams = {}) {
      const response = await request(`${SESSIONS}?${toQueryString(params)}`);
      return readJson<ManagementSessionListResult>(
        response,
        "Não foi possível buscar as sessões de manejo.",
      );
    },

    async getManagementSession(id: string) {
      const response = await request(SESSION_BY_ID(id));
      return readJson<ManagementSessionDetail>(
        response,
        "Não foi possível buscar a sessão de manejo.",
      );
    },

    async getManagementOptions(propertyId?: string) {
      const response = await request(
        `${SESSIONS}/options?${toQueryString({ propertyId })}`,
      );
      return readJson<ManagementOptions>(
        response,
        "Não foi possível buscar as opções de manejo.",
      );
    },

    async createManagementSession(data: ManagementSessionPayload) {
      const response = await request(SESSIONS, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a sessão de manejo.",
      );
    },

    async updateManagementSession(id: string, data: ManagementSessionPayload) {
      const response = await request(
        SESSION_BY_ID(id),
        jsonRequest("PUT", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível atualizar a sessão de manejo.",
      );
    },

    async startManagementSession(id: string, performedAt: string) {
      const response = await request(
        `${SESSION_BY_ID(id)}/start`,
        jsonRequest("POST", { performedAt }),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível definir a data do manejo.",
      );
    },

    async confirmManagementSession(id: string) {
      const response = await request(`${SESSION_BY_ID(id)}/confirm`, {
        method: "POST",
      });
      return readJson<{
        success: true;
        data: { handled: number; removed: number };
      }>(response, "Não foi possível consolidar o manejo.");
    },

    async cancelManagementSession(id: string) {
      const response = await request(`${SESSION_BY_ID(id)}/cancel`, {
        method: "POST",
      });
      return readJson<{ success: true }>(
        response,
        "Não foi possível cancelar a sessão de manejo.",
      );
    },

    async addParticipants(id: string, animalIds: string[]) {
      const response = await request(
        `${SESSION_BY_ID(id)}/participants`,
        jsonRequest("POST", { animalIds }),
      );
      return readJson<{ success: true; data: { added: number } }>(
        response,
        "Não foi possível incluir os animais.",
      );
    },

    async removeParticipant(id: string, animalId: string) {
      const response = await request(
        `${SESSION_BY_ID(id)}/participants/${animalId}`,
        { method: "DELETE" },
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível remover o animal da sessão.",
      );
    },

    async getSessionAnimal(id: string, animalId: string) {
      const response = await request(
        `${SESSION_BY_ID(id)}/animals/${animalId}`,
      );
      return readJson<SessionAnimalContext>(
        response,
        "Não foi possível buscar o animal da sessão.",
      );
    },

    // Registrar e desfazer devolvem o contexto atualizado do animal.
    async saveStepRecord(
      id: string,
      animalId: string,
      key: string,
      payload: unknown,
    ) {
      const response = await request(
        STEP(id, animalId, key),
        jsonRequest("PUT", payload),
      );
      const result = await readJson<{ data: SessionAnimalContext }>(
        response,
        "Não foi possível salvar o registro.",
      );
      return result.data;
    },

    async clearStepRecord(id: string, animalId: string, key: string) {
      const response = await request(STEP(id, animalId, key), {
        method: "DELETE",
      });
      const result = await readJson<{ data: SessionAnimalContext }>(
        response,
        "Não foi possível desfazer o registro.",
      );
      return result.data;
    },

    // Recepção de compra: cria o animal que desceu do caminhão.
    async receiveAnimal(id: string, data: ReceiveAnimalPayload) {
      const response = await request(
        `${SESSION_BY_ID(id)}/reception/animals`,
        jsonRequest("POST", data),
      );
      return readJson<{ success: true; data: { animalId: string } }>(
        response,
        "Não foi possível receber o animal.",
      );
    },
  };
}
