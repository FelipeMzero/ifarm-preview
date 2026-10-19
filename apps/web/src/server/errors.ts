// Erros que as funções de server/ lançam no lugar dos erros do Prisma. Quem chama (os route
// handlers) decide como apresentá-los, sem precisar conhecer o banco.

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(
    message: string,
    /** Erro por campo, quando o conflito é de um valor informado (ex.: documento já usado). */
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}
