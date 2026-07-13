"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDown, Tractor } from "lucide-react";
import { toast } from "sonner";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentProperty } from "./CurrentPropertyProvider";

export function PropertySwitcher() {
  const { property, options, isLoading, select, refresh } = useCurrentProperty();
  const [isSelecting, setIsSelecting] = useState(false);

  async function handleSelect(propertyId: string) {
    if (propertyId === property?.id || isSelecting) return;

    setIsSelecting(true);
    try {
      await select(propertyId);
    } catch {
      toast.error("Não foi possível trocar de propriedade.");
    } finally {
      setIsSelecting(false);
    }
  }

  if (isLoading) {
    return (
      <SidebarMenuButton size="sm" disabled className="text-muted-foreground">
        <Tractor className="size-3.5" />
        <span className="truncate text-xs">Carregando...</span>
      </SidebarMenuButton>
    );
  }

  if (options.length === 0) {
    return (
      <SidebarMenuButton size="sm" disabled className="text-muted-foreground">
        <Tractor className="size-3.5" />
        <span className="truncate text-xs">Nenhuma propriedade cadastrada</span>
      </SidebarMenuButton>
    );
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && refresh()}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="sm"
          className="text-muted-foreground data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
        >
          <Tractor className="size-3.5" />
          <span className="truncate text-xs">{property?.name ?? "Selecionar propriedade"}</span>
          <ChevronsUpDown className="ml-auto size-3.5" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Propriedade atual</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onSelect={() => handleSelect(option.id)}>
            <span className="flex-1 truncate">{option.name}</span>
            {option.id === property?.id && <CheckIcon className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
