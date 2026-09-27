"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Beef,
  Boxes,
  ClipboardList,
  Dna,
  Fence,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Map,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { CowHead } from "@/components/icons/cow-head";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { RESOURCE_ACCESS } from "@/lib/permissions";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { PropertySwitcher } from "./PropertySwitcher";
import { ThemeToggle } from "./ThemeToggle";

// Seções fixas (sem submenu), agrupadas pelo que o usuário está fazendo. Tudo acima
// de "Administração" opera sobre a fazenda selecionada; "Administração" vale para o
// sistema todo. Criar um novo registro fica a cargo do botão "+ Adicionar" de cada
// tela de listagem.
const NAV = [
  {
    label: null,
    items: [{ href: "/painel", label: "Painel", icon: LayoutDashboard }],
  },
  {
    label: "Rebanho",
    items: [
      { href: "/animais", label: "Animais", icon: CowHead },
      { href: "/lotes", label: "Lotes", icon: Boxes },
      {
        href: "/lotes/transferencias",
        label: "Transferências",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Pastagens",
    items: [{ href: "/areas", label: "Áreas", icon: Map }],
  },
  {
    label: "Manejo",
    items: [
      { href: "/manejos", label: "Sessões de manejo", icon: ClipboardList },
      { href: "/recepcoes", label: "Recepções", icon: Truck },
    ],
  },
  {
    label: "Comercial",
    items: [{ href: "/compras", label: "Compras", icon: ShoppingCart }],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/pessoas", label: "Pessoas", icon: Users },
      { href: "/racas", label: "Raças", icon: Dna },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/propriedades", label: "Propriedades", icon: Fence },
      { href: "/usuarios", label: "Usuários", icon: UserCog },
    ],
  },
];

// Extrai o primeiro segmento da rota (ex: "/animais/novo" -> "animais") pra achar a
// entrada correspondente em RESOURCE_ACCESS — mesma lógica de match usada no proxy.
function isHrefAllowed(href: string, role: string): boolean {
  const resource = href.split("/").filter(Boolean)[0] as
    keyof typeof RESOURCE_ACCESS | undefined;
  if (!resource || !(resource in RESOURCE_ACCESS)) return true;
  return !(
    RESOURCE_ACCESS[resource].forbiddenRoles as readonly string[]
  ).includes(role);
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role ?? "";
  const [changingPassword, setChangingPassword] = useState(false);

  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => isHrefAllowed(item.href, role)),
  })).filter((group) => group.items.length > 0);

  // O item mais específico que casa com a rota fica ativo
  // (ex: /lotes/transferencias/nova → "Transferências", não "Lotes").
  const activeHref = NAV.flatMap((group) => group.items)
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarPrimitive className="border-sidebar-border" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
            >
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
        {visibleNav.map(({ label, items }) => (
          <SidebarGroup key={label ?? "inicio"}>
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map(({ href, label: itemLabel, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={href === activeHref}
                      tooltip={itemLabel}
                    >
                      <Link href={href}>
                        <Icon />
                        <span>{itemLabel}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
                      <span className="truncate font-medium">
                        {user?.name ?? "—"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email ?? ""}
                      </span>
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
              <Button
                variant="ghost"
                size="icon-sm"
                title="Sair"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <ChangePasswordDialog
        open={changingPassword}
        onOpenChange={setChangingPassword}
      />
    </SidebarPrimitive>
  );
}
