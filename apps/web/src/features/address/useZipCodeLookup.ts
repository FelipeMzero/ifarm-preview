import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { geocodeQuery, zipCodeQuery } from "./queries";

/** Campos de endereço preenchidos pelo CEP (os mesmos nomes do addressFields, no shared). */
export type ZipCodeAddressField = "street" | "neighborhood" | "city" | "state";

type ZipCodeLookupOptions = {
  /** Preenche um campo de endereço do formulário. */
  setAddressField: (field: ZipCodeAddressField, value: string) => void;
  /** Se informado, busca também as coordenadas do endereço e as entrega aqui. */
  setCoordinates?: (latitude: string, longitude: string) => void;
};

/**
 * Busca do endereço pelo CEP para formulários (pessoa, propriedade): ao sair do campo de CEP,
 * preenche a rua, o bairro, a cidade e o estado e, se pedido, as coordenadas.
 */
export function useZipCodeLookup({
  setAddressField,
  setCoordinates,
}: ZipCodeLookupOptions) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  async function lookup(zipCode: string) {
    const digits = zipCode.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsLoading(true);
    try {
      const address = await queryClient.query(zipCodeQuery(digits));
      if (!address) {
        toast.error("CEP não encontrado.");
        return;
      }

      setAddressField("street", address.street);
      setAddressField("neighborhood", address.neighborhood);
      setAddressField("city", address.city);
      setAddressField("state", address.state);

      if (setCoordinates) {
        // Sem coordenadas não é erro: o usuário pode marcá-las no mapa.
        const coordinates = await queryClient
          .query(
            geocodeQuery({
              street: address.street,
              city: address.city,
              state: address.state,
              zipCode: digits,
            }),
          )
          .catch(() => null);
        if (coordinates) {
          setCoordinates(
            String(coordinates.latitude),
            String(coordinates.longitude),
          );
        }
      }
    } catch {
      toast.error("Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setIsLoading(false);
    }
  }

  return { lookup, isLoading };
}
