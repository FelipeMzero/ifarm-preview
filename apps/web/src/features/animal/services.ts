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
  rfid: string | null;
  earTag: string;
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

export async function updateAnimal(id: string, data: AnimalFormData) {
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

export async function getAnimal(id: string): Promise<AnimalFormData> {
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
