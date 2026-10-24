import { Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { NavigationProgress } from "@/components/our/NavigationProgress";

// Envolve todas as páginas: o indicador de navegação vale para qualquer troca de página.
export function RootLayout() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
    </>
  );
}

// Primeira carga do app, enquanto o código da página inicial ainda não chegou.
export function AppLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}
