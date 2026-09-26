import type { AnimalNeutering } from "@/generated/prisma/client";

export function toNeuteringDto(n: AnimalNeutering) {
  return {
    id: n.id,
    date: n.neuteredAt.toISOString(),
    method: n.method,
    notes: n.notes,
    fromSession: n.managementId != null,
    correctedAt: n.correctedAt?.toISOString() ?? null,
    originalDate: n.originalNeuteredAt?.toISOString() ?? null,
    originalMethod: n.originalMethod,
  };
}
