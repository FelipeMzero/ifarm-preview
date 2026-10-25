import { useNavigate } from "react-router";
import { ErrorPage } from "@/components/our/ErrorPage";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <ErrorPage
      title="Página não encontrada"
      message="O endereço acessado não existe."
      onBack={() => navigate("/painel")}
      backLabel="Painel"
    />
  );
}
