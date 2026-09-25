import { Prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

// Inclusão padrão para ler pesagens com a data da sessão (quando houver).
export const weighingInclude = {
  management: {
    select: {
      managementSession: {
        select: { managementDate: true, scheduledDate: true },
      },
    },
  },
} satisfies Prisma.WeighingManagementItemInclude;

type WeighingWithSession = Prisma.WeighingManagementItemGetPayload<{
  include: typeof weighingInclude;
}>;

// Pesagem avulsa usa weighedAt; a de sessão usa a data da sessão.
function weighingDate(w: WeighingWithSession): Date {
  const session = w.management?.managementSession;
  return (
    w.weighedAt ?? session?.managementDate ?? session?.scheduledDate ?? w.createdAt
  );
}

export function toWeighingDto(w: WeighingWithSession) {
  return {
    id: w.id,
    date: weighingDate(w).toISOString(),
    weightKg: w.weight.toNumber(),
    notes: w.notes,
    fromSession: w.managementId != null,
    correctedAt: w.correctedAt?.toISOString() ?? null,
    originalWeightKg: w.originalWeight?.toNumber() ?? null,
  };
}

// Pesagens válidas (não canceladas), da mais antiga para a mais recente.
export function sortWeighings<T extends { date: string; id: number }>(
  list: T[],
): T[] {
  return list.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

// Recalcula o peso atual (campo desnormalizado) a partir da pesagem válida mais recente.
export async function recomputeCurrentWeight(tx: Tx, animalId: string) {
  const weighings = await tx.weighingManagementItem.findMany({
    where: { animalId, cancelledAt: null },
    include: weighingInclude,
  });

  const latest = weighings
    .map((w) => ({ weight: w.weight, time: weighingDate(w).getTime(), id: w.id }))
    .sort((a, b) => b.time - a.time || b.id - a.id)[0];

  await tx.animal.update({
    where: { id: animalId },
    data: { currentWeight: latest?.weight ?? null },
  });
}
