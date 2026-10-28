import { jsonRequest, readJson, type ApiRequest } from "../client";
import type { NeuteringTechnique } from "./types";

const NEUTERING_TECHNIQUES = "/api/neutering-technique";
const NEUTERING_TECHNIQUE_BY_ID = (id: string) =>
  `${NEUTERING_TECHNIQUES}/${id}`;

export function createNeuteringTechniqueClient(request: ApiRequest) {
  return {
    async getNeuteringTechniques() {
      const response = await request(NEUTERING_TECHNIQUES);
      const result = await readJson<{ data: NeuteringTechnique[] }>(
        response,
        "Não foi possível carregar as técnicas de castração.",
      );
      return result.data;
    },

    async createNeuteringTechnique(name: string) {
      const response = await request(
        NEUTERING_TECHNIQUES,
        jsonRequest("POST", { name }),
      );
      const result = await readJson<{ data: NeuteringTechnique }>(
        response,
        "Não foi possível criar a técnica de castração.",
        "name",
      );
      return result.data;
    },

    async updateNeuteringTechnique(id: string, name: string) {
      const response = await request(
        NEUTERING_TECHNIQUE_BY_ID(id),
        jsonRequest("PUT", { name }),
      );
      const result = await readJson<{ data: NeuteringTechnique }>(
        response,
        "Não foi possível salvar a técnica de castração.",
        "name",
      );
      return result.data;
    },

    async deleteNeuteringTechnique(id: string) {
      const response = await request(NEUTERING_TECHNIQUE_BY_ID(id), {
        method: "DELETE",
      });
      await readJson(
        response,
        "Não foi possível excluir a técnica de castração.",
      );
    },

    async toggleNeuteringTechniqueStatus(id: string) {
      const response = await request(NEUTERING_TECHNIQUE_BY_ID(id), {
        method: "PATCH",
      });
      const result = await readJson<{ data: NeuteringTechnique }>(
        response,
        "Não foi possível alterar o status da técnica de castração.",
      );
      return result.data;
    },
  };
}
