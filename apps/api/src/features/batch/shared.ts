import { toDbDate } from "../../lib/db-dates";

// Usados por mais de uma operação de lote.

export const toTargetDate = (v?: string) => (v ? toDbDate(v) : null);
