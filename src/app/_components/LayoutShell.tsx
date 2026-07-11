'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/login') {
    return <main className="flex-1 overflow-y-auto">{children}</main>;
  }

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <SidebarTrigger className="m-2" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}