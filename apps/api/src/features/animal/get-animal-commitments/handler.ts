import type { Commitment } from "@ifarm/shared";
import { prisma } from "@ifarm/db";
import { findCommitments } from "../commitments";

// Operações abertas que já contam com o animal, para as telas avisarem antes de salvar.
export async function getAnimalCommitments(id: string): Promise<Commitment[]> {
  const commitments = await prisma.$transaction((tx) =>
    findCommitments(tx, [id]),
  );
  return commitments.get(id) ?? [];
}
