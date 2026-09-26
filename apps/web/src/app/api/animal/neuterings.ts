import { Prisma } from "@/lib/prisma";

// Inclusão padrão para ler castrações com a data da sessão (quando houver).
export const neuteringInclude = {
  management: {
    select: {
      managementSession: {
        select: { managementDate: true, scheduledDate: true },
      },
    },
  },
} satisfies Prisma.AnimalNeuteringInclude;

type NeuteringWithSession = Prisma.AnimalNeuteringGetPayload<{
  include: typeof neuteringInclude;
}>;

// Castração avulsa usa neuteredAt; a de sessão usa a data da sessão.
export function neuteringDate(n: NeuteringWithSession): Date {
  const session = n.management?.managementSession;
  return (
    n.neuteredAt ??
    session?.managementDate ??
    session?.scheduledDate ??
    n.createdAt
  );
}

export function toNeuteringDto(n: NeuteringWithSession) {
  return {
    id: n.id,
    date: neuteringDate(n).toISOString(),
    method: n.method,
    notes: n.notes,
    fromSession: n.managementId != null,
    correctedAt: n.correctedAt?.toISOString() ?? null,
    originalDate: n.originalNeuteredAt?.toISOString() ?? null,
    originalMethod: n.originalMethod,
  };
}
