import { describe, expect, it } from "vitest";
import type { PurchaseCategoryData } from "@ifarm/shared";
import {
  cancellationBlocker,
  consolidationBlocker,
  costShares,
  estimatedBirthDay,
  estimatedCategoryValue,
  paymentBlocker,
  planCategoryChanges,
  splitValue,
  sumIfAllKnown,
} from "./rules";

const OPEN = { confirmedAt: null, cancelledAt: null, paymentDate: null };
const PAID = { ...OPEN, paymentDate: new Date("2026-01-10") };
const DONE = new Date("2026-01-20");

const saved = (id: number, receivedAnimals = 0) => ({
  id,
  receivedAnimals,
  pricingType: "PER_HEAD",
  unitPrice: 1000,
  totalPrice: null,
  invoicedWeight: null,
  shrinkPercent: null,
});

const next = (id: number | undefined, unitPrice = 1000) =>
  ({
    id,
    pricingType: "PER_HEAD",
    unitPrice,
    totalPrice: null,
    invoicedWeight: null,
    shrinkPercent: null,
  }) as unknown as PurchaseCategoryData;

const unpaid = { paid: false, sellerChanged: false };
const paid = { paid: true, sellerChanged: false };

describe("planCategoryChanges", () => {
  it("separa as categorias removidas das que já existiam", () => {
    const plan = planCategoryChanges(
      [saved(1), saved(2)],
      [next(1), next(undefined)],
      unpaid,
    );
    expect(plan.removedIds).toEqual([2]);
    expect([...plan.existingIds]).toEqual([1, 2]);
  });

  it("não remove categoria com animais recebidos", () => {
    expect(() =>
      planCategoryChanges([saved(1), saved(2, 3)], [next(1)], unpaid),
    ).toThrow(
      "Não é possível remover categorias com animais recebidos (3 animal(is)).",
    );
  });

  it("depois do pagamento, bloqueia vendedor, conjunto e valores", () => {
    const blocked = "A compra já foi paga";
    expect(() =>
      planCategoryChanges([saved(1)], [next(1)], {
        ...paid,
        sellerChanged: true,
      }),
    ).toThrow(blocked);
    expect(() =>
      planCategoryChanges([saved(1)], [next(1), next(undefined)], paid),
    ).toThrow(blocked);
    expect(() =>
      planCategoryChanges([saved(1), saved(2)], [next(1)], paid),
    ).toThrow(blocked);
    expect(() =>
      planCategoryChanges([saved(1)], [next(1, 1200)], paid),
    ).toThrow(blocked);
  });

  it("depois do pagamento, aceita mudança que não altera valores", () => {
    expect(planCategoryChanges([saved(1)], [next(1)], paid).removedIds).toEqual(
      [],
    );
  });
});

describe("paymentBlocker", () => {
  it("só paga compra em andamento e ainda não paga", () => {
    expect(paymentBlocker(OPEN)).toBeNull();
    expect(paymentBlocker(PAID)).not.toBeNull();
    expect(paymentBlocker({ ...OPEN, confirmedAt: DONE })).not.toBeNull();
    expect(paymentBlocker({ ...OPEN, cancelledAt: DONE })).not.toBeNull();
  });
});

describe("consolidationBlocker", () => {
  const ready = { ...PAID, receivedAnimals: 5, openReceptions: 0 };

  it("consolida compra paga, com animais e sem recepções abertas", () => {
    expect(consolidationBlocker(ready)).toBeNull();
  });

  it("explica o primeiro impedimento", () => {
    expect(consolidationBlocker({ ...ready, cancelledAt: DONE })).toMatch(
      /em andamento/,
    );
    expect(consolidationBlocker({ ...ready, paymentDate: null })).toMatch(
      /Registre o pagamento/,
    );
    expect(consolidationBlocker({ ...ready, receivedAnimals: 0 })).toMatch(
      /não tem animais recebidos/,
    );
    expect(consolidationBlocker({ ...ready, openReceptions: 2 })).toBe(
      "Há 2 recepção(ões) em aberto. Conclua ou cancele antes de consolidar.",
    );
  });
});

describe("cancellationBlocker", () => {
  it("cancela compra em andamento, não paga e sem animais", () => {
    expect(cancellationBlocker({ ...OPEN, receivedAnimals: 0 })).toBeNull();
  });

  it("bloqueia compra cancelada, consolidada, paga ou com animais", () => {
    expect(
      cancellationBlocker({ ...OPEN, cancelledAt: DONE, receivedAnimals: 0 }),
    ).toMatch(/já está cancelada/);
    expect(
      cancellationBlocker({ ...OPEN, confirmedAt: DONE, receivedAnimals: 0 }),
    ).toMatch(/consolidada/);
    expect(cancellationBlocker({ ...PAID, receivedAnimals: 0 })).toMatch(
      /paga/,
    );
    expect(cancellationBlocker({ ...OPEN, receivedAnimals: 2 })).toMatch(
      /2 animal\(is\) recebido\(s\)/,
    );
  });
});

describe("estimatedBirthDay", () => {
  it("volta os meses de idade a partir do dia da recepção", () => {
    expect(estimatedBirthDay("2026-06-15", 18)).toBe("2024-12-15");
    expect(estimatedBirthDay("2026-01-31", 0)).toBe("2026-01-31");
  });

  it("sem o dia no mês de destino, usa o último dia dele", () => {
    expect(estimatedBirthDay("2026-03-31", 1)).toBe("2026-02-28");
    expect(estimatedBirthDay("2024-03-31", 1)).toBe("2024-02-29");
    expect(estimatedBirthDay("2026-05-31", 1)).toBe("2026-04-30");
    expect(estimatedBirthDay("2026-02-28", 12)).toBe("2025-02-28");
  });

  it("volta anos quando a idade passa de janeiro", () => {
    expect(estimatedBirthDay("2026-01-31", 1)).toBe("2025-12-31");
    expect(estimatedBirthDay("2026-02-15", 26)).toBe("2023-12-15");
  });
});

const dec = (n: number) => ({ toNumber: () => n }) as never;

describe("estimatedCategoryValue", () => {
  const perHead = {
    pricingType: "PER_HEAD",
    unitPrice: dec(1000),
    totalPrice: null,
    invoicedWeight: null,
    shrinkPercent: null,
    expectedQuantity: 10,
  };

  it("em andamento, por cabeça conta os esperados", () => {
    expect(estimatedCategoryValue(perHead, false, 4)).toBe(10000);
  });

  it("consolidada, por cabeça conta os recebidos", () => {
    expect(estimatedCategoryValue(perHead, true, 4)).toBe(4000);
  });
});

describe("sumIfAllKnown", () => {
  it("soma quando todos são conhecidos", () => {
    expect(sumIfAllKnown([1, 2.5, 3])).toBe(6.5);
    expect(sumIfAllKnown([])).toBe(0);
  });

  it("sem algum valor, não há soma", () => {
    expect(sumIfAllKnown([1, null, 3])).toBeNull();
  });
});

describe("costShares", () => {
  it("valor fechado com divisão igual: partes iguais", () => {
    expect(
      costShares({ pricingType: "LUMP_SUM", costSplit: "EQUAL" }, [300, null]),
    ).toEqual([1, 1]);
  });

  it("por arroba (mesmo com o padrão EQUAL) é pelo peso; sem pesagem, entra a média", () => {
    expect(
      costShares({ pricingType: "PER_ARROBA", costSplit: "EQUAL" }, [
        300,
        null,
        500,
      ]),
    ).toEqual([300, 400, 500]);
    expect(
      costShares(
        { pricingType: "LUMP_SUM", costSplit: "BY_WEIGHT" },
        [200, 400],
      ),
    ).toEqual([200, 400]);
  });

  it("sem nenhuma pesagem, partes iguais", () => {
    expect(
      costShares({ pricingType: "PER_ARROBA", costSplit: "EQUAL" }, [
        null,
        null,
      ]),
    ).toEqual([1, 1]);
  });
});

describe("splitValue", () => {
  it("divide na proporção", () => {
    expect(splitValue(1000, [1, 3])).toEqual([250, 750]);
  });

  it("a soma bate em centavos, com a sobra no último", () => {
    const parts = splitValue(100, [1, 1, 1]);
    expect(parts).toEqual([33.33, 33.33, 33.34]);
    expect(Math.round(parts.reduce((s, p) => s + p, 0) * 100)).toBe(10000);
  });
});
