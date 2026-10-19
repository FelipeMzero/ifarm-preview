import { z } from "zod";

// Datas sem hora (nascimento, compra, pesagem...) circulam sempre como texto "AAAA-MM-DD": no
// formulário, no JSON da API e nos schemas. Só viram Date na fronteira com o banco (colunas
// @db.Date), por toDbDate/fromDbDate, sempre em UTC; assim o fuso do servidor e o do navegador
// nunca mudam o dia.
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

/** "AAAA-MM-DD" → "DD/MM/AAAA", sem criar Date. */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
