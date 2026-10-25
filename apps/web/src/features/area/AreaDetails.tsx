import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Boxes, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { type AreaOccupancyHistoryEntry, type AreaRow } from "@ifarm/shared";
import { OccupancySummary } from "./occupancy";
import { areaOccupancyHistoryQuery } from "./queries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

interface AreaDetailsProps {
  area: AreaRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

export function AreaDetails({
  area,
  open,
  onOpenChange,
  onDelete,
}: AreaDetailsProps) {
  const navigate = useNavigate();

  // Histórico só com a janela aberta (null enquanto carrega; vazio se não carregar).
  const { data, isError } = useQuery({
    ...areaOccupancyHistoryQuery(area?.id ?? ""),
    enabled: open && !!area,
  });
  const entries: AreaOccupancyHistoryEntry[] | null =
    data ?? (isError ? [] : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Área de Pastagem</DialogTitle>
        </DialogHeader>

        {area && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  NOME
                </span>
                <span className="font-semibold">{area.name}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  STATUS
                </span>
                <span className="font-semibold">
                  {area.closedAt ? "Inativa" : "Ativa"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-border pb-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  ÁREA
                </span>
                <span>{area.hectares} ha</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  TAXA DE LOTAÇÃO
                </span>
                <span>{area.stockingRate} UA/ha</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-border pb-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  DIAS DE OCUPAÇÃO
                </span>
                <span>
                  {area.defaultOccupationDays != null
                    ? `${area.defaultOccupationDays} dias`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  DIAS DE DESCANSO
                </span>
                <span>
                  {area.defaultRestDays != null
                    ? `${area.defaultRestDays} dias`
                    : "—"}
                </span>
              </div>
            </div>

            <div className="border-b border-border pb-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">OCUPAÇÃO</span>
                {area.occupancy && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/lotes/${area.occupancy!.batch.id}/detalhes`)
                    }
                  >
                    <Boxes className="size-3.5" /> Ver lote
                  </Button>
                )}
              </div>
              <OccupancySummary area={area} className="text-sm" />
            </div>

            <div className="border-b border-border pb-3 text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">
                HISTÓRICO DE LOTES
              </span>
              {entries === null ? (
                <p className="text-xs text-muted-foreground">Carregando...</p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum lote ocupou esta área.
                </p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {entries.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate font-medium">
                        {h.batch.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatDate(h.enteredAt)} —{" "}
                        {h.exitedAt ? formatDate(h.exitedAt) : "atual"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="text-sm">
              <span className="text-xs text-muted-foreground block">
                OBSERVAÇÃO
              </span>
              <p className="mt-1 text-muted-foreground italic">
                {area.notes || "Nenhuma observação cadastrada."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between items-center border-t border-border pt-4">
          {area && (
            <Button
              type="button"
              variant="destructive"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start"
              onClick={() => onDelete(area.id)}
            >
              <Trash2 className="size-4 mr-2" /> Excluir
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
