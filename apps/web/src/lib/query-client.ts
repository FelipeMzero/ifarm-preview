import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isClientError } from "@ifarm/shared";

// Cache dos dados da API (TanStack Query). Os dados guardados aparecem na hora ao voltar para
// uma tela e são buscados de novo em segundo plano (staleTime 0, o padrão).
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Atualização em segundo plano que falhou: a tela continua com os dados que já tinha (a
    // página de erro só aparece quando não há dados). Um aviso só, mesmo com várias falhas.
    onError: (_error, query) => {
      if (query.state.data !== undefined) {
        toast.error(
          "Não foi possível atualizar os dados. A tela mostra a última versão carregada.",
          { id: "query-background-error" },
        );
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Uma tentativa a mais para falhas passageiras (rede, servidor). 4xx (não encontrado, sem
      // permissão, dados inválidos) não se repete: a resposta seria a mesma.
      retry: (failureCount, error) => !isClientError(error) && failureCount < 1,
    },
  },
});
