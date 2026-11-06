import { Filter } from "lucide-react";
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
          Filtrar por lote:
        </span>
        <Select
          value={selectedBatchId || "all"}
          onValueChange={(val) => onSelectBatch(val === "all" ? "" : val)}
        >
          <SelectTrigger className="h-9 w-[240px] text-xs">
            <SelectValue placeholder="Todos os Lotes (Fazenda)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Todos os Lotes (Fazenda Inteira)
            </SelectItem>
            {(batches ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                Lote: {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
