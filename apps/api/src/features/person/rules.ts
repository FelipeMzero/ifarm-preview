// Regras de negócio de pessoa (docs/requirements/mod-01-pessoas.md).
//
// Onde cada regra é garantida:
// - RN-PESSOA-01 (CPF/CNPJ válido): personSchema, em @ifarm/shared; vale no formulário e na API.
// - RN-PESSOA-02 (documento único): `taxId @unique` no schema.prisma; o conflito vira
//   ConflictError no write() de create-person e update-person.
// - RN-PESSOA-02 (tipo e documento imutáveis): withoutImmutableFields, abaixo.
// - RN-PESSOA-03 (múltiplos papéis): modelo de dados; uma só tabela Person, referenciada por
//   todos os papéis (vendedor, titular etc.).
// - Exclusão bloqueada por vínculos: FKs com onDelete: Restrict; o bloqueio vira ConflictError
//   no write() de delete-person.

// RN-PESSOA-02: tipo e documento identificam a pessoa e não mudam depois do cadastro.
export function withoutImmutableFields<
  T extends { type: unknown; taxId: unknown },
>(data: T): Omit<T, "type" | "taxId"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, taxId, ...editable } = data;
  return editable;
}
