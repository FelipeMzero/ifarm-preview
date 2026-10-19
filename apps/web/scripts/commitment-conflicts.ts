// Lista os animais que já estão em operações abertas conflitantes (ver
// docs/data-dictionary.md, seção 2.9). Só lê o banco: os conflitos precisam ser
// resolvidos pelo sistema (retirando o animal de uma das operações), senão a
// consolidação/confirmação delas passa a falhar.
//
//   pnpm check:commitments
import { prisma } from "../src/server/db";
import {
  conflictsFor,
  describeCommitment,
  type Commitment,
  type CommitmentIntent,
} from "@ifarm/shared";
import { findCommitments } from "../src/server/animal/commitments";
import { animalLabel } from "@ifarm/shared";

// A intenção que cada compromisso representou quando foi criado.
function intentOf(commitment: Commitment): CommitmentIntent {
  switch (commitment.kind) {
    case "reception":
      return { kind: "reception" };
    case "session":
      return { kind: "session", stepKeys: commitment.stepKeys };
    case "transfer":
      return { kind: "transfer" };
  }
}

async function main() {
  const [participants, transferItems] = await Promise.all([
    prisma.managementParticipant.findMany({
      where: { managementSession: { confirmedAt: null, cancelledAt: null } },
      select: { animalId: true },
    }),
    prisma.animalBatchTransferItem.findMany({
      where: {
        transfer: {
          confirmedAt: null,
          cancelledAt: null,
          managementSessionId: null,
        },
      },
      select: { animalId: true },
    }),
  ]);
  const animalIds = [
    ...new Set([...participants, ...transferItems].map((r) => r.animalId)),
  ];

  const commitments = await prisma.$transaction((tx) =>
    findCommitments(tx, animalIds),
  );

  const lines: string[] = [];
  for (const [animalId, list] of commitments) {
    list.forEach((current, i) => {
      for (const { commitment, severity } of conflictsFor(
        list.slice(i + 1),
        intentOf(current),
      )) {
        if (severity !== "block") continue;
        lines.push(
          `${animalId}\t${describeCommitment(current, intentOf(commitment))}  ×  ${describeCommitment(commitment, intentOf(current))}`,
        );
      }
    });
  }

  if (!lines.length) {
    console.log("Nenhum conflito entre operações abertas.");
    return;
  }

  const animals = await prisma.animal.findMany({
    where: { id: { in: lines.map((l) => l.split("\t")[0]) } },
    select: { id: true, code: true, currentTag: true, currentRfid: true },
  });
  const labelOf = new Map(animals.map((a) => [a.id, animalLabel(a)]));

  console.log(`${lines.length} conflito(s) entre operações abertas:\n`);
  for (const line of lines) {
    const [animalId, text] = line.split("\t");
    console.log(`- ${labelOf.get(animalId) ?? animalId}: ${text}`);
  }
  process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
