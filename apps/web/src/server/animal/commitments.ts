import "server-only";
import { BusinessError } from "@/server/errors";
import { Prisma } from "@/server/db";
import {
  conflictsFor,
  describeCommitment,
  type Commitment,
  type CommitmentExclusion,
  type CommitmentIntent,
} from "@ifarm/shared";
import { sessionStepsSelect, stepKey, toSessionSteps } from "@ifarm/shared";
import { animalLabel, summarize } from "@ifarm/shared";

// Compromissos pendentes dos animais (regras em packages/shared/src/animal/commitments.ts e em
// docs/data-dictionary.md, seção 2.9).

type Tx = Prisma.TransactionClient;

// Conflito de compromisso: o animal já está em outra operação. Apresentado no campo dos
// animais do formulário.
export class CommitmentError extends BusinessError {
  constructor(message: string) {
    super(message, 409, "animalIds");
  }
}

// Trava as linhas dos animais até o fim da transação: duas operações incluindo o
// mesmo animal ao mesmo tempo passam a checar uma depois da outra. A ordem fixa
// evita deadlock entre transações que travam os mesmos animais.
export async function lockAnimals(tx: Tx, animalIds: string[]) {
  if (!animalIds.length) return;
  await tx.$queryRaw`
    SELECT id FROM animal WHERE id = ANY(${animalIds}::uuid[]) ORDER BY id FOR UPDATE
  `;
}

// Compromissos abertos de cada animal (só os animais que têm algum).
export async function findCommitments(
  tx: Tx,
  animalIds: string[],
  exclude: CommitmentExclusion = {},
) {
  const byAnimal = new Map<string, Commitment[]>();
  if (!animalIds.length) return byAnimal;

  // Parte das operações abertas (sempre poucas, achadas pelos índices parciais
  // *_open_idx) e só então cruza com os animais pelos índices (operação, animal).
  // Partir dos animais leria todo o histórico de participações deles.
  const [sessions, transfers] = await Promise.all([
    tx.managementSession.findMany({
      where: {
        confirmedAt: null,
        cancelledAt: null,
        ...(exclude.sessionId ? { id: { not: exclude.sessionId } } : {}),
      },
      select: {
        id: true,
        title: true,
        steps: sessionStepsSelect,
        purchaseReception: { select: { id: true } },
      },
    }),
    // A transferência da apartação pertence à sessão e já conta como a etapa dela.
    tx.animalBatchTransfer.findMany({
      where: {
        confirmedAt: null,
        cancelledAt: null,
        managementSessionId: null,
        ...(exclude.transferId ? { id: { not: exclude.transferId } } : {}),
      },
      select: { id: true, destinationBatch: { select: { name: true } } },
    }),
  ]);

  const [participations, transferItems] = await Promise.all([
    sessions.length
      ? tx.managementParticipant.findMany({
          where: {
            managementSessionId: { in: sessions.map((s) => s.id) },
            animalId: { in: animalIds },
          },
          select: { animalId: true, managementSessionId: true },
        })
      : [],
    transfers.length
      ? tx.animalBatchTransferItem.findMany({
          where: {
            transferId: { in: transfers.map((t) => t.id) },
            animalId: { in: animalIds },
          },
          select: { animalId: true, transferId: true },
        })
      : [],
  ]);

  const sessionCommitments = new Map<string, Commitment>(
    sessions.map((s) => [
      s.id,
      s.purchaseReception
        ? { kind: "reception", id: s.id, title: s.title }
        : {
            kind: "session",
            id: s.id,
            title: s.title,
            stepKeys: toSessionSteps(s.steps).map(stepKey),
          },
    ]),
  );
  const transferCommitments = new Map<string, Commitment>(
    transfers.map((t) => [
      t.id,
      {
        kind: "transfer",
        id: t.id,
        destinationBatchName: t.destinationBatch.name,
      },
    ]),
  );

  const add = (animalId: string, commitment: Commitment) =>
    byAnimal.set(animalId, [...(byAnimal.get(animalId) ?? []), commitment]);

  for (const p of participations) {
    add(p.animalId, sessionCommitments.get(p.managementSessionId)!);
  }
  for (const i of transferItems) {
    add(i.animalId, transferCommitments.get(i.transferId)!);
  }

  return byAnimal;
}

// Trava os animais e falha (CommitmentError) se algum tiver compromisso que bloqueie
// a intenção. Avisos não bloqueiam: ficam a cargo das telas.
export async function assertNoConflicts(
  tx: Tx,
  animalIds: string[],
  intent: CommitmentIntent,
  exclude: CommitmentExclusion = {},
) {
  const ids = [...new Set(animalIds)];
  if (!ids.length) return;

  await lockAnimals(tx, ids);
  const commitments = await findCommitments(tx, ids, exclude);

  // Animais em conflito, agrupados pelo compromisso que os prende.
  const byCommitment = new Map<
    string,
    { commitment: Commitment; animalIds: string[] }
  >();
  for (const [animalId, list] of commitments) {
    for (const { commitment, severity } of conflictsFor(list, intent)) {
      if (severity !== "block") continue;
      const key = `${commitment.kind}:${commitment.id}`;
      const group = byCommitment.get(key) ?? { commitment, animalIds: [] };
      group.animalIds.push(animalId);
      byCommitment.set(key, group);
    }
  }
  if (!byCommitment.size) return;

  const animals = await tx.animal.findMany({
    where: {
      id: { in: [...byCommitment.values()].flatMap((g) => g.animalIds) },
    },
    select: { id: true, code: true, currentTag: true, currentRfid: true },
  });
  const labelOf = new Map(animals.map((a) => [a.id, animalLabel(a)]));

  const parts = [...byCommitment.values()].map(
    ({ commitment, animalIds }) =>
      `${summarize(animalIds.map((id) => labelOf.get(id) ?? "desconhecido"))} em ${describeCommitment(commitment, intent)}`,
  );
  throw new CommitmentError(
    `Animais comprometidos com outra operação em aberto: ${parts.join("; ")}. Conclua ou retire os animais dessa operação antes.`,
  );
}
