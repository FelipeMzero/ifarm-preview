import "server-only";
import { z } from "zod";
import type {
  PropertyInput,
  PropertyListResult,
  PropertyOption,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { NotFoundError } from "../errors";

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type PropertyQuery = z.infer<typeof propertyQuerySchema>;

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

// Devolve a propriedade no mesmo formato do formulário, para edição e detalhes.
export async function getProperty(id: string): Promise<PropertyInput> {
  const property = await prisma.property.findUnique({
    where: { id },
    include: { address: true, owner: true },
  });
  if (!property) throw new NotFoundError("Propriedade não encontrada.");

  return {
    name: property.name,
    ownerId: property.ownerId,
    ownerName: property.owner.name,
    totalArea: property.totalArea?.toString() ?? "",
    productiveArea: property.productiveArea?.toString() ?? "",
    cib: property.cib ?? "",
    ccir: property.ccir ?? "",
    car: property.car ?? "",
    latitude: property.latitude?.toString() ?? "",
    longitude: property.longitude?.toString() ?? "",
    zipCode: property.address?.zipCode ?? "",
    street: property.address?.street ?? "",
    number: property.address?.number ?? "",
    complement: property.address?.complement ?? "",
    neighborhood: property.address?.neighborhood ?? "",
    city: property.address?.city ?? "",
    state: property.address?.state ?? "",
  };
}

// Lista enxuta para o seletor de propriedade atual: só as ativas.
export async function listPropertyOptions(): Promise<PropertyOption[]> {
  return prisma.property.findMany({
    where: { deactivatedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
