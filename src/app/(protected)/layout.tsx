import { Sidebar } from '@/features/shell/Sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CurrentPropertyProvider } from '@/features/shell/CurrentPropertyProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentPropertyProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <Sidebar />
        <SidebarInset className="min-h-0">
          <SidebarTrigger className="m-2" />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </CurrentPropertyProvider>
  );
}
