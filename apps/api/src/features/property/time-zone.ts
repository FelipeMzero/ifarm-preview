import {
  instantToZonedIso,
  type BrTimeZone,
  type PropertyZoneRef,
} from "@ifarm/shared";
import { prisma, type Prisma } from "@ifarm/db";
import { NotFoundError } from "../../lib/errors";

// Fuso horário da propriedade (RN-PROPRIEDADE-05): a data e a hora dos eventos dela são
// recebidas, devolvidas e comparadas por dia nesse fuso. Usado por todos os domínios com data e
// hora (manejos, transferências, animais, compras).

type Db = Prisma.TransactionClient;

// O fuso gravado é sempre um dos fusos do Brasil (propertySchema) ou o padrão do banco.
export const asTimeZone = (value: string) => value as BrTimeZone;

export async function propertyTimeZone(
  propertyId: string,
  db: Db = prisma,
): Promise<BrTimeZone> {
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { timeZone: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");
  return asTimeZone(property.timeZone);
}

// A propriedade de um registro nas respostas de detalhe, com o fuso (PropertyZoneRef).
export const propertyRefSelect = {
  id: true,
  name: true,
  timeZone: true,
} satisfies Prisma.PropertySelect;

export const toPropertyRef = (property: {
  id: string;
  name: string;
  timeZone: string;
}): PropertyZoneRef => ({
  ...property,
  timeZone: asTimeZone(property.timeZone),
});

/**
 * Instante → ISO com o deslocamento do fuso (vazio → null). Toda data e hora de um registro da
 * propriedade sai assim, inclusive as gravadas pelo sistema (createdAt, confirmedAt...): na tela,
 * todas ficam na hora da fazenda e comparáveis entre si.
 */
export function toZonedIso(instant: Date, timeZone: string): string;
export function toZonedIso(
  instant: Date | null | undefined,
  timeZone: string,
): string | null;
export function toZonedIso(
  instant: Date | null | undefined,
  timeZone: string,
): string | null {
  return instant ? instantToZonedIso(instant, timeZone) : null;
}

/** Passagens do animal pelas propriedades, com o fuso de cada uma. */
export type PropertyStay = {
  enteredAt: Date;
  exitedAt: Date | null;
  property: { timeZone: string };
};

export const propertyStaySelect = {
  enteredAt: true,
  exitedAt: true,
  property: { select: { timeZone: true } },
} satisfies Prisma.AnimalPropertyHistorySelect;

// Fuso da propriedade em que o animal estava no instante (o evento aconteceu lá). Fora dos
// períodos registrados, o da propriedade atual (`fallback`).
export function timeZoneAt(
  stays: PropertyStay[],
  instant: Date,
  fallback: BrTimeZone,
): BrTimeZone {
  const stay = stays.find(
    (s) => s.enteredAt <= instant && (!s.exitedAt || instant < s.exitedAt),
  );
  return stay ? asTimeZone(stay.property.timeZone) : fallback;
}

/** Fuso de cada instante de um animal (para os eventos dele): ver timeZoneAt. */
export type ZoneOf = (instant: Date) => BrTimeZone;

/** As passagens do animal e o fuso da propriedade atual dele, para usar com timeZoneAt. */
export async function animalStays(animalId: string, db: Db = prisma) {
  const animal = await db.animal.findUnique({
    where: { id: animalId },
    select: {
      currentProperty: { select: { timeZone: true } },
      animalPropertyHistories: { select: propertyStaySelect },
    },
  });
  if (!animal) throw new NotFoundError("Animal não encontrado.");
  const stays = animal.animalPropertyHistories;
  const current = asTimeZone(animal.currentProperty.timeZone);
  const zoneOf: ZoneOf = (instant) => timeZoneAt(stays, instant, current);
  return { stays, current, zoneOf };
}
