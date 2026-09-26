import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, Prisma } from "@/lib/prisma";
import { FIELD_LIMITS } from "@/lib/field-limits";
import {
  effectiveRfidTagging,
  effectiveTagging,
} from "../management-session/effective";

type Tx = Prisma.TransactionClient;

// Brinco e RFID têm a mesma regra de histórico: cada troca é um registro, o valor
// atual do animal (currentTag/currentRfid) é o do registro válido mais recente, e as
// correções preservam o rastro (valor original na primeira correção, exclusão lógica).
export type IdentifierKind = "tag" | "rfid";

export const isIdentifierKind = (kind: string): kind is IdentifierKind =>
  kind === "tag" || kind === "rfid";

type IdentifierRecord = {
  id: number;
  value: string | null;
  original: string | null;
  notes: string | null;
  identifiedAt: Date;
  managementId: string | null;
  correctedAt: Date | null;
};

type IdentifierAdapter = {
  label: string;
  animalField: "currentTag" | "currentRfid";
  maxLength: number;
  list(tx: Tx, animalId: string): Promise<IdentifierRecord[]>;
  find(
    tx: Tx,
    animalId: string,
    recordId: number,
  ): Promise<IdentifierRecord | null>;
  update(
    tx: Tx,
    recordId: number,
    data: {
      value?: string | null;
      original?: string | null;
      notes?: string | null;
      identifiedAt?: Date;
      correctedAt?: Date;
      cancelledAt?: Date;
    },
  ): Promise<unknown>;
  create(
    tx: Tx,
    data: {
      animalId: string;
      value: string | null;
      notes: string | null;
      identifiedAt: Date;
    },
  ): Promise<unknown>;
};

const orderBy = [{ identifiedAt: "desc" as const }, { id: "desc" as const }];

const ADAPTERS: Record<IdentifierKind, IdentifierAdapter> = {
  tag: {
    label: "Brinco",
    animalField: "currentTag",
    maxLength: FIELD_LIMITS.animal.earTag,
    list: async (tx, animalId) =>
      (
        await tx.animalTagging.findMany({
          where: { animalId, cancelledAt: null, ...effectiveTagging },
          orderBy,
        })
      ).map((r) => ({ ...r, value: r.tag, original: r.originalTag })),
    find: async (tx, animalId, id) => {
      if (!Number.isInteger(id)) return null;
      const r = await tx.animalTagging.findFirst({
        where: { id, animalId, cancelledAt: null, ...effectiveTagging },
      });
      return r ? { ...r, value: r.tag, original: r.originalTag } : null;
    },
    update: (tx, id, { value, original, ...data }) =>
      tx.animalTagging.update({
        where: { id },
        data: {
          ...data,
          ...(value !== undefined ? { tag: value } : {}),
          ...(original !== undefined ? { originalTag: original } : {}),
        },
      }),
    create: (tx, { value, ...data }) =>
      tx.animalTagging.create({ data: { ...data, tag: value } }),
  },
  rfid: {
    label: "RFID",
    animalField: "currentRfid",
    maxLength: FIELD_LIMITS.animal.rfid,
    list: async (tx, animalId) =>
      (
        await tx.animalRfidTagging.findMany({
          where: { animalId, cancelledAt: null, ...effectiveRfidTagging },
          orderBy,
        })
      ).map((r) => ({ ...r, value: r.rfid, original: r.originalRfid })),
    find: async (tx, animalId, id) => {
      if (!Number.isInteger(id)) return null;
      const r = await tx.animalRfidTagging.findFirst({
        where: { id, animalId, cancelledAt: null, ...effectiveRfidTagging },
      });
      return r ? { ...r, value: r.rfid, original: r.originalRfid } : null;
    },
    update: (tx, id, { value, original, ...data }) =>
      tx.animalRfidTagging.update({
        where: { id },
        data: {
          ...data,
          ...(value !== undefined ? { rfid: value } : {}),
          ...(original !== undefined ? { originalRfid: original } : {}),
        },
      }),
    create: (tx, { value, ...data }) =>
      tx.animalRfidTagging.create({ data: { ...data, rfid: value } }),
  },
};

export function toIdentifierDto(r: IdentifierRecord) {
  return {
    id: r.id,
    date: r.identifiedAt.toISOString(),
    value: r.value,
    notes: r.notes,
    fromSession: r.managementId != null,
    correctedAt: r.correctedAt?.toISOString() ?? null,
    originalValue: r.original,
  };
}

class IdentifierError extends Error {
  constructor(
    message: string,
    public status = 400,
    public field?: string,
  ) {
    super(message);
  }
}

// O identificador atual passa a ser o do registro válido mais recente (null = removido).
async function recomputeCurrent(
  tx: Tx,
  kind: IdentifierKind,
  animalId: string,
) {
  const adapter = ADAPTERS[kind];
  const [latest] = await adapter.list(tx, animalId);
  const value = latest?.value ?? null;

  const animal = await tx.animal.findUniqueOrThrow({
    where: { id: animalId },
    select: { currentPropertyId: true, status: true },
  });
  if (value && animal.status === "ACTIVE") {
    const holder = await tx.animal.findFirst({
      where: {
        id: { not: animalId },
        currentPropertyId: animal.currentPropertyId,
        status: "ACTIVE",
        [adapter.animalField]: value,
      },
      select: { code: true },
    });
    if (holder) {
      throw new IdentifierError(
        `${adapter.label} ${value} já está em uso pelo animal de ID ${holder.code}.`,
        409,
        "value",
      );
    }
  }

  await tx.animal.update({
    where: { id: animalId },
    data: { [adapter.animalField]: value },
  });
}

function errorResponse(error: unknown) {
  if (error instanceof IdentifierError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        ...(error.field ? { errors: { [error.field]: error.message } } : {}),
      },
      { status: error.status },
    );
  }
  console.error(error);
  return NextResponse.json(
    { success: false, message: "Ocorreu um erro interno no servidor." },
    { status: 500 },
  );
}

export async function listIdentifiers(kind: IdentifierKind, animalId: string) {
  try {
    const records = await ADAPTERS[kind].list(prisma, animalId);
    return NextResponse.json(records.map(toIdentifierDto));
  } catch (error) {
    return errorResponse(error);
  }
}

const correctionSchema = z.object({
  // Vazio = o registro passa a ser de remoção do identificador.
  value: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
  date: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00`) : undefined)),
  notes: z
    .string()
    .optional()
    .transform((v) => v || null),
});

const recordNotFound = (kind: IdentifierKind) =>
  new IdentifierError(
    `Registro de ${ADAPTERS[kind].label} não encontrado.`,
    404,
  );

export async function correctIdentifier(
  kind: IdentifierKind,
  animalId: string,
  recordIdParam: string,
  body: unknown,
) {
  const adapter = ADAPTERS[kind];
  const validation = correctionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "Parâmetros inválidos." },
      { status: 400 },
    );
  }
  const data = validation.data;

  try {
    if (data.value && data.value.length > adapter.maxLength) {
      throw new IdentifierError(
        `Máximo de ${adapter.maxLength} caracteres`,
        400,
        "value",
      );
    }

    await prisma.$transaction(async (tx) => {
      const record = await adapter.find(tx, animalId, Number(recordIdParam));
      if (!record) throw recordNotFound(kind);

      if (data.date && record.managementId) {
        throw new IdentifierError(
          "A data de uma identificação feita em sessão de manejo segue a data da sessão.",
          400,
          "date",
        );
      }

      let identifiedAt: Date | undefined;
      if (data.date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (data.date > today) {
          throw new IdentifierError("A data não pode ser futura.", 400, "date");
        }
        // Troca só o dia e mantém o horário original, para não alterar a ordem
        // entre registros do mesmo dia.
        const original = record.identifiedAt;
        identifiedAt = new Date(data.date);
        identifiedAt.setHours(
          original.getHours(),
          original.getMinutes(),
          original.getSeconds(),
          original.getMilliseconds(),
        );
      }

      const valueChanged = data.value !== record.value;
      await adapter.update(tx, record.id, {
        value: data.value,
        notes: data.notes,
        ...(identifiedAt ? { identifiedAt } : {}),
        // Guarda o valor lançado originalmente só na primeira correção do valor.
        ...(valueChanged && record.original == null
          ? { original: record.value }
          : {}),
        correctedAt: new Date(),
      });

      await recomputeCurrent(tx, kind, animalId);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

const changeSchema = z.object({
  // Vazio/null = remover o identificador do animal.
  value: z
    .string()
    .trim()
    .nullish()
    .transform((v) => v || null),
  notes: z
    .string()
    .nullish()
    .transform((v) => v || null),
});

// Troca (ou remove) o identificador na hora: cria um registro avulso com a data de
// hoje, que passa a ser o mais recente.
export async function addIdentifier(
  kind: IdentifierKind,
  animalId: string,
  body: unknown,
) {
  const adapter = ADAPTERS[kind];
  const validation = changeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "Parâmetros inválidos." },
      { status: 400 },
    );
  }
  const { value, notes } = validation.data;

  try {
    if (value && value.length > adapter.maxLength) {
      throw new IdentifierError(
        `Máximo de ${adapter.maxLength} caracteres`,
        400,
        "value",
      );
    }

    await prisma.$transaction(async (tx) => {
      const animal = await tx.animal.findUnique({
        where: { id: animalId },
        select: { currentTag: true, currentRfid: true },
      });
      if (!animal) throw new IdentifierError("Animal não encontrado.", 404);

      const current = animal[adapter.animalField];
      if (value === current) {
        throw new IdentifierError(
          value
            ? `Este já é o ${adapter.label.toLowerCase()} atual do animal.`
            : `O animal já está sem ${adapter.label.toLowerCase()}.`,
          400,
          "value",
        );
      }

      await adapter.create(tx, {
        animalId,
        value,
        notes,
        identifiedAt: new Date(),
      });
      await recomputeCurrent(tx, kind, animalId);
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function cancelIdentifier(
  kind: IdentifierKind,
  animalId: string,
  recordIdParam: string,
) {
  try {
    await prisma.$transaction(async (tx) => {
      const record = await ADAPTERS[kind].find(
        tx,
        animalId,
        Number(recordIdParam),
      );
      if (!record) throw recordNotFound(kind);

      await ADAPTERS[kind].update(tx, record.id, { cancelledAt: new Date() });
      await recomputeCurrent(tx, kind, animalId);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
