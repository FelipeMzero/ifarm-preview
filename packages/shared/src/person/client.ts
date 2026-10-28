import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { PersonPayload, PersonListParams } from "./schema";
import type { PersonListResult } from "./types";

const PEOPLE = "/api/person";
const PERSON_BY_ID = (id: string) => `${PEOPLE}/${id}`;

export function createPersonClient(request: ApiRequest) {
  return {
    async getPeople({
      page = 0,
      pageSize = 10,
      search = "",
      type,
      status,
    }: PersonListParams = {}) {
      const query = toQueryString({ page, pageSize, search, type, status });
      const response = await request(`${PEOPLE}?${query}`);
      return readJson<PersonListResult>(
        response,
        "Não foi possível carregar as pessoas.",
      );
    },

    async getPerson(id: string) {
      const response = await request(PERSON_BY_ID(id));
      return readJson<PersonPayload>(
        response,
        "Não foi possível carregar a pessoa.",
      );
    },

    async createPerson(data: PersonPayload) {
      const response = await request(PEOPLE, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar a pessoa.",
      );
    },

    async updatePerson(id: string, data: PersonPayload) {
      const response = await request(
        PERSON_BY_ID(id),
        jsonRequest("PUT", data),
      );
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível atualizar a pessoa.",
      );
    },

    async deletePerson(id: string) {
      const response = await request(PERSON_BY_ID(id), { method: "DELETE" });
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir a pessoa.",
      );
    },

    async togglePersonStatus(id: string) {
      const response = await request(PERSON_BY_ID(id), { method: "PATCH" });
      return readJson<{
        success: true;
        data: { id: string; deactivatedAt: string | null };
      }>(response, "Não foi possível alterar o status da pessoa.");
    },
  };
}
