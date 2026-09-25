export type StockingPreviewRequest = {
  areaId?: string;
  batchId?: string;
  transferId?: string;
  animalIds?: string[];
  batchIds?: string[];
  newAnimals?: {
    weightKg?: number | null;
    birthDate?: string;
    sex: string;
    neutered?: boolean;
  }[];
};

type UaTotal = { ua: number; count: number; estimatedCount: number };

export type StockingPreview = {
  area: { id: string; name: string };
  capacityUa: number;
  current: UaTotal;
  incoming: UaTotal;
  projectedUa: number;
  exceeds: boolean;
};

export async function getStockingPreview(
  request: StockingPreviewRequest,
): Promise<StockingPreview | null> {
  const response = await fetch("/api/stocking-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Não foi possível calcular a lotação.");
  }

  return result.data;
}
