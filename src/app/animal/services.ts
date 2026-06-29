import { AnimalFormData } from "./schema";

export type AnimalRow = {
  id: string;
  rfid: string | null;
  brinco: string | null;
  nome_apelido: string | null;
  sexo: string;
  data_nascimento: string | null;
  peso_nascimento_kg: number | null;
  origem: string;
  status: string;
  peso_atual_kg: number | null;
  updatedAt: string;
};

const API_ENDPOINTS = {
  ANIMAIS: "/api/animal",
  ANIMAL_BY_ID: (id: string) => `/api/animal/${id}`,
} as const;



export async function createAnimal(data: AnimalFormData) {
  const response = await fetch(API_ENDPOINTS.ANIMAIS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
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
    throw new Error(result.message);
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

export async function getAnimais(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sexo?: string;
} = {}): Promise<AnimalListResult> {
  const { page = 0, pageSize = 10, search = "", status = "", sexo = "" } = params;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (sexo) query.set("sexo", sexo);

  const response = await fetch(`${API_ENDPOINTS.ANIMAIS}?${query}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result;
}
