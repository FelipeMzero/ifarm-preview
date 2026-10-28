import { Prisma } from "@ifarm/db";

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

type AddressInput = {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

/**
 * Endereço é tudo ou nada: só existe quando CEP, logradouro, cidade e UF foram informados.
 * Campos opcionais em branco viram null.
 */
export function toAddressData(input: AddressInput): AddressData | null {
  const { zipCode, street, number, complement, neighborhood, city, state } =
    input;
  if (!zipCode || !street || !city || !state) return null;

  return {
    zipCode,
    street,
    number: number || null,
    complement: complement || null,
    neighborhood: neighborhood || null,
    city,
    state,
    country: "Brasil",
  };
}
