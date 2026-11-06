import { Link } from "react-router";
import {
  Plus,
  Scale,
  ArrowRightLeft,
  ShoppingBag,
  Printer,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardBatchOption } from "@ifarm/shared";

type DashboardQuickActionsProps = {
  batches: DashboardBatchOption[];
  selectedBatchId: string;
  onSelectBatch: (batchId: string) => void;
};

export function DashboardQuickActions({
  batches,
  selectedBatchId,
  onSelectBatch,
}: DashboardQuickActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
      {/* Filtro por Lote */}
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Filtrar:
        </span>
        <Select
          value={selectedBatchId || "all"}
          onValueChange={(val) => onSelectBatch(val === "all" ? "" : val)}
        >
          <SelectTrigger className="h-9 w-[220px] text-xs">
            <SelectValue placeholder="Todos os Lotes (Fazenda)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Todos os Lotes (Fazenda Inteira)
            </SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                Lote: {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botões de Ações Rápidas */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 gap-1.5 text-xs"
        >
          <Link to="/manejos/novo">
            <Scale className="size-3.5 text-sky-600 dark:text-sky-400" />
            Novo Manejo
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 gap-1.5 text-xs"
        >
          <Link to="/lotes/transferencias/nova">
            <ArrowRightLeft className="size-3.5 text-amber-600 dark:text-amber-400" />
            Mover Lote
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 gap-1.5 text-xs"
        >
          <Link to="/animais/novo">
            <Plus className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Novo Animal
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 gap-1.5 text-xs"
        >
          <Link to="/compras/novo">
            <ShoppingBag className="size-3.5 text-purple-600 dark:text-purple-400" />
            Nova Compra
          </Link>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          onClick={() => window.print()}
        >
          <Printer className="size-3.5" />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
