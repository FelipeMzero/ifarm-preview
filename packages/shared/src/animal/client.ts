import type { PropertyZoneRef } from "../property/time-zones";
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

export type AnimalRow = {
  id: string;
  code: number;
  rfid: string | null;
  earTag: string | null;
  currentTag: string | null;
  name: string | null;
  sex: string;
  birthDate: string | null;
  birthWeightKg: number | null;
  origin: string;
  status: string;
  currentWeightKg: number | null;
  currentBatch: { id: string; name: string } | null;
  updatedAt: string;
};

export type AnimalDetail = {
  id: string;
  currentTag: string | null;
  currentRfid: string | null;
  name: string | null;
  sex: string;
  birthDate: string | null;
  breedId: string | null;
  breedName: string | null;
  origin: string;
  status: string;
  neutered: boolean;
  neuteredAt: string | null;
  currentBatchId: string | null;
  currentBatchName: string | null;
  currentProperty: PropertyZoneRef;
  currentWeightKg: number | null;
  updatedAt: string;
};

export type AnimalListResult = {
  data: AnimalRow[];
  total: number;
  pageCount: number;
};

export type AnimalWeighing = {
  id: number;
  date: string;
  weightKg: number;
  notes: string | null;
  fromSession: boolean;
  correctedAt: string | null;
  originalWeightKg: number | null;
};

export type AnimalIdentifierHistory = {
  id: number;
  date: string;
  value: string | null;
  notes: string | null;
};

export type AnimalNeutering = {
  id: number;
  date: string;
  techniqueName: string | null;
  notes: string | null;
  correctedAt: string | null;
};

export type AnimalNeuteringRecord = AnimalNeutering & {
  fromSession: boolean;
  techniqueId: string | null;
  originalDate: string | null;
  originalTechniqueId: string | null;
  originalTechniqueName: string | null;
};

export type AnimalHealthRecord = {
  id: number;
  date: string;
  typeName: string;
  title: string | null;
  veterinarianName: string | null;
  withdrawalEndDate: string | null;
  nextDueDate: string | null;
  doseMl: number | null;
  notes: string | null;
};

export type AnimalBatchHistoryEntry = {
  id: number;
  batchId: string | null;
  batchName: string | null;
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};

export type AnimalPropertyHistoryEntry = {
  id: number;
  propertyId: string;
  propertyName: string;
  enteredAt: string;
  exitedAt: string | null;
  notes: string | null;
};

export type AnimalPurchase = {
  date: string;
  sellerId: string;
  sellerName: string;
  pricingType: string;
  pricePerArroba: number | null;
  totalPrice: number | null;
  cost: number | null;
  weightKg: number | null;
  gtaNumber: string | null;
  notes: string | null;
};

export type AnimalFullDetails = {
  id: string;
  code: number;
  currentTag: string | null;
  currentRfid: string | null;
  name: string | null;
  sex: string;
  birthDate: string | null;
  /** Idade informada (ex.: compra), sem registro de nascimento. */
  birthDateEstimated: boolean;
  breedName: string | null;
  origin: string;
  status: string;
  neutered: boolean;
  currentBatch: { id: string; name: string } | null;
  currentProperty: { id: string; name: string };
  currentWeightKg: number | null;
  createdAt: string;
  updatedAt: string;
  weighings: AnimalWeighing[];
  tagHistory: AnimalIdentifierHistory[];
  rfidHistory: AnimalIdentifierHistory[];
  neutering: AnimalNeutering[];
  health: AnimalHealthRecord[];
  batchHistory: AnimalBatchHistoryEntry[];
  propertyHistory: AnimalPropertyHistoryEntry[];
  purchase: AnimalPurchase | null;
};

export type IdentifierKind = "tag" | "rfid";

// Registro do histórico de brinco/RFID (value null = identificador removido).
export type AnimalIdentifierRecord = {
  id: number;
  date: string;
  value: string | null;
  notes: string | null;
  fromSession: boolean;
  correctedAt: string | null;
  originalValue: string | null;
};

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
