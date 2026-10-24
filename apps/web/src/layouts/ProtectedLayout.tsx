import { Navigate, Outlet, useLocation, useNavigation } from "react-router";
import { Loader2 } from "lucide-react";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { useSession } from "@/lib/auth-client";
import { Sidebar } from "@/features/shell/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumb } from "@/features/shell/Breadcrumbs";
import { CurrentPropertyProvider } from "@/features/shell/CurrentPropertyProvider";
import { readClosedSections } from "@/features/shell/nav";
import { isProtectedPath, PageSkeleton } from "./PageSkeleton";

// Páginas que exigem login. A sessão vem da API; sem ela, vai para o login. O papel só
// esconde as páginas que ele não acessa (a autorização de verdade é da API).
export function ProtectedLayout() {
  const { data: session, isPending } = useSession();
  const { pathname } = useLocation();
  // Enquanto a próxima página (da área logada) carrega, o skeleton dela cobre a atual.
  const navigation = useNavigation();
  const pendingPath =
    navigation.state === "loading" &&
    navigation.location.pathname !== pathname &&
    isProtectedPath(navigation.location.pathname)
      ? navigation.location.pathname
      : null;

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  const role = session.user.role ?? "";
  const forbidden = Object.entries(RESOURCE_ACCESS).some(
    ([resource, { forbiddenRoles }]) =>
      pathname.startsWith(`/${resource}`) &&
      (forbiddenRoles as readonly string[]).includes(role),
  );
  if (forbidden) return <Navigate to="/painel" replace />;

  return (
    <CurrentPropertyProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <Sidebar initialClosedSections={readClosedSections()} />
        <SidebarInset className="min-h-0 min-w-0">
          <header className="flex min-w-0 shrink-0 items-center gap-2 p-2">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <AppBreadcrumb />
          </header>
          <main className="relative min-w-0 flex-1 overflow-y-auto">
            <Outlet />
            {pendingPath && (
              <div
                aria-busy="true"
                aria-label="Carregando a página"
                className="nav-pending absolute inset-0 overflow-hidden bg-background"
              >
                <PageSkeleton pathname={pendingPath} />
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </CurrentPropertyProvider>
  );
}
