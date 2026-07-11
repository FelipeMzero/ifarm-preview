import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Beef, ChevronRight, KeyRound, LogOut, UserCog, Users } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { signOut, useSession } from '@/lib/auth-client';
import { ChangePasswordDialog } from './ChangePasswordDialog';

const NAV = [
  {
    label: 'Animais',
    icon: Beef,
    items: [
      { href: '/animais/novo', label: 'Novo Animal' },
      { href: '/animais', label: 'Gestão de Animais' },
    ],
  },
  {
    label: 'Pessoas',
    icon: Users,
    items: [
      { href: '/pessoas/novo', label: 'Nova Pessoa' },
      { href: '/pessoas', label: 'Gestão de Pessoas' },
    ],
  },
];

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const isWorker = user?.role === 'worker';
  const [changingPassword, setChangingPassword] = useState(false);

  const visibleNav = NAV.filter((item) => !(item.label === 'Pessoas' && (isTechnician || isWorker)));

  async function handleLogout() {
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <SidebarPrimitive className='border-sidebar-border' collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Beef className="size-4" />
              </div>
              <span className="text-sm font-semibold">iFarm</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleNav.map(({ label, icon: Icon, items }) => {
            const isGroupActive = items.some((item) => pathname.startsWith(item.href));

            return (
              <Collapsible key={label} defaultOpen={isGroupActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isGroupActive}>
                      <Icon />
                      <span>{label}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {items.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                            <Link href={item.href}>
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}

          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/usuarios')}>
                <Link href="/usuarios">
                  <UserCog />
                  <span>Usuários</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg p-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name ?? '—'}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</span>
              </div>
              <Button variant="ghost" size="icon-sm" title="Alterar senha" onClick={() => setChangingPassword(true)}>
                <KeyRound className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Sair" onClick={handleLogout}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <ChangePasswordDialog open={changingPassword} onOpenChange={setChangingPassword} />
    </SidebarPrimitive>
  );
}
