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
  ANIMALS: "/api/animais",
  ANIMAL_BY_ID: (id: string) => `/api/animais/${id}`,
  METADATA: "/api/metadados",
} as const;

export type Breed = { id: number; name: string };
export type Batch = { id: number; name: string };
export type Farm = { id: number; name: string };
export type AnimalSummary = { id: string; earTag: string; rfid: string | null; sex: string };

export type Metadata = {
  breeds: Breed[];
  batches: Batch[];
  farms: Farm[];
  farmAnimals: AnimalSummary[];
};

export async function getMetadata(): Promise<Metadata> {
  const response = await fetch(API_ENDPOINTS.METADATA);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}



export async function createAnimal(data: AnimalFormData) {
  const response = await fetch(API_ENDPOINTS.ANIMALS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.message ?? "Não foi possível salvar o animal.", result.errors);
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
    throw new ApiError(result.message ?? "Não foi possível atualizar o animal.", result.errors);
  }

  return result;
}



export async function deleteAnimal(id: string) {
  const response = await fetch(API_ENDPOINTS.ANIMAL_BY_ID(id), { method: "DELETE" });
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

export async function getAnimals(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sex?: string;
} = {}): Promise<AnimalListResult> {
  const { page = 0, pageSize = 10, search = "", status = "", sex = "" } = params;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
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
