"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { propertyClient } from "@/lib/clients";
import { type PropertyOption } from "@ifarm/shared";
import { currentPropertyClient } from "@/lib/clients";

type CurrentPropertyContextValue = {
  property: PropertyOption | null;
  options: PropertyOption[];
  isLoading: boolean;
  select: (propertyId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CurrentPropertyContext =
  createContext<CurrentPropertyContextValue | null>(null);

// Fonte única da propriedade atualmente selecionada, compartilhada por qualquer
// componente dentro da área logada (troca no seletor da sidebar, uso no painel, em
// filtros futuros, etc). Sem isso, cada componente buscava por conta própria e não
// ficava sabendo quando outro trocava a propriedade selecionada.
export function CurrentPropertyProvider({ children }: { children: ReactNode }) {
  const [property, setProperty] = useState<PropertyOption | null>(null);
  const [options, setOptions] = useState<PropertyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    try {
      const [freshOptions, freshProperty] = await Promise.all([
        propertyClient.getPropertyOptions(),
        currentPropertyClient.getCurrentProperty(),
      ]);
      setOptions(freshOptions);
      setProperty(freshProperty);
    } catch {
      // mantém os dados já carregados em caso de falha na atualização
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await refresh();
      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function select(propertyId: string) {
    const updated = await currentPropertyClient.setCurrentProperty(propertyId);
    setProperty(updated);
  }

  return (
    <CurrentPropertyContext.Provider
      value={{ property, options, isLoading, select, refresh }}
    >
      {children}
    </CurrentPropertyContext.Provider>
  );
}

export function useCurrentProperty() {
  const context = useContext(CurrentPropertyContext);
  if (!context) {
    throw new Error(
      "useCurrentProperty deve ser usado dentro de um CurrentPropertyProvider",
    );
  }
  return context;
}
