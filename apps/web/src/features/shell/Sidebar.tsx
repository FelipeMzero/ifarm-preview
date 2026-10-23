import { useState } from "react";
import { Link } from "react-router";
import { useLocation, useNavigate } from "react-router";
import { Beef, ChevronRight, KeyRound, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { RESOURCE_ACCESS } from "@ifarm/shared";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { findNavMatch, NAV, saveClosedSections } from "./nav";
import { PropertySwitcher } from "./PropertySwitcher";
import { ThemeToggle } from "./ThemeToggle";

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

export function Sidebar({
  initialClosedSections,
}: {
  initialClosedSections: string[];
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role ?? "";
  const [changingPassword, setChangingPassword] = useState(false);
  // Seções que o usuário recolheu, lembradas em cookie (ver saveClosedSections).
  const [closedSections, setClosedSections] = useState(
    () => new Set(initialClosedSections),
  );
  // No modo só ícones os títulos somem, então recolher esconderia os itens sem ter
  // onde clicar para abrir de volta: ali as seções ficam sempre abertas.
  const { state, isMobile } = useSidebar();
  const iconOnly = state === "collapsed" && !isMobile;

  function toggleSection(label: string, open: boolean) {
    const next = new Set(closedSections);
    if (open) next.delete(label);
    else next.add(label);
    setClosedSections(next);
    saveClosedSections(next);
  }

  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => isHrefAllowed(item.href, role)),
  })).filter((group) => group.items.length > 0);

  const activeHref = findNavMatch(pathname)?.item.href;

  async function handleLogout() {
    await signOut();
    navigate("/login");
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
        {visibleNav.map(({ label, items }) => {
          const menu = (
            <SidebarMenu>
              {items.map(({ href, label: itemLabel, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={href === activeHref}
                    tooltip={itemLabel}
                  >
                    <Link to={href}>
                      <Icon />
                      <span>{itemLabel}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          );

          if (!label) {
            return (
              <SidebarGroup key="inicio">
                <SidebarGroupContent>{menu}</SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible
              key={label}
              open={iconOnly || !closedSections.has(label)}
              onOpenChange={(open) => toggleSection(label, open)}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <CollapsibleTrigger>
                    {label}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>{menu}</SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Recolhida (só ícones), a largura não comporta os três lado a lado. */}
            <div className="flex items-center gap-2 rounded-lg p-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:p-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:flex-none"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
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
