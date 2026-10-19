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
    /** Dados extras para a tela tratar o conflito (ex.: `code` e o registro que o causou). */
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Regra de negócio violada por um valor informado; vira 400 com o erro no campo. */
export class ValidationError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
