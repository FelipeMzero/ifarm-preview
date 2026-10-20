import { z } from "zod";

// Datas sem hora (nascimento, compra, pesagem...) circulam sempre como texto "AAAA-MM-DD": no
// formulário, no JSON da API e nos schemas. Só viram Date na fronteira com o banco, e a conversão
// depende de como a coluna guarda o dia:
//
// - Colunas @db.Date (birthDate, withdrawalUntil, nextDueDate...): toDbDate/fromDbDate, em UTC,
//   que é como o Prisma lê e grava esse tipo.
// - Colunas timestamp que guardam um dia (purchaseDate, paidAt, lossDate...): gravadas
//   à meia-noite local; toLocalDay/fromLocalDay, no fuso de quem executa (o servidor).
//
// Não vale para instantes gravados pelo sistema (createdAt, deactivatedAt...), que são Date de
// verdade. Data e hora informadas pelo usuário (datas da sessão de manejo e da transferência) circulam como
// "AAAA-MM-DDTHH:mm", sem fuso, como o <input type="datetime-local"> entrega; o servidor as
// interpreta no fuso local (toLocalDateTime/fromLocalDateTime).

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

const pad = (n: number) => String(n).padStart(2, "0");

/** "AAAA-MM-DDTHH:mm" → Date nesse horário, no fuso local. */
export function toLocalDateTime(value: string): Date {
  // Data e hora sem fuso são interpretadas no fuso local (ECMAScript).
  return new Date(value);
}

/** Date → "AAAA-MM-DDTHH:mm" no fuso local (formato do <input type="datetime-local">). */
export function fromLocalDateTime(value: Date): string {
  return `${fromLocalDay(value)}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

/** Data e hora obrigatórias: "AAAA-MM-DDTHH:mm", existente no calendário. */
export const dateTimeField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e hora válidas.")
  .refine(
    (v) => fromLocalDateTime(toLocalDateTime(v)) === v,
    "Informe data e hora válidas.",
  );

/** Agora como "AAAA-MM-DDTHH:mm", no fuso local. */
export function nowDateTime(): string {
  return fromLocalDateTime(new Date());
}

/** Hoje como "AAAA-MM-DD", no fuso local. */
export function today(): string {
  return fromLocalDay(new Date());
}

/** "AAAA-MM-DDTHH:mm" → "DD/MM/AAAA HH:mm", sem criar Date. */
export function formatDateTime(value: string): string {
  return `${formatDate(value.slice(0, 10))} ${value.slice(11, 16)}`;
}

/**
 * Data e hora de um evento ("DD/MM/AAAA às HH:mm"). Registros antigos, gravados só com o dia,
 * vêm à meia-noite (ou sem hora); neles só a data é mostrada.
 */
export function formatEventDateTime(value: string): string {
  const time = value.slice(11, 16);
  const date = formatDate(value.slice(0, 10));
  return time && time !== "00:00" ? `${date} às ${time}` : date;
}

/** "AAAA-MM-DD" → "DD/MM/AAAA", sem criar Date. */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
