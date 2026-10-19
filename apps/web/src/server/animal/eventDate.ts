import "server-only";
import { formatDate, fromDbDate, toLocalDay, today } from "@ifarm/shared";
import { prisma } from "@/server/db";
import { ValidationError } from "../errors";

// Datas de manejos avulsos (pesagem, castração, identificação), recebidas como "AAAA-MM-DD".

const dateError = (message: string) =>
  new ValidationError(message, { date: message });

export function assertNotFuture(day: string) {
  if (day > today()) throw dateError("A data não pode ser futura.");
}

export async function assertNotBeforeBirth(animalId: string, day: string) {
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { birthDate: true },
  });
  const birthDay = animal?.birthDate ? fromDbDate(animal.birthDate) : null;
  if (birthDay && day < birthDay) {
    throw dateError(
      `A data não pode ser anterior ao nascimento do animal (${formatDate(birthDay)}).`,
    );
  }
}

// Instante a gravar num manejo avulso: hoje usa a hora atual (fica depois dos registros
// anteriores do dia); dias passados ficam à meia-noite local.
export async function resolveEventDate(
  animalId: string,
  day: string | undefined,
): Promise<Date> {
  if (!day || day === today()) return new Date();
  assertNotFuture(day);
  await assertNotBeforeBirth(animalId, day);
  return toLocalDay(day);
}

// Correção de data: troca só o dia e mantém o horário original, para não alterar a ordem
// entre registros do mesmo dia.
export function withDay(day: string, original: Date): Date {
  const at = toLocalDay(day);
  at.setHours(
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds(),
  );
  return at;
}
