import "server-only";
import { formatDate, fromLocalDay, toLocalDateTime } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { ValidationError } from "../errors";
import { fromDbDate } from "../db-dates";

// Data e hora de manejos avulsos e de correções (pesagem, castração, identificação),
// recebidas como "AAAA-MM-DDTHH:mm" e interpretadas no fuso local.

const dateError = (message: string) =>
  new ValidationError(message, { date: message });

export function assertNotFuture(at: Date) {
  if (at > new Date()) throw dateError("A data não pode ser futura.");
}

// O nascimento é só um dia: vale qualquer horário a partir dele.
export async function assertNotBeforeBirth(animalId: string, at: Date) {
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { birthDate: true },
  });
  const birthDay = animal?.birthDate ? fromDbDate(animal.birthDate) : null;
  if (birthDay && fromLocalDay(at) < birthDay) {
    throw dateError(
      `A data não pode ser anterior ao nascimento do animal (${formatDate(birthDay)}).`,
    );
  }
}

// Instante a gravar num manejo avulso: a data e hora informadas, ou agora se vier vazia.
export async function resolveEventDate(
  animalId: string,
  value: string | undefined,
): Promise<Date> {
  if (!value) return new Date();
  const at = toLocalDateTime(value);
  assertNotFuture(at);
  await assertNotBeforeBirth(animalId, at);
  return at;
}
