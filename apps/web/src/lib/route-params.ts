import { useParams } from "react-router";

/**
 * Parâmetros da URL da página atual (`:id`, `:animalId`…). Só use com os nomes declarados na
 * rota da página (src/router.tsx): ali eles sempre existem.
 */
export function useRouteParams<K extends string>() {
  return useParams() as Record<K, string>;
}
