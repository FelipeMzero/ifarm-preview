export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type Breed = {
  id: number;
  name: string;
};

const API_ENDPOINTS = {
  BREEDS: "/api/breed",
  BREED_BY_ID: (id: number) => `/api/breed/${id}`,
} as const;

export async function getBreeds(): Promise<Breed[]> {
  const response = await fetch(API_ENDPOINTS.BREEDS);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export async function createBreed(name: string): Promise<Breed> {
  const response = await fetch(API_ENDPOINTS.BREEDS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.errors?.name ?? result.message ?? "Não foi possível criar a raça.", result.errors);
  }

  return result.data;
}

export async function updateBreed(id: number, name: string): Promise<Breed> {
  const response = await fetch(API_ENDPOINTS.BREED_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(result.errors?.name ?? result.message ?? "Não foi possível salvar a raça.", result.errors);
  }

  return result.data;
}

export async function deleteBreed(id: number): Promise<void> {
  const response = await fetch(API_ENDPOINTS.BREED_BY_ID(id), { method: "DELETE" });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
}
