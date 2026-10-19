import { z } from "zod";

// Datas sem hora (nascimento, compra, pesagem...) circulam sempre como texto "AAAA-MM-DD": no
// formulário, no JSON da API e nos schemas. Só viram Date na fronteira com o banco, e a conversão
// depende de como a coluna guarda o dia:
//
// - Colunas @db.Date (birthDate, withdrawalUntil, nextDueDate...): toDbDate/fromDbDate, em UTC,
//   que é como o Prisma lê e grava esse tipo.
// - Colunas timestamp que guardam um dia (purchaseDate, weighedAt, scheduledDate...): gravadas
//   à meia-noite local; toLocalDay/fromLocalDay, no fuso de quem executa (o servidor).
//
// Não vale para instantes (createdAt, deactivatedAt...), que são Date de verdade.

/** Data opcional: "AAAA-MM-DD" ou vazia. */
export const dateField = z
  .union([z.iso.date("Data inválida"), z.literal("")])
  .optional();

/** Data obrigatória: "AAAA-MM-DD". */
export const requiredDateField = z.iso.date("Data inválida");

/** "AAAA-MM-DD" → Date à meia-noite UTC, para gravar numa coluna @db.Date. */
export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** Date lido de uma coluna @db.Date → "AAAA-MM-DD". */
export function fromDbDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** "AAAA-MM-DD" → Date à meia-noite local, para gravar numa coluna timestamp que guarda um dia. */
export function toLocalDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** Date lido de uma coluna timestamp que guarda um dia → "AAAA-MM-DD" no fuso local. */
export function fromLocalDay(value: Date): string {
  return value.toLocaleDateString("en-CA");
}

/** Hoje como "AAAA-MM-DD", no fuso local. */
export function today(): string {
  return fromLocalDay(new Date());
}

/** "AAAA-MM-DD" → "DD/MM/AAAA", sem criar Date. */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
