import { Prisma } from "@/lib/prisma";

// const UNIQUE_FIELD_MESSAGES: Record<string, string> = {
//   brinco: "Este brinco já está em uso.",
//   rfid: "Este RFID já está em uso.",
// };

export function uniqueConstraintErrors(
  error: unknown,
): Record<string, string> | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return null;
  }

  // Com o driver adapter (@prisma/adapter-pg), `error.meta.target` não é
  // preenchido; o nome do campo vem aninhado no erro original do driver.
  const driverFields = (error.meta as any)?.driverAdapterError?.cause
    ?.constraint?.fields as string[] | undefined;
  const target =
    (error.meta?.target as string[] | undefined) ?? driverFields ?? [];
  const errors: Record<string, string> = {};
  target.forEach((field) => {
    errors[field] = "Este valor já está em uso."; //errors[field] = UNIQUE_FIELD_MESSAGES[field] ?? "Este valor já está em uso.";
  });

  return Object.keys(errors).length ? errors : null;
}

// Registros referenciados por outra entidade (FK
// com onDelete: Restrict) não podem ser apagados. O nome da constraint segue o padrão
// do Prisma "{tabela}_{coluna}_fkey", o que permite identificar qual relação bloqueou.
const REFERENCING_CONSTRAINT_LABELS: Record<string, string> = {
  property_owner_id_fkey: "propriedades vinculadas",
  area_property_id_fkey: "áreas vinculadas",
  animal_breed_id_fkey: "animais vinculados",
  animal_batch_id_fkey: "animais vinculados",
  animal_mother_id_fkey: "animais vinculados (como mãe)",
  animal_father_id_fkey: "animais vinculados (como pai)",
  animal_origin_property_id_fkey: "animais vinculados (fazenda de origem)",
};

export function referencedElsewhereMessage(error: unknown): string | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2003"
  ) {
    return null;
  }

  const constraintName = (error.meta as any)?.driverAdapterError?.cause
    ?.constraint?.index as string | undefined;
  const label = constraintName
    ? REFERENCING_CONSTRAINT_LABELS[constraintName]
    : undefined;

  return label
    ? `Não é possível excluir: existem ${label} a este registro.`
    : "Não é possível excluir: este registro está em uso em outro lugar";
}
