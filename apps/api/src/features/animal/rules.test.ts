import { describe, expect, it } from "vitest";
import {
  animalDeletionBlocker,
  birthDateBounds,
  blockingConflicts,
  isStandalonePurchase,
  laterRecordsBlocker,
  previousVersions,
  sessionDateLock,
  updateCommitmentIntents,
} from "./rules";

describe("sessionDateLock", () => {
  it("bloqueia mudar a data de registro feito em sessão", () => {
    expect(
      sessionDateLock({ managementId: "s1" }, "2026-01-01T10:00", "pesagem"),
    ).toBe(
      "A data de uma pesagem feita em sessão de manejo não pode ser corrigida.",
    );
  });

  it("permite corrigir registro avulso ou sem nova data", () => {
    expect(
      sessionDateLock({ managementId: null }, "2026-01-01T10:00", "pesagem"),
    ).toBeNull();
    expect(
      sessionDateLock({ managementId: "s1" }, undefined, "pesagem"),
    ).toBeNull();
  });
});

describe("previousVersions", () => {
  const original = { id: 1, replacesId: null };
  const first = { id: 2, replacesId: 1 };
  const second = { id: 3, replacesId: 2 };
  const other = { id: 4, replacesId: null };
  const all = [original, first, second, other];

  it("devolve a cadeia de correções, da mais recente para a original", () => {
    expect(previousVersions(second, all)).toEqual([first, original]);
  });

  it("registro nunca corrigido não tem versões anteriores", () => {
    expect(previousVersions(original, all)).toEqual([]);
    expect(previousVersions(other, all)).toEqual([]);
  });

  it("sem os registros anteriores carregados, para na cadeia", () => {
    expect(previousVersions(second, [second])).toEqual([]);
  });
});

describe("updateCommitmentIntents", () => {
  it("sem troca de lote nem registros novos, nada a checar", () => {
    expect(
      updateCommitmentIntents({
        newBatchId: undefined,
        newTag: undefined,
        newRfid: undefined,
        neuteredAt: undefined,
        newWeightKg: undefined,
      }),
    ).toEqual([]);
  });

  it("gera uma intenção por operação informada", () => {
    expect(
      updateCommitmentIntents({
        newBatchId: "b1",
        newTag: null, // remover o brinco também é um registro
        newRfid: "982000",
        neuteredAt: "2026-01-01T10:00",
        newWeightKg: 320,
      }),
    ).toEqual([
      { kind: "batchChange" },
      { kind: "record", type: "tag" },
      { kind: "record", type: "rfid" },
      { kind: "record", type: "neutering" },
      { kind: "record", type: "weighing" },
    ]);
  });
});

describe("blockingConflicts", () => {
  const transfer = {
    kind: "transfer" as const,
    id: "t1",
    destinationBatchName: "Engorda",
  };
  const weighingSession = {
    kind: "session" as const,
    id: "s1",
    title: "Pesagem",
    stepKeys: ["weighing"],
  };

  it("agrupa os animais pelo compromisso que bloqueia", () => {
    const groups = blockingConflicts(
      new Map([
        ["a", [transfer]],
        ["b", [transfer, weighingSession]],
        ["c", [weighingSession]],
      ]),
      { kind: "batchChange" },
    );
    expect(groups).toEqual([{ commitment: transfer, animalIds: ["a", "b"] }]);
  });

  it("avisos não bloqueiam", () => {
    const neuteringSession = { ...weighingSession, stepKeys: ["neutering"] };
    expect(
      blockingConflicts(new Map([["a", [neuteringSession]]]), {
        kind: "record",
        type: "neutering",
      }),
    ).toEqual([]);
  });
});

describe("isStandalonePurchase", () => {
  const event = { categories: 1, receptions: 1, purchasedAnimals: 1 };
  const session = {
    participants: 1,
    healthManagements: 0,
    animalBatchTransfers: 0,
    animalPropertyTransfers: 0,
    hasStepManagements: false,
  };

  it("compra avulsa: tudo em função de um só animal", () => {
    expect(isStandalonePurchase(event, session)).toBe(true);
  });

  it("qualquer coisa a mais deixa de ser avulsa", () => {
    expect(
      isStandalonePurchase({ ...event, purchasedAnimals: 2 }, session),
    ).toBe(false);
    expect(
      isStandalonePurchase(event, { ...session, hasStepManagements: true }),
    ).toBe(false);
    expect(isStandalonePurchase(event, { ...session, participants: 2 })).toBe(
      false,
    );
  });
});

describe("animalDeletionBlocker", () => {
  const fresh = {
    status: "ACTIVE",
    count: {
      animalPropertyHistories: 1,
      animalBatchHistories: 1,
      propertyTransferItems: 0,
      batchTransferItems: 0,
      managementParticipants: 0,
      healthManagementItems: 0,
      animalBrandings: 0,
      purchasedAnimals: 0,
    },
  };
  const withCount = (c: Partial<typeof fresh.count>) => ({
    ...fresh,
    count: { ...fresh.count, ...c },
  });

  it("cadastro recém-feito pode ser excluído", () => {
    expect(animalDeletionBlocker(fresh, false)).toBeNull();
  });

  it("animal que saiu do rebanho não é excluído", () => {
    expect(animalDeletionBlocker({ ...fresh, status: "SOLD" }, false)).toMatch(
      /saiu do rebanho/,
    );
  });

  it("compra avulsa traz uma participação própria", () => {
    const bought = withCount({
      purchasedAnimals: 1,
      managementParticipants: 1,
    });
    expect(animalDeletionBlocker(bought, true)).toBeNull();
    expect(animalDeletionBlocker(bought, false)).toMatch(
      /vinculado a uma compra/,
    );
    expect(
      animalDeletionBlocker(
        withCount({ purchasedAnimals: 1, managementParticipants: 2 }),
        true,
      ),
    ).toMatch(/manejos registrados/);
  });

  it("movimentações e manejos bloqueiam", () => {
    expect(
      animalDeletionBlocker(withCount({ animalBatchHistories: 2 }), false),
    ).toMatch(/movimentado/);
    expect(
      animalDeletionBlocker(withCount({ managementParticipants: 1 }), false),
    ).toMatch(/manejos registrados/);
  });
});

describe("laterRecordsBlocker", () => {
  it("um registro avulso de cada tipo é do cadastro", () => {
    expect(
      laterRecordsBlocker([
        [{ managementId: null }],
        [],
        [{ managementId: null }],
      ]),
    ).toBeNull();
  });

  it("mais de um, ou feito em sessão, indica manejo posterior", () => {
    expect(
      laterRecordsBlocker([[{ managementId: null }, { managementId: null }]]),
    ).toMatch(/manejos registrados/);
    expect(laterRecordsBlocker([[{ managementId: "m1" }]])).toMatch(
      /manejos registrados/,
    );
  });
});

describe("birthDateBounds", () => {
  it("conta os meses a partir do dia de hoje da propriedade", () => {
    expect(birthDateBounds("upTo12", "2026-10-26")).toEqual({
      after: "2025-10-26",
    });
    expect(birthDateBounds("12to24", "2026-10-26")).toEqual({
      after: "2024-10-26",
      upTo: "2025-10-26",
    });
    expect(birthDateBounds("over24", "2026-10-26")).toEqual({
      upTo: "2024-10-26",
    });
    expect(birthDateBounds("unknown", "2026-10-26")).toBeNull();
  });

  it("vira o ano e segue o calendário", () => {
    expect(birthDateBounds("upTo12", "2026-01-15")).toEqual({
      after: "2025-01-15",
    });
    expect(birthDateBounds("upTo12", "2028-02-29")).toEqual({
      after: "2027-03-01",
    });
  });
});
