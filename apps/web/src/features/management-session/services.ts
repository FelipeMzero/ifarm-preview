import type {
  ManagementSessionStatus,
  ParticipantStatus,
  StepType,
} from "@/lib/management-steps";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

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
};

export type SessionParticipant = {
  animal: SessionAnimal;
  status: ParticipantStatus;
  doneKeys: string[];
  lastHandledAt: string | null;
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
  status: ParticipantStatus;
};

export type ManagementOptions = {
  healthTypes: Ref[];
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

const BASE = "/api/management-session";

const API_ENDPOINTS = {
  SESSIONS: BASE,
  OPTIONS: `${BASE}/options`,
  SESSION_BY_ID: (id: string) => `${BASE}/${id}`,
  START: (id: string) => `${BASE}/${id}/start`,
  CONFIRM: (id: string) => `${BASE}/${id}/confirm`,
  CANCEL: (id: string) => `${BASE}/${id}/cancel`,
  PARTICIPANTS: (id: string) => `${BASE}/${id}/participants`,
  PARTICIPANT: (id: string, animalId: string) =>
    `${BASE}/${id}/participants/${animalId}`,
  ANIMAL: (id: string, animalId: string) => `${BASE}/${id}/animals/${animalId}`,
  STEP: (id: string, animalId: string, key: string) =>
    `${BASE}/${id}/animals/${animalId}/steps/${encodeURIComponent(key)}`,
} as const;

async function request<T>(
  url: string,
  fallbackMessage: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(url, {
    ...rest,
    ...(json !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        }
      : {}),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? fallbackMessage, result.errors);
  }

  return result as T;
}

export function getManagementSessions(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    propertyId?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined)
    query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.propertyId) query.set("propertyId", params.propertyId);

  return request<{
    data: ManagementSessionRow[];
    total: number;
    pageCount: number;
  }>(
    `${API_ENDPOINTS.SESSIONS}?${query}`,
    "Não foi possível buscar as sessões de manejo.",
  );
}

export function getManagementSession(id: string) {
  return request<ManagementSessionDetail>(
    API_ENDPOINTS.SESSION_BY_ID(id),
    "Não foi possível buscar a sessão de manejo.",
  );
}

export function getManagementOptions(propertyId?: string) {
  const query = propertyId ? `?propertyId=${propertyId}` : "";
  return request<ManagementOptions>(
    `${API_ENDPOINTS.OPTIONS}${query}`,
    "Não foi possível buscar as opções de manejo.",
  );
}

export function createManagementSession(data: ManagementSessionPayload) {
  return request<{ success: true; data: { id: string } }>(
    API_ENDPOINTS.SESSIONS,
    "Não foi possível salvar a sessão de manejo.",
    { method: "POST", json: data },
  );
}

export function updateManagementSession(
  id: string,
  data: ManagementSessionPayload,
) {
  return request(
    API_ENDPOINTS.SESSION_BY_ID(id),
    "Não foi possível atualizar a sessão de manejo.",
    { method: "PUT", json: data },
  );
}

export function startManagementSession(id: string, managementDate: string) {
  return request(
    API_ENDPOINTS.START(id),
    "Não foi possível definir a data do manejo.",
    { method: "POST", json: { managementDate } },
  );
}

export function confirmManagementSession(id: string) {
  return request<{
    success: true;
    data: { handled: number; removed: number };
  }>(API_ENDPOINTS.CONFIRM(id), "Não foi possível consolidar o manejo.", {
    method: "POST",
  });
}

export function cancelManagementSession(id: string) {
  return request(
    API_ENDPOINTS.CANCEL(id),
    "Não foi possível cancelar a sessão de manejo.",
    { method: "POST" },
  );
}

export function addParticipants(id: string, animalIds: string[]) {
  return request<{ success: true; data: { added: number } }>(
    API_ENDPOINTS.PARTICIPANTS(id),
    "Não foi possível incluir os animais.",
    { method: "POST", json: { animalIds } },
  );
}

export function removeParticipant(id: string, animalId: string) {
  return request(
    API_ENDPOINTS.PARTICIPANT(id, animalId),
    "Não foi possível remover o animal da sessão.",
    { method: "DELETE" },
  );
}

export function getSessionAnimal(id: string, animalId: string) {
  return request<SessionAnimalContext>(
    API_ENDPOINTS.ANIMAL(id, animalId),
    "Não foi possível buscar o animal da sessão.",
  );
}

export function saveStepRecord(
  id: string,
  animalId: string,
  key: string,
  payload: unknown,
) {
  return request(
    API_ENDPOINTS.STEP(id, animalId, key),
    "Não foi possível salvar o registro.",
    { method: "PUT", json: payload },
  );
}

export function clearStepRecord(id: string, animalId: string, key: string) {
  return request(
    API_ENDPOINTS.STEP(id, animalId, key),
    "Não foi possível desfazer o registro.",
    { method: "DELETE" },
  );
}
