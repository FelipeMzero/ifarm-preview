import { cookies } from "next/headers";
import { Sidebar } from "@/features/shell/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumb } from "@/features/shell/Breadcrumbs";
import { CurrentPropertyProvider } from "@/features/shell/CurrentPropertyProvider";
import {
  CLOSED_SECTIONS_COOKIE,
  parseClosedSections,
} from "@/features/shell/nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const closedSections = parseClosedSections(
    (await cookies()).get(CLOSED_SECTIONS_COOKIE)?.value,
  );

  return (
    <CurrentPropertyProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <Sidebar initialClosedSections={closedSections} />
        <SidebarInset className="min-h-0 min-w-0">
          <header className="flex min-w-0 shrink-0 items-center gap-2 p-2">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <AppBreadcrumb />
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </CurrentPropertyProvider>
  );
}
