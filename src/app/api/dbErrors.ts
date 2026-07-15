import { Prisma } from "@/lib/prisma";

// const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
//   brinco: "Este brinco já está em uso.",
//   rfid: "Este RFID já está em uso.",
// };

export function uniqueConstraintErrors(error: unknown): Record<string, string> | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }

  // Com o driver adapter (@prisma/adapter-pg), `error.meta.target` não é
  // preenchido; o nome do campo vem aninhado no erro original do driver.
  const driverFields = (error.meta as any)?.driverAdapterError?.cause?.constraint?.fields as string[] | undefined;
  const target = (error.meta?.target as string[] | undefined) ?? driverFields ?? [];
  const errors: Record<string, string> = {};
  target.forEach((field) => {
    errors[field] = "Este valor já está em uso."; //errors[field] = UNIQUE_FIELD_MESSAGES[field] ?? "Este valor já está em uso.";
  });

  return Object.keys(errors).length ? errors : null;
}

// Exclusão condicionada (comum.md): registros referenciados por outra entidade (FK
// com onDelete: Restrict) não podem ser apagados. Retorna uma mensagem amigável em
// vez do erro cru do Postgres.
export function isReferencedElsewhereError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}
