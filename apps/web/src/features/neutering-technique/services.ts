export class ApiError extends Error {
  errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export type NeuteringTechnique = {
  id: string;
  name: string;
  deactivatedAt: string | null;
};

const API_ENDPOINTS = {
  TYPES: "/api/neutering-technique",
  TYPE_BY_ID: (id: string) => `/api/neutering-technique/${id}`,
} as const;

export async function getNeuteringTechniques(): Promise<NeuteringTechnique[]> {
  const response = await fetch(API_ENDPOINTS.TYPES);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export async function createNeuteringTechnique(
  name: string,
): Promise<NeuteringTechnique> {
  const response = await fetch(API_ENDPOINTS.TYPES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(
      result.errors?.name ??
        result.message ??
        "Não foi possível criar a técnica de castração.",
      result.errors,
    );
  }

  return result.data;
}

export async function updateNeuteringTechnique(
  id: string,
  name: string,
): Promise<NeuteringTechnique> {
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
        "Não foi possível salvar a técnica de castração.",
      result.errors,
    );
  }

  return result.data;
}

export async function deleteNeuteringTechnique(id: string): Promise<void> {
  const response = await fetch(API_ENDPOINTS.TYPE_BY_ID(id), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }
}

export async function toggleNeuteringTechniqueStatus(
  id: string,
): Promise<NeuteringTechnique> {
  const response = await fetch(API_ENDPOINTS.TYPE_BY_ID(id), {
    method: "PATCH",
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

// Opções do select de técnica: as ativas, mais a já gravada no registro (que pode
// ter sido inativada depois), para não sumir ao editar. Com `optional`, inclui
// "Não informada" (valor "").
export function techniqueItems(
  techniques: { id: string; name: string; deactivatedAt?: string | null }[],
  {
    current,
    optional = false,
  }: {
    current?: { id: string | null; name: string | null } | null;
    optional?: boolean;
  } = {},
) {
  const items = techniques
    .filter((t) => !t.deactivatedAt || t.id === current?.id)
    .map((t) => ({ value: t.id, label: t.name }));
  if (
    current?.id &&
    current.name &&
    !items.some((item) => item.value === current.id)
  ) {
    items.push({ value: current.id, label: current.name });
  }
  return optional ? [{ value: "", label: "Não informada" }, ...items] : items;
}
