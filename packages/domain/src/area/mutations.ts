import "server-only";
import type { AreaInput } from "@ifarm/shared";
import { prisma } from "@/server/db";
import { write } from "../db-errors";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { toggledDeactivatedAt } from "../status";
import { findOccupyingBatch } from "./queries";

// Converte o que veio do formulário (números como texto, "" para vazio) para o formato do banco.
function toAreaData(input: AreaInput) {
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

async function findOrThrow(id: string) {
  const area = await prisma.area.findUnique({
    where: { id },
    select: { closedAt: true },
  });
  if (!area) throw new NotFoundError("Área não encontrada.");
  return area;
}

export async function createArea(input: AreaInput) {
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { deactivatedAt: true },
  });
  if (!property || property.deactivatedAt) {
    throw new ValidationError("Propriedade inválida ou inativa.", {
      propertyId: "Propriedade inválida ou inativa.",
    });
  }

  const area = await write(() =>
    prisma.area.create({
      data: { ...toAreaData(input), propertyId: input.propertyId },
      select: { id: true },
    }),
  );
  return { id: area.id };
}

// A propriedade da área não muda na edição.
export async function updateArea(id: string, input: AreaInput) {
  await findOrThrow(id);
  await write(() =>
    prisma.area.update({ where: { id }, data: toAreaData(input) }),
  );
  return { id };
}

export async function deleteArea(id: string) {
  await findOrThrow(id);
  await write(() => prisma.area.delete({ where: { id } }));
}

// Desativar uma área ocupada deixaria o lote "dentro" de uma área inativa (some do mapa,
// mas continua como área atual do lote): é preciso mover o lote antes.
export async function toggleAreaStatus(id: string) {
  const area = await findOrThrow(id);

  if (!area.closedAt) {
    const occupant = await findOccupyingBatch(prisma, id);
    if (occupant) {
      throw new ConflictError(
        `A área está ocupada pelo lote "${occupant.name}". Mova o lote para outra área antes de desativar.`,
        undefined,
        { code: "OCCUPIED", batch: occupant },
      );
    }
  }

  const closedAt = toggledDeactivatedAt(area.closedAt);
  await prisma.area.update({ where: { id }, data: { closedAt } });
  return { id, closedAt: closedAt?.toISOString() ?? null };
}
