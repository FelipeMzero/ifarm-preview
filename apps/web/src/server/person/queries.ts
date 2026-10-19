import "server-only";
import { z } from "zod";
import {
  fromDbDate,
  PersonType,
  type PersonInput,
  type PersonListResult,
  type PersonRow,
} from "@ifarm/shared";
import { prisma } from "@/server/db";
import { NotFoundError } from "../errors";

export const personQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search: z.string().trim().optional().default(""),
  type: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(PersonType).optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["active", "inactive"]).optional(),
  ),
});

export type PersonQuery = z.infer<typeof personQuerySchema>;

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

// Devolve a pessoa no mesmo formato do formulário, para edição e detalhes.
export async function getPerson(id: string): Promise<PersonInput> {
  const person = await prisma.person.findUnique({
    where: { id },
    include: { address: true },
  });
  if (!person) throw new NotFoundError("Pessoa não encontrada.");

  return {
    type: person.type,
    taxId: person.taxId,
    name: person.name,
    stateRegistration: person.stateRegistration ?? "",
    phone: person.phone ?? "",
    email: person.email ?? "",
    tradeName: person.tradeName ?? "",
    rg: person.rg ?? "",
    birthDate: person.birthDate ? fromDbDate(person.birthDate) : "",
    maritalStatus: person.maritalStatus ?? "",
    zipCode: person.address?.zipCode ?? "",
    street: person.address?.street ?? "",
    number: person.address?.number ?? "",
    complement: person.address?.complement ?? "",
    neighborhood: person.address?.neighborhood ?? "",
    city: person.address?.city ?? "",
    state: person.address?.state ?? "",
  };
}
