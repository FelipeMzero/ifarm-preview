import "server-only";
import { z } from "zod";
import {
  fromLocalDay,
  unavailableReason,
  type BatchTransferDetail,
  type BatchTransferListResult,
} from "@ifarm/shared";
import { prisma } from "@/lib/prisma";
import { getOrAssignCurrentProperty } from "../current-property/queries";
import { NotFoundError } from "../errors";
import { transferStatus } from "./rules";

export const batchTransferQuerySchema = z.object({
  propertyId: z.uuid().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["pending", "confirmed", "cancelled"]).optional(),
  ),
});

export type BatchTransferQuery = z.infer<typeof batchTransferQuerySchema>;

function buildWhere(query: BatchTransferQuery, propertyId: string) {
  const where: Record<string, unknown> = {
    propertyId,
    // Transferências de sessão de manejo ainda não consolidada são geridas pela sessão.
    AND: [
      { OR: [{ managementSessionId: null }, { confirmedAt: { not: null } }] },
    ],
  };

  if (query.status === "pending") {
    where.confirmedAt = null;
    where.cancelledAt = null;
  } else if (query.status === "confirmed") {
    where.confirmedAt = { not: null };
    where.cancelledAt = null;
  } else if (query.status === "cancelled") {
    where.cancelledAt = { not: null };
  }

  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" };
    where.OR = [
      { destinationBatch: { name: contains } },
      { notes: contains },
      { items: { some: { originBatch: { name: contains } } } },
      { items: { some: { animal: { currentBatch: { name: contains } } } } },
    ];
  }

  return where;
}

// Confirmadas usam o lote registrado no item; as demais, o lote atual dos animais.
function originBatchNames(t: {
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  items: {
    originBatch: { name: string } | null;
    animal: { currentBatch: { name: string } | null };
  }[];
}) {
  const confirmed = transferStatus(t) === "confirmed";
  const names = t.items.map(
    (i) =>
      (confirmed ? i.originBatch?.name : i.animal.currentBatch?.name) ??
      "Sem lote",
  );
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// Transferências da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listBatchTransfers(
  query: BatchTransferQuery,
  userId: string,
): Promise<BatchTransferListResult> {
  const propertyId =
    query.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) return { data: [], total: 0, pageCount: 0 };

  const where = buildWhere(query, propertyId);
  const [transfers, total] = await Promise.all([
    prisma.animalBatchTransfer.findMany({
      where,
      include: {
        destinationBatch: { select: { id: true, name: true } },
        items: {
          select: {
            originBatch: { select: { name: true } },
            animal: { select: { currentBatch: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ transferDate: "desc" }, { createdAt: "desc" }],
      skip: query.page * query.pageSize,
      take: query.pageSize,
    }),
    prisma.animalBatchTransfer.count({ where }),
  ]);

  return {
    data: transfers.map((t) => ({
      id: t.id,
      transferDate: fromLocalDay(t.transferDate),
      notes: t.notes,
      originBatches: originBatchNames(t),
      destinationBatch: t.destinationBatch,
      animalCount: t.items.length,
      status: transferStatus(t),
      confirmedAt: t.confirmedAt?.toISOString() ?? null,
      cancelledAt: t.cancelledAt?.toISOString() ?? null,
      updatedAt: t.updatedAt.toISOString(),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}

export async function getBatchTransfer(
  id: string,
): Promise<BatchTransferDetail> {
  const transfer = await prisma.animalBatchTransfer.findUnique({
    where: { id },
    include: {
      destinationBatch: { select: { id: true, name: true } },
      items: {
        orderBy: { id: "asc" },
        include: {
          originBatch: { select: { id: true, name: true } },
          animal: {
            select: {
              id: true,
              code: true,
              currentTag: true,
              currentRfid: true,
              name: true,
              sex: true,
              status: true,
              currentPropertyId: true,
              currentWeight: true,
              currentBatch: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
  if (!transfer) throw new NotFoundError("Transferência não encontrada.");

  return {
    id: transfer.id,
    transferDate: fromLocalDay(transfer.transferDate),
    notes: transfer.notes ?? "",
    destinationBatch: transfer.destinationBatch,
    propertyId: transfer.propertyId,
    status: transferStatus(transfer),
    confirmedAt: transfer.confirmedAt?.toISOString() ?? null,
    cancelledAt: transfer.cancelledAt?.toISOString() ?? null,
    updatedAt: transfer.updatedAt.toISOString(),
    animals: transfer.items.map(({ animal, originBatch }) => ({
      id: animal.id,
      code: animal.code,
      earTag: animal.currentTag,
      rfid: animal.currentRfid,
      name: animal.name,
      sex: animal.sex,
      status: animal.status,
      currentWeightKg: animal.currentWeight?.toNumber() ?? null,
      currentBatch: animal.currentBatch,
      originBatch,
      // Só pendente: depois de encerrada, não há o que remover.
      unavailableReason:
        transferStatus(transfer) === "pending"
          ? unavailableReason(animal, transfer.propertyId)
          : null,
    })),
  };
}
