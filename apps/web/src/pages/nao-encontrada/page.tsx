import { Link } from "react-router";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe.</p>
      <Link to="/" className="text-primary underline-offset-4 hover:underline">
        Voltar ao início
      </Link>
    </div>
  );
}
