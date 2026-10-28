import {
  ApiError,
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type { Commitment, CommitmentExclusion } from "./commitments";
import type {
  AnimalCreatePayload,
  AnimalUpdatePayload,
  IdentifierChangePayload,
  IdentifierCorrectionPayload,
  NeuteringCorrectionPayload,
  NeuteringCreatePayload,
  WeighingCorrectionPayload,
  WeighingCreatePayload,
  AnimalListParams,
  CommitmentsLookupPayload,
} from "./schema";
import type {
  AnimalDetail,
  AnimalListResult,
  AnimalWeighing,
  AnimalNeuteringRecord,
  AnimalFullDetails,
  IdentifierKind,
  AnimalIdentifierRecord,
} from "./types";

const ANIMALS = "/api/animal";
const ANIMAL_BY_ID = (id: string) => `${ANIMALS}/${id}`;
const IDENTIFIERS = (animalId: string, kind: IdentifierKind) =>
  `${ANIMAL_BY_ID(animalId)}/identifiers/${kind}`;

export function createAnimalClient(request: ApiRequest) {
  return {
    async getAnimals({
      page = 0,
      pageSize = 10,
      ...filters
    }: AnimalListParams = {}) {
      const query = toQueryString({ page, pageSize, ...filters });
      const response = await request(`${ANIMALS}?${query}`);
      return readJson<AnimalListResult>(
        response,
        "Não foi possível carregar os animais.",
      );
    },

    async getAnimal(id: string) {
      const response = await request(ANIMAL_BY_ID(id));
      return readJson<AnimalDetail>(
        response,
        "Não foi possível carregar o animal.",
      );
    },

    async getAnimalDetails(id: string) {
      const response = await request(`${ANIMAL_BY_ID(id)}/details`);
      return readJson<AnimalFullDetails>(
        response,
        "Não foi possível carregar o animal.",
      );
    },

    async createAnimal(data: AnimalCreatePayload) {
      const response = await request(ANIMALS, jsonRequest("POST", data));
      return readJson<{ success: true; data: { id: string } }>(
        response,
        "Não foi possível salvar o animal.",
      );
    },

    async updateAnimal(id: string, data: AnimalUpdatePayload) {
      const response = await request(
        ANIMAL_BY_ID(id),
        jsonRequest("PUT", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível atualizar o animal.",
      );
    },

    async deleteAnimal(id: string) {
      const response = await request(ANIMAL_BY_ID(id), { method: "DELETE" });
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir o animal.",
      );
    },

    async getWeighings(animalId: string) {
      const response = await request(`${ANIMAL_BY_ID(animalId)}/weighings`);
      return readJson<AnimalWeighing[]>(
        response,
        "Não foi possível carregar as pesagens.",
      );
    },

    // Registra uma pesagem na hora (date vazio = hoje).
    async createWeighing(animalId: string, data: WeighingCreatePayload) {
      const response = await request(
        `${ANIMAL_BY_ID(animalId)}/weighings`,
        jsonRequest("POST", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível registrar a pesagem.",
      );
    },

    async correctWeighing(
      animalId: string,
      weighingId: number,
      data: WeighingCorrectionPayload,
    ) {
      const response = await request(
        `${ANIMAL_BY_ID(animalId)}/weighings/${weighingId}`,
        jsonRequest("PATCH", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível corrigir a pesagem.",
      );
    },

    async cancelWeighing(animalId: string, weighingId: number) {
      const response = await request(
        `${ANIMAL_BY_ID(animalId)}/weighings/${weighingId}`,
        { method: "DELETE" },
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir a pesagem.",
      );
    },

    async getNeuterings(animalId: string) {
      const response = await request(`${ANIMAL_BY_ID(animalId)}/neuterings`);
      return readJson<AnimalNeuteringRecord[]>(
        response,
        "Não foi possível carregar as castrações.",
      );
    },

    // Registra uma castração (ou recastração, com motivo) na hora.
    async createNeutering(animalId: string, data: NeuteringCreatePayload) {
      const response = await request(
        `${ANIMAL_BY_ID(animalId)}/neuterings`,
        jsonRequest("POST", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível registrar a castração.",
      );
    },

    async correctNeutering(
      animalId: string,
      neuteringId: number,
      data: NeuteringCorrectionPayload,
    ) {
      const response = await request(
        `${ANIMAL_BY_ID(animalId)}/neuterings/${neuteringId}`,
        jsonRequest("PATCH", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível corrigir a castração.",
      );
    },

    async cancelNeutering(
      animalId: string,
      neuteringId: number,
      keepNeutered?: boolean,
    ) {
      const response = await request(
        `${ANIMAL_BY_ID(animalId)}/neuterings/${neuteringId}`,
        jsonRequest("DELETE", { keepNeutered }),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir a castração.",
      );
    },

    async getIdentifiers(animalId: string, kind: IdentifierKind) {
      const response = await request(IDENTIFIERS(animalId, kind));
      return readJson<AnimalIdentifierRecord[]>(
        response,
        "Não foi possível carregar a identificação.",
      );
    },

    // Troca o identificador na hora (value vazio = remover).
    async changeIdentifier(
      animalId: string,
      kind: IdentifierKind,
      data: IdentifierChangePayload,
    ) {
      const response = await request(
        IDENTIFIERS(animalId, kind),
        jsonRequest("POST", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível trocar a identificação.",
      );
    },

    async correctIdentifier(
      animalId: string,
      kind: IdentifierKind,
      recordId: number,
      data: IdentifierCorrectionPayload,
    ) {
      const response = await request(
        `${IDENTIFIERS(animalId, kind)}/${recordId}`,
        jsonRequest("PATCH", data),
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível corrigir a identificação.",
      );
    },

    async cancelIdentifier(
      animalId: string,
      kind: IdentifierKind,
      recordId: number,
    ) {
      const response = await request(
        `${IDENTIFIERS(animalId, kind)}/${recordId}`,
        { method: "DELETE" },
      );
      return readJson<{ success: true }>(
        response,
        "Não foi possível excluir a identificação.",
      );
    },

    async getAnimalCommitments(id: string) {
      const response = await request(`${ANIMAL_BY_ID(id)}/commitments`);
      if (!response.ok) {
        throw new ApiError(
          "Não foi possível carregar as operações do animal.",
          undefined,
          undefined,
          response.status,
        );
      }
      return (await response.json()) as Commitment[];
    },

    // Compromissos em aberto de vários animais (só os que têm algum).
    async getCommitmentsFor(
      animalIds: string[],
      exclude: CommitmentExclusion = {},
    ) {
      if (!animalIds.length) return {} as Record<string, Commitment[]>;
      const response = await request(
        `${ANIMALS}/commitments`,
        jsonRequest("POST", {
          animalIds,
          ...exclude,
        } satisfies CommitmentsLookupPayload),
      );
      if (!response.ok) {
        throw new ApiError(
          "Não foi possível verificar as operações dos animais.",
          undefined,
          undefined,
          response.status,
        );
      }
      return (await response.json()) as Record<string, Commitment[]>;
    },
  };
}
