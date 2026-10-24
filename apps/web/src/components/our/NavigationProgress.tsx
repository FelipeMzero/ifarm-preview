import { useLocation, useNavigation } from "react-router";
import { isProtectedPath } from "@/layouts/PageSkeleton";

// Barra no topo enquanto a próxima página carrega, nas trocas que entram ou saem da área logada
// (login → painel, sair). Dentro dela, quem indica o carregamento é o skeleton da página
// (ProtectedLayout). Só aparece se a navegação passar de ~150 ms (atraso no CSS).
export function NavigationProgress() {
  const navigation = useNavigation();
  const { pathname } = useLocation();
  if (navigation.state === "idle") return null;
  if (
    isProtectedPath(pathname) &&
    isProtectedPath(navigation.location.pathname)
  )
    return null;

  return (
    <div
      role="progressbar"
      aria-label="Carregando a página"
      className="nav-progress fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div className="nav-progress-bar h-full w-1/3 bg-primary" />
    </div>
  );
}
