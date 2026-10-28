import { jsonRequest, readJson, type ApiRequest } from "../client";
import type { Breed } from "./types";

const BREEDS = "/api/breed";
const BREED_BY_ID = (id: string) => `${BREEDS}/${id}`;

export function createBreedClient(request: ApiRequest) {
  return {
    async getBreeds() {
      const response = await request(BREEDS);
      const result = await readJson<{ data: Breed[] }>(
        response,
        "Não foi possível carregar as raças.",
      );
      return result.data;
    },

    async createBreed(name: string) {
      const response = await request(BREEDS, jsonRequest("POST", { name }));
      const result = await readJson<{ data: Breed }>(
        response,
        "Não foi possível criar a raça.",
        "name",
      );
      return result.data;
    },

    async updateBreed(id: string, name: string) {
      const response = await request(
        BREED_BY_ID(id),
        jsonRequest("PUT", { name }),
      );
      const result = await readJson<{ data: Breed }>(
        response,
        "Não foi possível salvar a raça.",
        "name",
      );
      return result.data;
    },

    async deleteBreed(id: string) {
      const response = await request(BREED_BY_ID(id), { method: "DELETE" });
      await readJson(response, "Não foi possível excluir a raça.");
    },

    async toggleBreedStatus(id: string) {
      const response = await request(BREED_BY_ID(id), { method: "PATCH" });
      const result = await readJson<{ data: Breed }>(
        response,
        "Não foi possível alterar o status da raça.",
      );
      return result.data;
    },
  };
}
