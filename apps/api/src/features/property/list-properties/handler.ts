import type { PropertyListResult, PropertyQuery } from "@ifarm/shared";
import { prisma } from "@ifarm/db";

export async function listProperties({
  page,
  pageSize,
  search,
  status,
}: PropertyQuery): Promise<PropertyListResult> {
  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            {
              owner: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
    ...(status === "active" ? { deactivatedAt: null } : {}),
    ...(status === "inactive" ? { deactivatedAt: { not: null } } : {}),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { address: true, owner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    data: properties.map((p) => ({
      id: p.id,
      name: p.name,
      totalArea: p.totalArea?.toNumber() ?? null,
      city: p.address?.city ?? null,
      state: p.address?.state ?? null,
      ownerName: p.owner.name,
      deactivatedAt: p.deactivatedAt?.toISOString() ?? null,
      updatedAt: p.updatedAt.toISOString(),
    })),
    total,
    pageCount: Math.ceil(total / pageSize),
  };
}
