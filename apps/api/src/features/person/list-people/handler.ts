import type { PersonListResult, PersonQuery, PersonRow } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

export async function listPeople({
  page,
  pageSize,
  search,
  type,
  status,
}: PersonQuery): Promise<PersonListResult> {
  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { taxId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(type ? { type } : {}),
    ...(status === "active" ? { deactivatedAt: null } : {}),
    ...(status === "inactive" ? { deactivatedAt: { not: null } } : {}),
  };

  const [people, total] = await Promise.all([
    prisma.person.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.person.count({ where }),
  ]);

  const data: PersonRow[] = people.map((p) => ({
    id: p.id,
    type: p.type,
    taxId: p.taxId,
    name: p.name,
    phone: p.phone,
    email: p.email,
    deactivatedAt: p.deactivatedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return { data, total, pageCount: Math.ceil(total / pageSize) };
}
