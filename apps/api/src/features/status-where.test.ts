import { describe, expect, it } from "vitest";
import { isSessionOpen } from "@ifarm/shared";
import { TRANSFER_STATUS_WHERE, transferStatus } from "./batch-transfer/rules";
import { SESSION_STATUS_WHERE } from "./management-session/rules";
import {
  PURCHASE_STATUS_WHERE,
  purchaseStatus,
} from "./purchase/status.public";
import { sessionStatus } from "./management-session/session-steps.public";

// Os filtros de situação das listagens (`*_STATUS_WHERE`) repetem, em forma de consulta,
// as funções que dão a situação de um registro. Este teste garante que as duas formas
// concordam em todas as combinações de datas.

type Row = Record<string, Date | null>;
type Where = Record<string, null | { not: null }>;

// Avalia um filtro simples do Prisma (campo nulo ou não nulo) sobre uma linha.
const matches = (where: Where, row: Row) =>
  Object.entries(where).every(([field, cond]) =>
    cond === null ? row[field] === null : row[field] !== null,
  );

// Todas as combinações de preenchido/vazio dos campos.
function rows(fields: string[]): Row[] {
  return fields.reduce<Row[]>(
    (acc, field) =>
      acc.flatMap((r) => [
        { ...r, [field]: null },
        { ...r, [field]: new Date("2026-01-01") },
      ]),
    [{}],
  );
}

describe("filtros de situação", () => {
  it("compra: cada filtro pega exatamente as compras naquela situação", () => {
    for (const row of rows(["confirmedAt", "cancelledAt"])) {
      const status = purchaseStatus(row as never);
      for (const s of ["open", "confirmed", "cancelled"] as const) {
        expect(matches(PURCHASE_STATUS_WHERE[s], row)).toBe(status === s);
      }
      expect(matches(PURCHASE_STATUS_WHERE.all, row)).toBe(
        status !== "cancelled",
      );
    }
  });

  it("transferência: cada filtro pega exatamente as transferências naquela situação", () => {
    for (const row of rows(["confirmedAt", "cancelledAt"])) {
      const status = transferStatus(row as never);
      for (const s of ["pending", "confirmed", "cancelled"] as const) {
        expect(matches(TRANSFER_STATUS_WHERE[s], row)).toBe(status === s);
      }
    }
  });

  it("sessão: cada filtro pega exatamente as sessões naquela situação", () => {
    for (const row of rows(["performedAt", "confirmedAt", "cancelledAt"])) {
      const status = sessionStatus(row as never);
      for (const s of [
        "planned",
        "in_progress",
        "confirmed",
        "cancelled",
      ] as const) {
        expect(matches(SESSION_STATUS_WHERE[s], row)).toBe(status === s);
      }
      expect(matches(SESSION_STATUS_WHERE.open, row)).toBe(
        isSessionOpen(status),
      );
    }
  });
});
