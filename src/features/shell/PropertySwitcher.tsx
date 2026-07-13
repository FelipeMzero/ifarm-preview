"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getPropertyOptions, PropertyOption } from "@/features/property/services";
import { getCurrentProperty, setCurrentProperty } from "./services";

export function PropertySwitcher() {
  const router = useRouter();
  const [property, setProperty] = useState<PropertyOption | null>(null);
  const [options, setOptions] = useState<PropertyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  async function refreshOptions() {
    try {
      const [freshOptions, freshProperty] = await Promise.all([getPropertyOptions(), getCurrentProperty()]);
      setOptions(freshOptions);
      setProperty(freshProperty);
    } catch {
      // mantém os dados já carregados em caso de falha na atualização
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await refreshOptions();
      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSelect(propertyId: string) {
    if (propertyId === property?.id || isSelecting) return;

    setIsSelecting(true);
    try {
      const updated = await setCurrentProperty(propertyId);
      setProperty(updated);
      router.refresh();
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
    <DropdownMenu onOpenChange={(open) => open && refreshOptions()}>
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
