import { Navigate, Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

// Páginas de quem ainda não entrou (login): com sessão, vai direto para o painel.
export function GuestLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return session ? <Navigate to="/painel" replace /> : <Outlet />;
}
