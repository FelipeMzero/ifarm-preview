import {
  instantToZonedIso,
  type BatchTransferListResult,
  type BatchTransferQuery,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "../../current-property/resolve";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone";
import { TRANSFER_STATUS_WHERE, transferStatus } from "../rules";

function buildWhere(query: BatchTransferQuery, propertyId: string) {
  const where: Record<string, unknown> = {
    propertyId,
    // Transferências de sessão de manejo ainda não consolidada são geridas pela sessão.
    AND: [
      { OR: [{ managementSessionId: null }, { confirmedAt: { not: null } }] },
    ],
  };

  if (query.status) Object.assign(where, TRANSFER_STATUS_WHERE[query.status]);

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
  const [transfers, total, timeZone] = await Promise.all([
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
      orderBy: [{ transferredAt: "desc" }, { createdAt: "desc" }],
      skip: query.page * query.pageSize,
      take: query.pageSize,
    }),
    prisma.animalBatchTransfer.count({ where }),
    propertyTimeZone(propertyId),
  ]);

  return {
    data: transfers.map((t) => ({
      id: t.id,
      transferredAt: instantToZonedIso(t.transferredAt, timeZone),
      notes: t.notes,
      originBatches: originBatchNames(t),
      destinationBatch: t.destinationBatch,
      animalCount: t.items.length,
      status: transferStatus(t),
      confirmedAt: toZonedIso(t.confirmedAt, timeZone),
      cancelledAt: toZonedIso(t.cancelledAt, timeZone),
      updatedAt: toZonedIso(t.updatedAt, timeZone),
    })),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.ceil(total / query.pageSize),
  };
}
