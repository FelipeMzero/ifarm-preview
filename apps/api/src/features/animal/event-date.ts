import {
  dayInZone,
  formatDay,
  zonedDateTimeToInstant,
  type BrTimeZone,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate } from "../../lib/db-dates";
import { ValidationError } from "../../lib/errors";
import { animalStays } from "../property/time-zone.public";

// Data e hora de manejos avulsos e de correções (pesagem, castração, identificação),
// recebidas como "AAAA-MM-DDTHH:mm" no fuso da propriedade onde o evento aconteceu.

const dateError = (message: string) =>
  new ValidationError(message, { date: message });

export function assertNotFuture(at: Date) {
  if (at > new Date()) throw dateError("A data não pode ser futura.");
}

// O nascimento é só um dia: vale qualquer horário a partir dele (o dia do evento, no fuso
// da propriedade).
export async function assertNotBeforeBirth(
  animalId: string,
  at: Date,
  timeZone: BrTimeZone,
) {
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { birthDate: true },
  });
  const birthDay = fromDbDate(animal?.birthDate);
  if (birthDay && dayInZone(at, timeZone) < birthDay) {
    throw dateError(
      `A data não pode ser anterior ao nascimento do animal (${formatDay(birthDay)}).`,
    );
  }
}

// A data e hora informadas, no fuso, validadas (não futura, não antes do nascimento).
export async function resolveEventDateIn(
  animalId: string,
  value: string,
  timeZone: BrTimeZone,
): Promise<Date> {
  const at = zonedDateTimeToInstant(value, timeZone);
  assertNotFuture(at);
  await assertNotBeforeBirth(animalId, at, timeZone);
  return at;
}

// Instante a gravar num manejo avulso: a data e hora informadas (no fuso da propriedade
// atual do animal, onde o manejo acontece), ou agora se vier vazia.
export async function resolveEventDate(
  animalId: string,
  value: string | undefined,
): Promise<Date> {
  if (!value) return new Date();
  const { current } = await animalStays(animalId);
  return resolveEventDateIn(animalId, value, current);
}
