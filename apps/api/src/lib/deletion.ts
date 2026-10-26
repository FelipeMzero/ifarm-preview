import { prisma, Prisma } from "@ifarm/db";
import { BusinessError } from "./errors";

type Tx = Prisma.TransactionClient;

// Regra de exclusão de uma entidade. `check` decide se o registro pode ser excluído
// e `remove` apaga o registro junto com os filhos que pertencem a ele. As FKs com
// onDelete: Restrict continuam como rede de segurança caso a regra esqueça algum vínculo.
export type DeletionPolicy = {
  // Motivo do bloqueio, ou null se a exclusão é permitida.
  check: (tx: Tx, id: string) => Promise<string | null>;
  remove: (tx: Tx, id: string) => Promise<void>;
};

export class DeletionBlockedError extends BusinessError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Verificação e exclusão na mesma transação, para que nenhum vínculo seja criado entre as duas.
export async function deleteRecord(policy: DeletionPolicy, id: string) {
  await prisma.$transaction(async (tx) => {
    const reason = await policy.check(tx, id);
    if (reason) throw new DeletionBlockedError(reason);
    await policy.remove(tx, id);
  });
}
