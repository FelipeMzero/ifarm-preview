export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type HealthManagementType = {
  id: string;
  name: string;
  deactivatedAt: string | null;
};

const API_ENDPOINTS = {
  TYPES: "/api/health-management-type",
  TYPE_BY_ID: (id: string) => `/api/health-management-type/${id}`,
} as const;

export async function getHealthManagementTypes(): Promise<HealthManagementType[]> {
  const response = await fetch(API_ENDPOINTS.TYPES);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export async function createHealthManagementType(name: string): Promise<HealthManagementType> {
  const response = await fetch(API_ENDPOINTS.TYPES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.errors?.name ?? result.message ?? "Não foi possível criar o tipo de manejo sanitário.",
      result.errors,
    );
  }

  return result.data;
}

export async function updateHealthManagementType(id: string, name: string): Promise<HealthManagementType> {
  const response = await fetch(API_ENDPOINTS.TYPE_BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.errors?.name ??
        result.message ??
        "Não foi possível salvar o tipo de manejo sanitário.",
      result.errors,
    );
  }

  return result.data;
}

export async function deleteHealthManagementType(id: string): Promise<void> {
  const response = await fetch(API_ENDPOINTS.TYPE_BY_ID(id), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
}

export async function toggleHealthManagementTypeStatus(id: string): Promise<HealthManagementType> {
  const response = await fetch(API_ENDPOINTS.TYPE_BY_ID(id), {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
