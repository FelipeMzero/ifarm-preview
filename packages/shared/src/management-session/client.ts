import {
  jsonRequest,
  readJson,
  toQueryString,
  type ApiRequest,
} from "../client";
import type {
  ManagementSessionStatus,
  ParticipantStatus,
  StepType,
} from "./steps";

type Ref = { id: string; name: string };

export type ManagementSessionRow = {
  id: string;
  scheduledDate: string;
  managementDate: string | null;
  title: string;
  notes: string | null;
  steps: string[];
  animalCount: number;
  handledCount: number;
  status: ManagementSessionStatus;
  updatedAt: string;
};

// Etapa como a API a descreve: chave estável, rótulo e configuração do planejamento.
export type SessionStepView = {
  key: string;
  type: StepType;
  label: string;
  config?: Record<string, unknown>;
};

export type SessionAnimal = {
  id: string;
  code: number;
  earTag: string | null;
  rfid: string | null;
  name: string | null;
  sex: string;
  status: string;
  neutered: boolean;
  currentWeightKg: number | null;
  currentBatch: Ref | null;
  /** Situação que impede o animal de continuar na sessão aberta (ex.: "Morto"). */
  unavailableReason?: string | null;
};

// Brinco, RFID e peso registrados no animal nesta sessão (ainda não consolidados).
// Vazios fora de uma sessão aberta.
export type SessionValues = {
  earTag: string | null;
  rfid: string | null;
  weightKg: number | null;
};

export type SessionParticipant = {
  animal: SessionAnimal;
  sessionValues: SessionValues;
  status: ParticipantStatus;
  doneKeys: string[];
  lastHandledAt: string | null;
  /** Recepção de compra: categoria da compra em que o animal foi recebido. */
  categoryId: number | null;
};

export type ReceptionCategory = {
  id: number;
  label: string;
  sex: "MALE" | "FEMALE";
  breed: Ref | null;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  expectedQuantity: number;
  /** Recebidos na compra toda (todas as recepções). */
  receivedTotal: number;
  /** Recebidos nesta recepção. */
  receivedHere: number;
};

// Sessão usada como recepção de uma compra (sem valores da negociação).
export type ReceptionInfo = {
  id: string;
  purchaseEventId: string;
  purchaseTitle: string;
  sellerName: string;
  gtaNumber: string | null;
  invoiceNumber: string | null;
  entryBatch: Ref;
  categories: ReceptionCategory[];
};

export type ManagementSessionDetail = {
  id: string;
  status: ManagementSessionStatus;
  scheduledDate: string;
  managementDate: string | null;
  title: string;
  notes: string;
  propertyId: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  updatedAt: string;
  steps: SessionStepView[];
  participants: SessionParticipant[];
  reception: ReceptionInfo | null;
};

export type StepAnimalDetail = SessionAnimal & {
  birthDate: string | null;
  lastNeuteredAt: string | null;
  lastWeighedAt: string | null;
};

export type SessionAnimalContext = {
  session: {
    id: string;
    status: ManagementSessionStatus;
    managementDate: string | null;
  };
  steps: SessionStepView[];
  animal: StepAnimalDetail;
  records: Record<string, unknown>;
  sessionValues: SessionValues;
  status: ParticipantStatus;
};

export type ManagementOptions = {
  healthTypes: Ref[];
  neuteringTechniques: Ref[];
  people: Ref[];
  batches: Ref[];
};

export type ManagementSessionPayload = {
  title: string;
  scheduledDate: string;
  notes?: string;
  steps: Record<string, unknown>[];
  animalIds: string[];
  propertyId?: string;
};

export type ReceiveAnimalPayload = {
  categoryId: number;
  sex?: "MALE" | "FEMALE";
  ageMonths?: number | null;
  name?: string;
};

export type ManagementSessionListResult = {
  data: ManagementSessionRow[];
  total: number;
  page?: number;
  pageSize?: number;
  pageCount: number;
};

export type ManagementSessionListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  propertyId?: string;
};

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

    async startManagementSession(id: string, managementDate: string) {
      const response = await request(
        `${SESSION_BY_ID(id)}/start`,
        jsonRequest("POST", { managementDate }),
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
