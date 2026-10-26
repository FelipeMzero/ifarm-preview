import type { AnimalListResult, AnimalQuery } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { getOrAssignCurrentProperty } from "../../current-property/shared";
import { fromDbDate } from "@ifarm/domain/db-dates";

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

// Animais da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listAnimals(
  query: AnimalQuery,
  userId: string,
): Promise<AnimalListResult> {
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
  } = query;

  const propertyId =
    query.propertyId ?? (await getOrAssignCurrentProperty(userId))?.id;
  if (!propertyId) return { data: [], total: 0, pageCount: 0 };

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
    ...(batchId ? { currentBatchId: batchId === "none" ? null : batchId } : {}),
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

  return {
    data: animals.map((a) => ({
      id: a.id,
      code: a.code,
      earTag: a.currentTag,
      rfid: a.currentRfid,
      name: a.name,
      sex: a.sex,
      birthDate: a.birthDate ? fromDbDate(a.birthDate) : null,
      origin: a.origin,
      status: a.status,
      currentWeightKg: a.currentWeight?.toNumber() ?? null,
      currentBatch: a.currentBatch,
      updatedAt: a.updatedAt.toISOString(),
    })) as AnimalListResult["data"],
    total,
    pageCount: Math.ceil(total / pageSize),
  };
}
