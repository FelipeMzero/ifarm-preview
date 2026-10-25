import { useEffect, useState } from "react";

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const stored: unknown = JSON.parse(raw);
    // Objeto: completa com o padrão as chaves que não estavam salvas (ex.: coluna nova).
    if (isPlainObject(fallback) && isPlainObject(stored)) {
      return { ...fallback, ...stored } as T;
    }
    return typeof stored === typeof fallback ? (stored as T) : fallback;
  } catch {
    return fallback; // localStorage indisponível (navegação anônima, bloqueio) ou valor inválido
  }
}

/**
 * Como o useState, mas lembrado entre as visitas, no localStorage deste navegador. Para
 * preferências do usuário (ex.: colunas visíveis de uma lista); filtros vão na URL.
 */
export function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState(() => read(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sem localStorage: a preferência vale só até sair da tela.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
