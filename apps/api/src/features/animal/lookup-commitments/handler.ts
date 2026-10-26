import type { Commitment, CommitmentExclusion } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { findCommitments } from "../commitments";

// Compromissos em aberto de vários animais; `exclude` é a operação sendo editada, que não
// conta como conflito.
export async function listCommitments(
  animalIds: string[],
  exclude: CommitmentExclusion = {},
): Promise<Record<string, Commitment[]>> {
  const commitments = await prisma.$transaction((tx) =>
    findCommitments(tx, animalIds, exclude),
  );
  return Object.fromEntries(commitments);
}
