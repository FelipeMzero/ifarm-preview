// Colunas só de dia (@db.Date: birthDate, purchaseDate, paymentDate...): o Prisma as lê e
// grava como Date à meia-noite UTC. Fora do banco o dia circula como "AAAA-MM-DD" (ver
// packages/shared/src/date.ts).

/** "AAAA-MM-DD" → Date à meia-noite UTC, para gravar numa coluna @db.Date. */
export function toDbDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** Date lido de uma coluna @db.Date → "AAAA-MM-DD" (coluna vazia → null). */
export function fromDbDate(value: Date): string;
export function fromDbDate(value: Date | null | undefined): string | null;
export function fromDbDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
