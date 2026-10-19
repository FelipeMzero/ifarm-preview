import { describe, expect, test } from "vitest";
import {
  blockingReason,
  conflictsFor,
  describeCommitment,
  type Commitment,
  type CommitmentIntent,
} from "./commitments";

const reception: Commitment = { kind: "reception", id: "r", title: "Carga 1" };
const transfer: Commitment = {
  kind: "transfer",
  id: "t",
  destinationBatchName: "Engorda",
};
const session = (...stepKeys: string[]): Commitment => ({
  kind: "session",
  id: "s",
  title: "Manejo",
  stepKeys,
});

function severity(commitment: Commitment, intent: CommitmentIntent) {
  return conflictsFor([commitment], intent)[0]?.severity ?? null;
}

describe("recepção aberta", () => {
  test.each<CommitmentIntent>([
    { kind: "session", stepKeys: ["weighing"] },
    { kind: "transfer" },
    { kind: "batchChange" },
    { kind: "record", type: "weighing" },
    { kind: "record", type: "neutering" },
  ])("bloqueia qualquer outra operação: %o", (intent) => {
    expect(severity(reception, intent)).toBe("block");
  });

  test.each([reception, transfer, session("weighing")])(
    "consolidar a recepção bloqueia se o animal está em outra operação: %o",
    (commitment) => {
      expect(severity(commitment, { kind: "reception" })).toBe("block");
    },
  );
});

describe("sessão aberta", () => {
  test.each(["neutering", "tag", "rfid", "batch", "health:vacina-a"])(
    "mesma etapa exclusiva (%s) em outra sessão bloqueia",
    (key) => {
      expect(severity(session(key), { kind: "session", stepKeys: [key] })).toBe(
        "block",
      );
    },
  );

  test("pesagem em duas sessões é permitida", () => {
    const intent = { kind: "session", stepKeys: ["weighing"] } as const;
    expect(severity(session("weighing"), intent)).toBeNull();
  });

  test("etapas diferentes podem coexistir", () => {
    const intent = { kind: "session", stepKeys: ["weighing", "tag"] } as const;
    expect(severity(session("neutering", "rfid"), intent)).toBeNull();
  });

  test("procedimentos sanitários diferentes podem coexistir", () => {
    const intent = { kind: "session", stepKeys: ["health:vacina-b"] } as const;
    expect(severity(session("health:vacina-a"), intent)).toBeNull();
  });

  test("apartação bloqueia transferência e troca direta de lote", () => {
    expect(severity(session("batch"), { kind: "transfer" })).toBe("block");
    expect(severity(session("batch"), { kind: "batchChange" })).toBe("block");
  });

  test("sem apartação não impede transferência nem troca de lote", () => {
    expect(severity(session("neutering"), { kind: "transfer" })).toBeNull();
    expect(severity(session("neutering"), { kind: "batchChange" })).toBeNull();
  });

  test("registro avulso da mesma etapa só avisa", () => {
    expect(
      severity(session("neutering"), { kind: "record", type: "neutering" }),
    ).toBe("warn");
    expect(severity(session("tag"), { kind: "record", type: "tag" })).toBe(
      "warn",
    );
  });

  test("pesagem avulsa não avisa", () => {
    expect(
      severity(session("weighing"), { kind: "record", type: "weighing" }),
    ).toBeNull();
  });

  test("registro avulso de outra etapa não avisa", () => {
    expect(
      severity(session("neutering"), { kind: "record", type: "tag" }),
    ).toBeNull();
  });
});

describe("transferência pendente", () => {
  test("bloqueia outra transferência e troca direta de lote", () => {
    expect(severity(transfer, { kind: "transfer" })).toBe("block");
    expect(severity(transfer, { kind: "batchChange" })).toBe("block");
  });

  test("bloqueia sessão com apartação", () => {
    expect(
      severity(transfer, { kind: "session", stepKeys: ["weighing", "batch"] }),
    ).toBe("block");
  });

  test("não impede sessão sem apartação nem registros avulsos", () => {
    expect(
      severity(transfer, { kind: "session", stepKeys: ["neutering"] }),
    ).toBeNull();
    expect(severity(transfer, { kind: "record", type: "tag" })).toBeNull();
  });
});

test("devolve só os compromissos em conflito", () => {
  const conflicts = conflictsFor(
    [session("weighing"), session("neutering"), transfer],
    { kind: "session", stepKeys: ["neutering"] },
  );
  expect(conflicts).toHaveLength(1);
  expect(conflicts[0].commitment).toEqual(session("neutering"));
});

test("a descrição cita só as etapas em conflito", () => {
  expect(
    describeCommitment(session("weighing", "neutering"), {
      kind: "session",
      stepKeys: ["neutering"],
    }),
  ).toBe('sessão de manejo "Manejo" (castração)');
  expect(describeCommitment(transfer)).toBe(
    'transferência pendente para o lote "Engorda"',
  );
});

test("motivo do bloqueio ignora avisos e junta os bloqueios", () => {
  expect(
    blockingReason([session("neutering")], {
      kind: "record",
      type: "neutering",
    }),
  ).toBeNull();
  expect(
    blockingReason([transfer, session("batch")], { kind: "batchChange" }),
  ).toBe(
    'transferência pendente para o lote "Engorda"; sessão de manejo "Manejo" (apartação)',
  );
});
