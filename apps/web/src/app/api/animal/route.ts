import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { uniqueConstraintErrors } from "../dbErrors";
import { animalCreateApiSchema, animalQuerySchema } from "../schemas";
import { getOrAssignCurrentProperty } from "../user/current-property/currentProperty";

// Limites de data de nascimento para cada faixa etária (idade em meses completos).
function birthDateFilter(range: "upTo12" | "12to24" | "over24" | "unknown") {
  if (range === "unknown") return null;
  const monthsAgo = (months: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - months);
    return d;
  };
  if (range === "upTo12") return { gt: monthsAgo(12) };
  if (range === "12to24") return { gt: monthsAgo(24), lte: monthsAgo(12) };
  return { lte: monthsAgo(24) };
}

export async function GET(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const validation = animalQuerySchema.safeParse(
      Object.fromEntries(searchParams),
    );

    if (!validation.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos." },
        { status: 400 },
      );
    }

    const {
      page,
      pageSize,
      search,
      status,
      sex,
      batchId,
      excludeBatchId,
      minWeight,
      maxWeight,
      neutered,
      ageRange,
      breedId,
      origin,
    } = validation.data;

    let propertyId = validation.data.propertyId;
    if (!propertyId) {
      propertyId = (await getOrAssignCurrentProperty(session.user.id))?.id;
    }

    if (!propertyId) {
      return NextResponse.json({ data: [], total: 0, pageCount: 0 });
    }

    const codeMatch = search.match(/^#?(\d{1,9})$/);
    const searchCode = codeMatch ? Number(codeMatch[1]) : null;

    const where = {
      currentPropertyId: propertyId,
      ...(search
        ? {
            OR: [
              {
                currentTag: { contains: search, mode: "insensitive" as const },
              },
              {
                currentRfid: { contains: search, mode: "insensitive" as const },
              },
              { name: { contains: search, mode: "insensitive" as const } },
              ...(searchCode != null ? [{ code: searchCode }] : []),
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(sex ? { sex } : {}),
      ...(batchId
        ? { currentBatchId: batchId === "none" ? null : batchId }
        : {}),
      ...(neutered ? { neutered: neutered === "true" } : {}),
      ...(breedId ? { breedId } : {}),
      ...(origin ? { origin } : {}),
      ...(ageRange ? { birthDate: birthDateFilter(ageRange) } : {}),
      // "<>" no SQL descarta NULL, então os animais sem lote precisam ser incluídos à parte.
      ...(excludeBatchId
        ? {
            AND: [
              {
                OR: [
                  { currentBatchId: null },
                  { currentBatchId: { not: excludeBatchId } },
                ],
              },
            ],
          }
        : {}),
      ...(minWeight != null || maxWeight != null
        ? {
            currentWeight: {
              ...(minWeight != null ? { gte: minWeight } : {}),
              ...(maxWeight != null ? { lte: maxWeight } : {}),
            },
          }
        : {}),
    };

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        include: { currentBatch: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
      }),
      prisma.animal.count({ where }),
    ]);

    return NextResponse.json({
      data: animals.map((a) => ({
        id: a.id,
        code: a.code,
        earTag: a.currentTag,
        rfid: a.currentRfid,
        name: a.name,
        sex: a.sex,
        birthDate: a.birthDate?.toISOString().slice(0, 10) ?? null,
        origin: a.origin,
        status: a.status,
        currentWeightKg: a.currentWeight?.toNumber() ?? null,
        currentBatch: a.currentBatch,
        updatedAt: a.updatedAt.toISOString(),
      })),
      total,
      pageCount: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { response, session } = await requireSession(RESOURCE_ACCESS.animais);
  if (response) return response;

  try {
    const body = await request.json();
    const validation = animalCreateApiSchema.safeParse(body);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field && !errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const data = validation.data;

    let propertyId = data.propertyId;
    if (!propertyId) {
      propertyId =
        (await getOrAssignCurrentProperty(session.user.id))?.id ?? null;
    }

    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: "Nenhuma propriedade selecionada." },
        { status: 400 },
      );
    }

    const batch = await prisma.batch.findFirst({
      where: { id: data.batchId, propertyId, closedAt: null },
      select: { id: true },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            batchId: "Lote inválido ou inativo para a propriedade selecionada.",
          },
        },
        { status: 400 },
      );
    }

    const entryDate = data.propertyEntryDate ?? new Date();

    const animal = await prisma.$transaction(async (tx) => {
      const created = await tx.animal.create({
        data: {
          currentTag: data.currentTag,
          currentRfid: data.currentRfid,
          name: data.name,
          sex: data.sex,
          origin: data.origin,
          status: "ACTIVE",
          birthDate: data.birthDate,
          breedId: data.breedId,
          currentBatchId: data.batchId,
          currentPropertyId: propertyId,
          currentWeight: data.currentWeightKg,
          neutered: data.neutered,
        },
      });

      await tx.animalPropertyHistory.create({
        data: {
          animalId: created.id,
          propertyId,
          enteredAt: entryDate,
        },
      });

      await tx.animalBatchHistory.create({
        data: {
          animalId: created.id,
          batchId: data.batchId,
          enteredAt: entryDate,
        },
      });

      if (data.currentWeightKg != null) {
        await tx.animalWeighing.create({
          data: {
            animalId: created.id,
            weight: data.currentWeightKg,
            weighedAt: entryDate,
          },
        });
      }

      if (data.currentTag != null) {
        await tx.animalTagging.create({
          data: {
            animalId: created.id,
            tag: data.currentTag,
            identifiedAt: entryDate,
          },
        });
      }

      if (data.currentRfid != null) {
        await tx.animalRfidTagging.create({
          data: {
            animalId: created.id,
            rfid: data.currentRfid,
            identifiedAt: entryDate,
          },
        });
      }

      if (data.neutered) {
        await tx.animalNeutering.create({
          data: {
            animalId: created.id,
            method: data.neuteringMethod,
            neuteredAt: data.neuteringDate ?? entryDate,
          },
        });
      }

      if (data.origin === "PURCHASE") {
        const purchaseEvent = await tx.purchaseEvent.create({
          data: {
            purchaseDate: data.acquisitionDate ?? entryDate,
            notes: data.purchaseNotes,
            confirmedAt: new Date(),
            pricingType: "LUMP_SUM",
            totalPrice: data.purchasePrice,
            sellerId: data.sellerId!,
            destinationPropertyId: propertyId,
            destinationBatchId: data.batchId,
          },
        });

        await tx.purchaseEventItem.create({
          data: {
            eventId: purchaseEvent.id,
            animalId: created.id,
            weight: data.currentWeightKg,
            tag: data.currentTag,
            rfid: data.currentRfid,
            sex: data.sex,
            birthDate: data.birthDate,
            breedId: data.breedId,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      { success: true, data: { id: animal.id } },
      { status: 201 },
    );
  } catch (error) {
    const errors = uniqueConstraintErrors(error);
    if (errors) {
      return NextResponse.json({ success: false, errors }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno no servidor." },
      { status: 500 },
    );
  }
}
