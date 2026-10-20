import "server-only";
import { z } from "zod";
import { Prisma } from "@/server/db";
import { FIELD_LIMITS, fromLocalDay, toDbDate } from "@ifarm/shared";
import { effectiveAt } from "@/server/event-time";
import { BusinessError } from "@/server/errors";

type Tx = Prisma.TransactionClient;

// Integração da compra com a sessão de manejo. A sessão é genérica: quando ela é usada
// para receber animais comprados, existe um PurchaseReception apontando para ela, e as
// rotas da sessão consultam este módulo para aplicar as regras de recepção (criar
// animais no registro, não remover recebidos na consolidação).

export class ReceptionError extends BusinessError {}

export const receptionInputSchema = z.object({
  purchaseEventId: z.uuid(),
  entryBatchId: z.uuid("Selecione o lote de entrada."),
});

export async function findReception(tx: Tx, sessionId: string) {
  return tx.purchaseReception.findUnique({
    where: { managementSessionId: sessionId },
    include: {
      entryBatch: { select: { id: true, name: true, closedAt: true } },
      purchaseEvent: {
        select: {
          id: true,
          title: true,
          cancelledAt: true,
          confirmedAt: true,
          destinationPropertyId: true,
          seller: { select: { name: true } },
        },
      },
    },
  });
}

export type Reception = NonNullable<Awaited<ReturnType<typeof findReception>>>;

export async function validateReceptionInput(
  tx: Tx,
  propertyId: string,
  input: z.infer<typeof receptionInputSchema>,
) {
  const event = await tx.purchaseEvent.findUnique({
    where: { id: input.purchaseEventId },
    select: {
      cancelledAt: true,
      confirmedAt: true,
      destinationPropertyId: true,
    },
  });
  if (!event || event.cancelledAt || event.confirmedAt) {
    throw new ReceptionError(
      "Recepções só podem ser abertas em compras em andamento.",
      400,
    );
  }
  if (event.destinationPropertyId !== propertyId) {
    throw new ReceptionError(
      "A recepção deve ser feita na propriedade de destino da compra.",
      400,
    );
  }
  const batch = await tx.batch.findFirst({
    where: { id: input.entryBatchId, propertyId, closedAt: null },
    select: { id: true },
  });
  if (!batch) {
    throw new ReceptionError(
      "Lote de entrada inválido ou encerrado.",
      400,
      "entryBatchId",
    );
  }
}

const SEX_LABEL = { MALE: "Machos", FEMALE: "Fêmeas" } as const;

export function categoryLabel(c: {
  sex: "MALE" | "FEMALE";
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  breed: { name: string } | null;
}) {
  const age =
    c.minAgeMonths != null && c.maxAgeMonths != null
      ? `${c.minAgeMonths}–${c.maxAgeMonths} meses`
      : c.minAgeMonths != null
        ? `a partir de ${c.minAgeMonths} meses`
        : c.maxAgeMonths != null
          ? `até ${c.maxAgeMonths} meses`
          : null;
  return [SEX_LABEL[c.sex], age, c.breed?.name].filter(Boolean).join(" · ");
}

// Dados da compra para a tela de registro (sem valores: a recepção é operada por quem
// não necessariamente vê o financeiro).
export async function describeReception(tx: Tx, sessionId: string) {
  const reception = await findReception(tx, sessionId);
  if (!reception) return null;

  const [categories, received] = await Promise.all([
    tx.purchaseCategory.findMany({
      where: { eventId: reception.purchaseEventId },
      orderBy: { id: "asc" },
      include: { breed: { select: { id: true, name: true } } },
    }),
    tx.purchasedAnimal.findMany({
      where: { purchaseEventId: reception.purchaseEventId },
      select: { animalId: true, categoryId: true, receptionId: true },
    }),
  ]);

  return {
    id: reception.id,
    purchaseEventId: reception.purchaseEventId,
    purchaseTitle: reception.purchaseEvent.title,
    sellerName: reception.purchaseEvent.seller.name,
    gtaNumber: reception.gtaNumber,
    invoiceNumber: reception.invoiceNumber,
    entryBatch: {
      id: reception.entryBatch.id,
      name: reception.entryBatch.name,
    },
    categories: categories.map((c) => ({
      id: c.id,
      label: categoryLabel(c),
      sex: c.sex,
      breed: c.breed,
      minAgeMonths: c.minAgeMonths,
      maxAgeMonths: c.maxAgeMonths,
      expectedQuantity: c.expectedQuantity,
      // Recebidos na compra toda (todas as viagens) e só nesta recepção.
      receivedTotal: received.filter((r) => r.categoryId === c.id).length,
      receivedHere: received.filter(
        (r) => r.categoryId === c.id && r.receptionId === reception.id,
      ).length,
    })),
    categoryOfAnimal: Object.fromEntries(
      received
        .filter((r) => r.receptionId === reception.id)
        .map((r) => [r.animalId, r.categoryId]),
    ),
  };
}

export const receiveAnimalSchema = z.object({
  categoryId: z.coerce.number().int(),
  // Sexo diferente do da categoria é permitido (com alerta na tela): quem decide é o
  // operador olhando o animal.
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  // Idade estimada (ex.: pela arcada dentária); vira data de nascimento estimada.
  ageMonths: z.coerce
    .number()
    .int()
    .min(0, "Idade inválida")
    .max(360, "Idade inválida")
    .nullish(),
  name: z
    .string()
    .trim()
    .max(
      FIELD_LIMITS.animal.name,
      `Máximo de ${FIELD_LIMITS.animal.name} caracteres`,
    )
    .nullish()
    .transform((v) => v || null),
});

// Cria o animal que desceu do caminhão: já ativo, na propriedade e no lote de entrada,
// ligado à categoria da compra e participante da sessão.
export async function receiveAnimal(
  tx: Tx,
  session: { id: string; propertyId: string; managementDate: Date },
  reception: Reception,
  input: z.infer<typeof receiveAnimalSchema>,
) {
  if (reception.purchaseEvent.cancelledAt) {
    throw new ReceptionError("A compra foi cancelada.", 409);
  }
  if (reception.purchaseEvent.confirmedAt) {
    throw new ReceptionError("A compra já foi consolidada.", 409);
  }
  if (reception.entryBatch.closedAt) {
    throw new ReceptionError(
      `O lote de entrada "${reception.entryBatch.name}" está encerrado.`,
      409,
    );
  }

  const category = await tx.purchaseCategory.findFirst({
    where: { id: input.categoryId, eventId: reception.purchaseEventId },
  });
  if (!category) {
    throw new ReceptionError(
      "Categoria inválida para esta compra.",
      400,
      "categoryId",
    );
  }

  // Entrada na fazenda: a data e hora da recepção (ver effectiveAt).
  const enteredAt = effectiveAt(session.managementDate, new Date());

  let birthDate: Date | null = null;
  if (input.ageMonths != null) {
    const d = new Date(session.managementDate);
    d.setMonth(d.getMonth() - input.ageMonths);
    // @db.Date: grava o dia (UTC 00:00) correspondente à data local.
    birthDate = toDbDate(fromLocalDay(d));
  }

  const animal = await tx.animal.create({
    data: {
      name: input.name,
      sex: input.sex ?? category.sex,
      breedId: category.breedId,
      origin: "PURCHASE",
      status: "ACTIVE",
      birthDate,
      birthDateEstimated: birthDate != null,
      currentPropertyId: session.propertyId,
      currentBatchId: reception.entryBatchId,
    },
  });

  await tx.animalPropertyHistory.create({
    data: {
      animalId: animal.id,
      propertyId: session.propertyId,
      enteredAt,
      notes: "Recepção de compra",
    },
  });
  await tx.animalBatchHistory.create({
    data: {
      animalId: animal.id,
      batchId: reception.entryBatchId,
      enteredAt,
      notes: "Recepção de compra",
    },
  });
  await tx.managementParticipant.create({
    data: { managementSessionId: session.id, animalId: animal.id },
  });
  await tx.purchasedAnimal.create({
    data: {
      purchaseEventId: reception.purchaseEventId,
      categoryId: category.id,
      receptionId: reception.id,
      animalId: animal.id,
    },
  });

  return animal.id;
}

// Tirar um animal da recepção antes de consolidar desfaz o recebimento: o animal foi
// criado aqui, então é apagado (os registros de manejo já foram desfeitos pela sessão).
export async function removeReceivedAnimal(
  tx: Tx,
  reception: Reception,
  animalId: string,
) {
  const purchased = await tx.purchasedAnimal.findFirst({
    where: { animalId, receptionId: reception.id },
  });
  if (!purchased) return;

  await tx.purchasedAnimal.delete({ where: { id: purchased.id } });
  await tx.animalBatchHistory.deleteMany({ where: { animalId } });
  await tx.animalPropertyHistory.deleteMany({ where: { animalId } });
  try {
    await tx.animal.delete({ where: { id: animalId } });
  } catch (error) {
    // Outras entidades já apontam para o animal (ex.: outra sessão de manejo).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new ReceptionError(
        "O animal já tem registros fora desta recepção e não pode ser removido.",
        409,
      );
    }
    throw error;
  }
}
