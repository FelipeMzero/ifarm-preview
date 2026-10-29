import {
  todayInZone,
  type AnimalListResult,
  type AnimalQuery,
} from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { fromDbDate, toDbDate } from "../../../lib/db-dates";
import { propertyTimeZone, toZonedIso } from "../../property/time-zone.public";
import { birthDateBounds, type AgeRange } from "../rules";

// Faixa etária → filtro da coluna birthDate (@db.Date), pela idade no dia de hoje da
// propriedade.
function birthDateFilter(range: AgeRange, timeZone: string) {
  const bounds = birthDateBounds(range, todayInZone(timeZone));
  if (!bounds) return null;
  return {
    ...(bounds.after ? { gt: toDbDate(bounds.after) } : {}),
    ...(bounds.upTo ? { lte: toDbDate(bounds.upTo) } : {}),
  };
}

// Animais da propriedade informada ou, sem ela, da propriedade atual do usuário.
export async function listAnimals(
  query: AnimalQuery,
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

  const { propertyId } = query;
  const timeZone = await propertyTimeZone(propertyId);
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
    ...(ageRange
      ? {
          birthDate: birthDateFilter(ageRange, timeZone),
        }
      : {}),
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
      birthDate: fromDbDate(a.birthDate),
      origin: a.origin,
      status: a.status,
      currentWeightKg: a.currentWeight?.toNumber() ?? null,
      currentBatch: a.currentBatch,
      updatedAt: toZonedIso(a.updatedAt, timeZone),
    })) as AnimalListResult["data"],
    total,
    pageCount: Math.ceil(total / pageSize),
  };
}
