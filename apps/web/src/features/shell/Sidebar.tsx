'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Beef, ChevronRight, KeyRound, LayoutDashboard, LogOut, Tractor, UserCog, Users } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { RESOURCE_ACCESS } from '@/lib/permissions';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { PropertySwitcher } from './PropertySwitcher';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  {
    label: 'Animais',
    icon: Beef,
    items: [
      { href: '/animais', label: 'Animais' },
      { href: '/racas', label: 'Raças' },
    ],
  },
];

// Links diretos (sem submenu) — criar um novo registro fica a cargo do botão
// "+ Adicionar" já existente em cada tela de listagem.
const DIRECT_LINKS = [
  { href: '/pessoas', label: 'Pessoas', icon: Users },
  { href: '/propriedades', label: 'Propriedades', icon: Tractor },
  { href: '/usuarios', label: 'Usuários', icon: UserCog },
];

// Extrai o primeiro segmento da rota (ex: "/animais/novo" -> "animais") pra achar a
// entrada correspondente em RESOURCE_ACCESS — mesma lógica de match usada no proxy.
function isHrefAllowed(href: string, role: string): boolean {
  const resource = href.split('/').filter(Boolean)[0] as keyof typeof RESOURCE_ACCESS | undefined;
  if (!resource || !(resource in RESOURCE_ACCESS)) return true;
  return !(RESOURCE_ACCESS[resource].forbiddenRoles as readonly string[]).includes(role);
}

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
  const role = user?.role ?? '';
  const [changingPassword, setChangingPassword] = useState(false);

  const visibleNav = NAV
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isHrefAllowed(item.href, role)),
    }))
    .filter((group) => group.items.length > 0);

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
          <SidebarMenuItem>
            <PropertySwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/painel'}>
              <Link href="/painel">
                <LayoutDashboard />
                <span>Painel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

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

          {DIRECT_LINKS.filter((link) => isHrefAllowed(link.href, role)).map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(href)}>
                <Link href={href}>
                  <Icon />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name ?? '—'}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onSelect={() => setChangingPassword(true)}>
                    <KeyRound className="size-4" />
                    <span>Alterar senha</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
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
