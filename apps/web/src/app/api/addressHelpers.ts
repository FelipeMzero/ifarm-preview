import { Prisma } from "@/lib/prisma";

type AddressData = Omit<Prisma.AddressCreateInput, "person" | "property">;

/**
 * Monta a instrução de escrita da relação `address` de uma Person/Property:
 * cria/atualiza quando há dados de endereço no formulário, remove o
 * endereço órfão quando o formulário deixou os campos em branco e
 * já existia um vinculado, ou não toca na relação quando não há nada
 * a fazer (evita erro do Prisma ao tentar apagar uma relação inexistente).
 */
export function buildAddressWrite(
  addressData: AddressData | null,
  currentAddressId: number | null,
) {
  if (addressData) {
    return {
      address: { upsert: { create: addressData, update: addressData } },
    };
  }

  if (currentAddressId) {
    return { address: { delete: true } };
  }

  return {};
}
