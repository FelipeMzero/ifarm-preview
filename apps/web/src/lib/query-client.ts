import { QueryClient } from "@tanstack/react-query";

// Cache dos dados da API (TanStack Query). Os dados guardados aparecem na hora ao voltar para
// uma tela e são buscados de novo em segundo plano (staleTime 0, o padrão). Uma tentativa a
// mais em caso de falha, para o erro não demorar a aparecer.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
  },
});
