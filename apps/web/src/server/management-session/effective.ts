import "server-only";
import type { Prisma } from "@/lib/prisma";

// Registros feitos numa sessão de manejo ficam gravados nas tabelas definitivas desde o
// registro, mas só passam a valer quando a sessão é consolidada. Estes filtros separam os
// registros efetivos (avulsos ou de sessão consolidada) dos que ainda estão pendentes —
// ou que nunca valerão, se a sessão for cancelada.

const confirmedSession = { confirmedAt: { not: null } };

export const effectiveWeighing: Prisma.AnimalWeighingWhereInput = {
  OR: [
    { managementId: null },
    { management: { managementSession: confirmedSession } },
  ],
};

export const effectiveNeutering: Prisma.AnimalNeuteringWhereInput = {
  OR: [
    { managementId: null },
    { management: { managementSession: confirmedSession } },
  ],
};

export const effectiveTagging: Prisma.AnimalTaggingWhereInput = {
  OR: [
    { managementId: null },
    { management: { managementSession: confirmedSession } },
  ],
};

export const effectiveRfidTagging: Prisma.AnimalRfidTaggingWhereInput = {
  OR: [
    { managementId: null },
    { management: { managementSession: confirmedSession } },
  ],
};

export const effectiveHealthItem: Prisma.HealthManagementItemWhereInput = {
  management: {
    OR: [
      { managementSessionId: null },
      { managementSession: confirmedSession },
    ],
  },
};
