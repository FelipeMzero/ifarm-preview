import { describe, expect, it } from "vitest";
import { blockedTransferAnimals, enteredAfter } from "./rules";

const animal = (
  id: string,
  overrides: Partial<{
    status: "ACTIVE" | "SOLD";
    currentPropertyId: string;
    currentBatchId: string | null;
  }> = {},
) => ({
  id,
  status: "ACTIVE" as const,
  currentPropertyId: "p1",
  currentBatchId: "origem",
  ...overrides,
});

describe("blockedTransferAnimals", () => {
  it("aceita animais ativos na propriedade, de qualquer lote ou de nenhum", () => {
    const result = blockedTransferAnimals(
      [animal("a"), animal("b", { currentBatchId: null })],
      "p1",
      "destino",
    );
    expect(result).toEqual({ unavailable: [], alreadyInDestination: [] });
  });

  it("separa os indisponíveis dos que já estão no destino", () => {
    const { unavailable, alreadyInDestination } = blockedTransferAnimals(
      [
        animal("vendido", { status: "SOLD" }),
        animal("outra-prop", { currentPropertyId: "p2" }),
        animal("no-destino", { currentBatchId: "destino" }),
        animal("ok"),
      ],
      "p1",
      "destino",
    );
    expect(unavailable.map((a) => a.id)).toEqual(["vendido", "outra-prop"]);
    expect(alreadyInDestination.map((a) => a.id)).toEqual(["no-destino"]);
  });

  it("indisponível tem prioridade sobre já estar no destino", () => {
    const { unavailable, alreadyInDestination } = blockedTransferAnimals(
      [animal("x", { status: "SOLD", currentBatchId: "destino" })],
      "p1",
      "destino",
    );
    expect(unavailable).toHaveLength(1);
    expect(alreadyInDestination).toHaveLength(0);
  });
});

describe("enteredAfter", () => {
  it("aponta quem entrou no lote atual depois da data da transferência", () => {
    const at = new Date("2026-03-10T12:00:00Z");
    const histories = [
      { id: 1, enteredAt: new Date("2026-03-01T00:00:00Z") },
      { id: 2, enteredAt: at },
      { id: 3, enteredAt: new Date("2026-03-11T00:00:00Z") },
    ];
    expect(enteredAfter(histories, at).map((h) => h.id)).toEqual([3]);
  });

  it("aceita a data de cada animal (apartação: cada um na sua hora)", () => {
    const histories = [
      { id: 1, enteredAt: new Date("2026-03-10T08:00:00Z") },
      { id: 2, enteredAt: new Date("2026-03-10T08:00:00Z") },
    ];
    const movedAt = (h: { id: number }) =>
      new Date(h.id === 1 ? "2026-03-10T07:00:00Z" : "2026-03-10T09:00:00Z");
    expect(enteredAfter(histories, movedAt).map((h) => h.id)).toEqual([1]);
  });
});
