import { z } from "zod";

// Três tipos de data, que circulam como texto e só viram Date na fronteira com o banco:
//
// - Só o dia (colunas @db.Date: birthDate, purchaseDate, paymentDate...): "AAAA-MM-DD";
//   toDbDate/fromDbDate, em UTC, que é como o Prisma lê e grava esse tipo.
// - Data e hora informadas pelo usuário (manejos, transferências, perdas, abates):
//   "AAAA-MM-DDTHH:mm", sem fuso, como o <input type="datetime-local"> entrega; o servidor as
//   interpreta no fuso local (toLocalDateTime/fromLocalDateTime).
// - Instantes gravados pelo sistema (createdAt, confirmedAt...): Date de verdade.
//
// toLocalDay/fromLocalDay tratam um dia no fuso local: "hoje", o dia de um instante (ex.: comparar
// um manejo com o nascimento) e cálculos de tela (idade, gráficos).

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

/** "AAAA-MM-DD" → Date à meia-noite local (ex.: cálculo de idade, eixo de gráfico). */
export function toLocalDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** Date → o dia dele ("AAAA-MM-DD") no fuso local. */
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

/** "AAAA-MM-DDTHH:mm" → "DD/MM/AAAA às HH:mm", sem criar Date. */
export function formatEventDateTime(value: string): string {
  return `${formatDate(value.slice(0, 10))} às ${value.slice(11, 16)}`;
}

/** "AAAA-MM-DD" → "DD/MM/AAAA", sem criar Date. */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
