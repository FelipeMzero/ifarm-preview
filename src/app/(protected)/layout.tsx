import { headers } from 'next/headers';
import { Sidebar } from '@/features/shell/Sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrAssignCurrentProperty } from '@/lib/current-property';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  const [propertyOptions, currentProperty] = session
    ? await Promise.all([
        prisma.property.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        getOrAssignCurrentProperty(session.user.id),
      ])
    : [[], null];

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <Sidebar initialPropertyOptions={propertyOptions} initialProperty={currentProperty} />
      <SidebarInset className="min-h-0">
        <SidebarTrigger className="m-2" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
