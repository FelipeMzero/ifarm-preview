'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login') {
    return <main className="h-svh overflow-y-auto">{children}</main>;
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Sidebar />
      <SidebarInset className="min-h-0">
        <SidebarTrigger className="m-2" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}