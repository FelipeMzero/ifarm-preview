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
  updatedAt: string;
};

const API_ENDPOINTS = {
  ANIMALS: "/api/animal",
  ANIMAL_BY_ID: (id: string) => `/api/animal/${id}`,
  ANIMAL_DETAILS: (id: string) => `/api/animal/${id}/details`,
  ANIMAL_WEIGHINGS: (id: string) => `/api/animal/${id}/weighings`,
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
  neuteringMethod?: string;
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
  } = {},
): Promise<AnimalListResult> {
  const {
    propertyId,
    page = 0,
    pageSize = 10,
    search = "",
    status = "",
    sex = "",
  } = params;
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (propertyId) query.set("propertyId", propertyId);
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (sex) query.set("sex", sex);

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
  method: string | null;
  notes: string | null;
};

export type AnimalHealthRecord = {
  id: number;
  date: string;
  typeName: string;
  title: string | null;
  veterinarianName: string | null;
  withdrawalUntil: string | null;
  nextDueDate: string | null;
  cost: number | null;
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

export async function getAnimalDetails(
  id: string,
): Promise<AnimalFullDetails> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_DETAILS(id));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
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

export async function getWeighings(animalId: string): Promise<AnimalWeighing[]> {
  const response = await fetch(API_ENDPOINTS.ANIMAL_WEIGHINGS(animalId));
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}
