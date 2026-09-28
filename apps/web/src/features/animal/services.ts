import type { Commitment, CommitmentExclusion } from "@/lib/animal-commitments";
import { AnimalFormData } from "./schema";

export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

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

const API_ENDPOINTS = {
  ANIMALS: "/api/animal",
  ANIMAL_BY_ID: (id: string) => `/api/animal/${id}`,
  ANIMAL_DETAILS: (id: string) => `/api/animal/${id}/details`,
  ANIMAL_COMMITMENTS: (id: string) => `/api/animal/${id}/commitments`,
  COMMITMENTS: "/api/animal/commitments",
  ANIMAL_WEIGHINGS: (id: string) => `/api/animal/${id}/weighings`,
  ANIMAL_NEUTERINGS: (id: string) => `/api/animal/${id}/neuterings`,
  ANIMAL_NEUTERING: (id: string, neuteringId: number) =>
    `/api/animal/${id}/neuterings/${neuteringId}`,
  ANIMAL_WEIGHING: (id: string, weighingId: number) =>
    `/api/animal/${id}/weighings/${weighingId}`,
} as const;

export async function createAnimal(
  data: AnimalFormData & { propertyId?: string },
) {
  const response = await fetch(API_ENDPOINTS.ANIMALS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível salvar o animal.",
      result.errors,
    );
  }

  return result;
}

export type AnimalUpdateData = {
  name?: string;
  breedId?: string;
  birthDate?: string;
  sex: string;
  newTag?: string;
  tagChangeNotes?: string;
  newRfid?: string;
  rfidChangeNotes?: string;
  newBatchId?: string;
  batchChangeNotes?: string;
  newWeightKg?: string;
  weightChangeNotes?: string;
  neuteredAt?: string;
  neuteringTechniqueId?: string;
  neuteringNotes?: string;
};

export async function updateAnimal(id: string, data: AnimalUpdateData) {
  const response = await fetch(API_ENDPOINTS.ANIMAL_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível atualizar o animal.",
      result.errors,
    );
  }

  return result;
}

export async function deleteAnimal(id: string) {
  const response = await fetch(API_ENDPOINTS.ANIMAL_BY_ID(id), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

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
  currentPropertyId: string;
  currentWeightKg: number | null;
  updatedAt: string;
};

export async function getAnimal(id: string): Promise<AnimalDetail> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_BY_ID(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

export type AnimalListResult = {
  data: AnimalRow[];
  total: number;
  pageCount: number;
};

export async function getAnimals(
  params: {
    propertyId?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    sex?: string;
    batchId?: string;
    excludeBatchId?: string;
    minWeight?: string;
    maxWeight?: string;
    neutered?: string;
    ageRange?: string;
    breedId?: string;
    origin?: string;
  } = {},
): Promise<AnimalListResult> {
  const {
    propertyId,
    page = 0,
    pageSize = 10,
    search = "",
    status = "",
    sex = "",
    batchId = "",
    excludeBatchId = "",
    minWeight = "",
    maxWeight = "",
    neutered = "",
    ageRange = "",
    breedId = "",
    origin = "",
  } = params;
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (propertyId) query.set("propertyId", propertyId);
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (sex) query.set("sex", sex);
  if (batchId) query.set("batchId", batchId);
  if (excludeBatchId) query.set("excludeBatchId", excludeBatchId);
  if (minWeight) query.set("minWeight", minWeight);
  if (maxWeight) query.set("maxWeight", maxWeight);
  if (neutered) query.set("neutered", neutered);
  if (ageRange) query.set("ageRange", ageRange);
  if (breedId) query.set("breedId", breedId);
  if (origin) query.set("origin", origin);

  const response = await fetch(`${API_ENDPOINTS.ANIMALS}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

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
  withdrawalUntil: string | null;
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

export async function getAnimalDetails(id: string): Promise<AnimalFullDetails> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_DETAILS(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

async function postJson(url: string, data: unknown, fallback: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? fallback, result.errors);
  }

  return result;
}

// Registra uma pesagem na hora (date vazio = hoje).
export function createWeighing(
  animalId: string,
  data: { weightKg: string; date?: string; notes?: string },
) {
  return postJson(
    API_ENDPOINTS.ANIMAL_WEIGHINGS(animalId),
    data,
    "Não foi possível registrar a pesagem.",
  );
}

// Registra uma castração (ou recastração, com motivo) na hora.
export function createNeutering(
  animalId: string,
  data: { date: string; techniqueId?: string; notes?: string },
) {
  return postJson(
    API_ENDPOINTS.ANIMAL_NEUTERINGS(animalId),
    data,
    "Não foi possível registrar a castração.",
  );
}

export type WeighingCorrectionData = {
  weightKg: string;
  date?: string;
  notes?: string;
};

export async function correctWeighing(
  animalId: string,
  weighingId: number,
  data: WeighingCorrectionData,
) {
  const response = await fetch(
    API_ENDPOINTS.ANIMAL_WEIGHING(animalId, weighingId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível corrigir a pesagem.",
      result.errors,
    );
  }

  return result;
}

export async function cancelWeighing(animalId: string, weighingId: number) {
  const response = await fetch(
    API_ENDPOINTS.ANIMAL_WEIGHING(animalId, weighingId),
    { method: "DELETE" },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível excluir a pesagem.");
  }

  return result;
}

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

export type IdentifierCorrectionData = {
  value: string;
  date?: string;
  notes?: string;
};

const identifiersUrl = (animalId: string, kind: IdentifierKind) =>
  `/api/animal/${animalId}/identifiers/${kind}`;

export async function getIdentifiers(
  animalId: string,
  kind: IdentifierKind,
): Promise<AnimalIdentifierRecord[]> {
  const response = await fetch(identifiersUrl(animalId, kind));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

// Troca o identificador na hora (value vazio = remover).
export async function changeIdentifier(
  animalId: string,
  kind: IdentifierKind,
  data: { value: string; notes?: string },
) {
  const response = await fetch(identifiersUrl(animalId, kind), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível trocar a identificação.",
      result.errors,
    );
  }

  return result;
}

export async function correctIdentifier(
  animalId: string,
  kind: IdentifierKind,
  recordId: number,
  data: IdentifierCorrectionData,
) {
  const response = await fetch(
    `${identifiersUrl(animalId, kind)}/${recordId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível corrigir a identificação.",
      result.errors,
    );
  }

  return result;
}

export async function cancelIdentifier(
  animalId: string,
  kind: IdentifierKind,
  recordId: number,
) {
  const response = await fetch(
    `${identifiersUrl(animalId, kind)}/${recordId}`,
    { method: "DELETE" },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ?? "Não foi possível excluir a identificação.",
    );
  }

  return result;
}

export async function getWeighings(
  animalId: string,
): Promise<AnimalWeighing[]> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_WEIGHINGS(animalId));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

export async function getNeuterings(
  animalId: string,
): Promise<AnimalNeuteringRecord[]> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_NEUTERINGS(animalId));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}

export type NeuteringCorrectionData = {
  date?: string;
  techniqueId?: string;
  notes?: string;
};

export async function correctNeutering(
  animalId: string,
  neuteringId: number,
  data: NeuteringCorrectionData,
) {
  const response = await fetch(
    API_ENDPOINTS.ANIMAL_NEUTERING(animalId, neuteringId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.message ?? "Não foi possível corrigir a castração.",
      result.errors,
    );
  }

  return result;
}

export async function cancelNeutering(
  animalId: string,
  neuteringId: number,
  keepNeutered?: boolean,
) {
  const response = await fetch(
    API_ENDPOINTS.ANIMAL_NEUTERING(animalId, neuteringId),
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepNeutered }),
    },
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível excluir a castração.");
  }

  return result;
}

export async function getAnimalCommitments(id: string): Promise<Commitment[]> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_COMMITMENTS(id));
  if (!response.ok) {
    throw new ApiError("Não foi possível carregar as operações do animal.");
  }
  return response.json();
}

// Compromissos em aberto de vários animais (só os que têm algum).
export async function getCommitmentsFor(
  animalIds: string[],
  exclude: CommitmentExclusion = {},
): Promise<Record<string, Commitment[]>> {
  if (!animalIds.length) return {};
  const response = await fetch(API_ENDPOINTS.COMMITMENTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ animalIds, ...exclude }),
  });
  if (!response.ok) {
    throw new ApiError("Não foi possível verificar as operações dos animais.");
  }
  return response.json();
}
