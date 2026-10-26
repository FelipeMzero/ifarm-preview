import type { AreaInput } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { NotFoundError } from "@ifarm/domain/errors";

// Usados por mais de uma operação de área.

// Converte o que veio do formulário (números como texto, "" para vazio) para o formato do banco.
export function toAreaData(input: AreaInput) {
  const days = (v?: string) => (v ? parseInt(v, 10) : null);
  return {
    name: input.name,
    polygon: input.polygon,
    hectares: parseFloat(input.hectares),
    stockingRate: parseFloat(input.stockingRate),
    defaultOccupationDays: days(input.defaultOccupationDays),
    defaultRestDays: days(input.defaultRestDays),
    notes: input.notes || null,
  };
}

export async function findAreaOrThrow(id: string) {
  const area = await prisma.area.findUnique({
    where: { id },
    select: { closedAt: true },
  });
  if (!area) throw new NotFoundError("Área não encontrada.");
  return area;
}
